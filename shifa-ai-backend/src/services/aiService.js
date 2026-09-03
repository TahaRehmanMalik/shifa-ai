require('dotenv').config();
const groqProvider = require('./providers/groqProvider');
const geminiProvider = require('./providers/geminiProvider');
const openrouterProvider = require('./providers/openrouterProvider');
const { ProviderTimeoutError } = require('./providers/providerTimeout');

const PRIMARY_PROVIDER = 'groq';
const PROVIDER_TIMEOUT_MS = 12000;

// Ordered fastest/most-reliable first, based on observed latency and error
// rates. groq-plain (openai/gpt-oss-120b, no forced tool use) is proven
// fastest and most reliable in testing. groq-compound (compound-mini with
// web_search forced on) is the slowest and most error-prone, so it's tried
// last, only reached once every faster option has failed.
const PROVIDER_CHAIN = [
  {
    name: 'groq-plain',
    provider: { generateHealthResponse: groqProvider.generatePlainHealthResponse },
  },
  { name: 'openrouter', provider: openrouterProvider },
  { name: 'gemini', provider: geminiProvider },
  {
    name: 'groq-compound',
    provider: { generateHealthResponse: groqProvider.generateHealthResponse },
  },
];

function getActiveProviderName() {
  return PRIMARY_PROVIDER;
}

async function generateHealthResponse(symptomText, language, history = []) {
  const chainStart = Date.now();
  const failures = [];
  const lastProviderName = PROVIDER_CHAIN[PROVIDER_CHAIN.length - 1].name;

  for (const { name, provider } of PROVIDER_CHAIN) {
    const attemptStart = Date.now();
    try {
      const result = await provider.generateHealthResponse(symptomText, language, {
        timeoutMs: PROVIDER_TIMEOUT_MS,
        history,
      });
      const attemptEnd = Date.now();
      console.log(
        `[aiService][timing] provider="${name}" status=success start=${new Date(attemptStart).toISOString()} end=${new Date(attemptEnd).toISOString()} elapsedMs=${attemptEnd - attemptStart}`
      );
      if (name === lastProviderName && failures.length > 0) {
        console.warn(
          `[aiService] All faster providers failed (${failures.join(', ')}) — served from the last-resort "${name}" fallback.`
        );
      } else if (failures.length > 0) {
        console.warn(`[aiService] Provider "${name}" succeeded after failures from: ${failures.join(', ')}.`);
      }
      console.log(
        `[aiService][timing] TOTAL chain start=${new Date(chainStart).toISOString()} end=${new Date(attemptEnd).toISOString()} elapsedMs=${attemptEnd - chainStart} resolvedBy="${name}" attempts=${failures.length + 1}`
      );
      return { ...result, provider: name };
    } catch (error) {
      const attemptEnd = Date.now();
      const isTimeout = error instanceof ProviderTimeoutError;
      console.log(
        `[aiService][timing] provider="${name}" status=failure start=${new Date(attemptStart).toISOString()} end=${new Date(attemptEnd).toISOString()} elapsedMs=${attemptEnd - attemptStart}`
      );
      failures.push(isTimeout ? `${name} (timeout)` : name);
      const isLast = name === lastProviderName;
      const log = isLast ? console.error : console.warn;
      const nextStep = isLast ? 'No providers available.' : 'Falling back to the next provider.';
      const reason = isTimeout ? `timed out after ${PROVIDER_TIMEOUT_MS}ms` : error.message;
      log(`[aiService] Provider "${name}" failed (${reason}). ${nextStep}`);
    }
  }

  const chainEnd = Date.now();
  console.log(
    `[aiService][timing] TOTAL chain start=${new Date(chainStart).toISOString()} end=${new Date(chainEnd).toISOString()} elapsedMs=${chainEnd - chainStart} resolvedBy=none attempts=${failures.length}`
  );

  throw new Error('Our AI health assistant is temporarily unavailable. Please try again in a moment.');
}

module.exports = { generateHealthResponse, getActiveProviderName };
