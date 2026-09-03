const Groq = require('groq-sdk');
const { SYSTEM_PROMPT, buildUserPrompt } = require('../aiPrompt');
const { ProviderTimeoutError } = require('./providerTimeout');

const DEFAULT_TIMEOUT_MS = 12000;

let cachedClient = null;

function getClient() {
  if (!cachedClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set');
    }
    cachedClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return cachedClient;
}

function extractCitationsFromExecutedTools(message, completion) {
  const executedTools = message.executed_tools || completion.executed_tools || [];
  const urls = [];

  for (const tool of executedTools) {
    const results =
      tool.search_results?.results ||
      tool.output?.results ||
      tool.results ||
      [];
    for (const result of results) {
      if (result?.url) urls.push(result.url);
    }
  }

  return urls;
}

async function generateHealthResponse(
  symptomText,
  language,
  { timeoutMs = DEFAULT_TIMEOUT_MS, history = [] } = {}
) {
  const client = getClient();
  const model = process.env.GROQ_MODEL || 'groq/compound-mini';

  let completion;
  try {
    completion = await client.chat.completions.create(
      {
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        compound_custom: {
          tools: {
            enabled_tools: ['web_search'],
          },
        },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map((message) => ({ role: message.role, content: message.content })),
          { role: 'user', content: buildUserPrompt(symptomText, language) },
        ],
      },
      { timeout: timeoutMs, maxRetries: 0 }
    );
  } catch (error) {
    if (error instanceof Groq.APIConnectionTimeoutError) {
      throw new ProviderTimeoutError('groq-compound', timeoutMs);
    }
    throw error;
  }

  const choice = completion.choices[0];
  const parsed = JSON.parse(choice.message.content);

  const toolCitations = extractCitationsFromExecutedTools(choice.message, completion);
  const modelCitations = Array.isArray(parsed.citations) ? parsed.citations : [];
  const citations = modelCitations.length > 0 ? modelCitations : toolCitations;

  if (citations.length === 0) {
    console.warn(
      '[groqProvider] No citations returned for this response — forced web_search may not have executed as expected.'
    );
  }

  return {
    parsed: { ...parsed, citations },
    citations,
    rawResponse: completion,
  };
}

async function generatePlainHealthResponse(
  symptomText,
  language,
  { timeoutMs = DEFAULT_TIMEOUT_MS, history = [] } = {}
) {
  const client = getClient();
  // llama-3.3-70b-versatile was deprecated by Groq (shutdown 2026-08-16); openai/gpt-oss-120b is its recommended replacement.
  const model = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-120b';

  let completion;
  try {
    completion = await client.chat.completions.create(
      {
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map((message) => ({ role: message.role, content: message.content })),
          { role: 'user', content: buildUserPrompt(symptomText, language) },
        ],
      },
      { timeout: timeoutMs, maxRetries: 0 }
    );
  } catch (error) {
    if (error instanceof Groq.APIConnectionTimeoutError) {
      throw new ProviderTimeoutError('groq-plain', timeoutMs);
    }
    throw error;
  }

  const choice = completion.choices[0];
  const parsed = JSON.parse(choice.message.content);

  // This path never invokes web search, so citations can't be trusted as real sources.
  const citations = [];

  return {
    parsed: { ...parsed, citations },
    citations,
    groundedInSearch: false,
    rawResponse: completion,
  };
}

module.exports = { generateHealthResponse, generatePlainHealthResponse };
