const { SYSTEM_PROMPT, buildUserPrompt } = require('../aiPrompt');
const { ProviderTimeoutError, createTimeoutSignal } = require('./providerTimeout');

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_TIMEOUT_MS = 12000;

function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
}

function extractCitationsFromGrounding(candidate) {
  const chunks = candidate?.groundingMetadata?.groundingChunks || [];
  return chunks.map((chunk) => chunk.web?.uri).filter(Boolean);
}

async function generateHealthResponse(
  symptomText,
  language,
  { timeoutMs = DEFAULT_TIMEOUT_MS, history = [] } = {}
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  // Gemini has no 'assistant' role — prior model turns are 'model'.
  const historyContents = history.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  const requestBody = {
    contents: [
      ...historyContents,
      {
        role: 'user',
        parts: [{ text: buildUserPrompt(symptomText, language) }],
      },
    ],
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM_PROMPT }],
    },
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.4,
    },
  };

  const { signal, clear } = createTimeoutSignal(timeoutMs);
  let data;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API request failed (${response.status}): ${errorBody}`);
    }

    data = await response.json();
  } catch (error) {
    if (signal.aborted) {
      throw new ProviderTimeoutError('gemini', timeoutMs);
    }
    throw error;
  } finally {
    clear();
  }

  const candidate = data.candidates?.[0];
  const textContent = (candidate?.content?.parts || []).map((part) => part.text || '').join('');
  const parsed = JSON.parse(stripCodeFences(textContent));

  const groundingCitations = extractCitationsFromGrounding(candidate);
  const modelCitations = Array.isArray(parsed.citations) ? parsed.citations : [];
  const citations = modelCitations.length > 0 ? modelCitations : groundingCitations;

  if (citations.length === 0) {
    console.warn(
      '[geminiProvider] No citations returned for this response — Google Search grounding may not have executed as expected.'
    );
  }

  return {
    parsed: { ...parsed, citations },
    citations,
    rawResponse: data,
  };
}

module.exports = { generateHealthResponse };
