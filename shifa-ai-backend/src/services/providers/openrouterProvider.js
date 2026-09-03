const { SYSTEM_PROMPT, buildUserPrompt } = require('../aiPrompt');
const { ProviderTimeoutError, createTimeoutSignal } = require('./providerTimeout');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Hard cap, independent of whatever timeoutMs aiService passes down — a live
// test observed OpenRouter's free-tier model hang for 190s+ (headers arrive
// fine, but the response body can stall indefinitely). The AbortController
// signal must stay live through the response.json()/text() read too, not
// just the initial fetch() call, or a slow body bypasses the timeout entirely.
const OPENROUTER_TIMEOUT_MS = 8000;

function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
}

async function generateHealthResponse(symptomText, language, { history = [] } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const model = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';

  const { signal, clear } = createTimeoutSignal(OPENROUTER_TIMEOUT_MS);
  let data;
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map((message) => ({ role: message.role, content: message.content })),
          { role: 'user', content: buildUserPrompt(symptomText, language) },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API request failed (${response.status}): ${errorBody}`);
    }

    data = await response.json();
  } catch (error) {
    if (signal.aborted) {
      throw new ProviderTimeoutError('openrouter', OPENROUTER_TIMEOUT_MS);
    }
    throw error;
  } finally {
    clear();
  }

  const content = data.choices?.[0]?.message?.content || '';
  const parsed = JSON.parse(stripCodeFences(content));

  // This model has no built-in web search, so any citations it produces would be
  // unverified/hallucinated — never surface them as if they came from a real search.
  const citations = [];

  return {
    parsed: { ...parsed, citations },
    citations,
    groundedInSearch: false,
    rawResponse: data,
  };
}

module.exports = { generateHealthResponse };
