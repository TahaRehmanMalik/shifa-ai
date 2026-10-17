const Groq = require('groq-sdk');
const { ProviderTimeoutError, createTimeoutSignal } = require('./providers/providerTimeout');

const TRANSLATION_TIMEOUT_MS = 20000;
const MAX_SOURCE_TEXT_LENGTH = 6000;
const TRANSLATABLE_FIELDS = ['condition', 'root_cause', 'diet_plan', 'medicine_class', 'medicine_summary'];

const TRANSLATION_SYSTEM_PROMPT = `You translate health-education text for Shifa AI into Punjabi written in the Shahmukhi (Perso-Arabic) script, as spoken in Pakistani Punjab. Never use Gurmukhi script and never answer in plain Urdu — use natural Punjabi vocabulary and grammar (for example "دا/دی/دے", "وچ", "نوں", "توں", "اے", "نیں"). Keep medicine names, abbreviations (such as ORS, PPIs, ACE inhibitors) and numbers unchanged. Do not add, remove, or change any medical meaning, and never add dosage amounts. Respond with ONLY a single valid JSON object that has exactly the same keys you were given, each mapped to its Punjabi translation — no markdown, no code fences, no extra text.`;

let cachedGroqClient = null;

function getGroqClient() {
  if (!cachedGroqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set');
    }
    cachedGroqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return cachedGroqClient;
}

function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
}

function pickSourceText(result, field) {
  const urduText = result[`${field}_ur`];
  const englishText = result[`${field}_en`];
  const sourceText = typeof urduText === 'string' && urduText.trim() ? urduText : englishText;
  return typeof sourceText === 'string' && sourceText.trim() ? sourceText.slice(0, MAX_SOURCE_TEXT_LENGTH) : null;
}

function buildTranslationRequest(result) {
  const request = {};
  for (const field of TRANSLATABLE_FIELDS) {
    const sourceText = pickSourceText(result, field);
    if (sourceText) {
      request[`${field}_pa`] = sourceText;
    }
  }
  return request;
}

async function translateWithGroq(userPrompt) {
  const model = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-120b';
  try {
    const completion = await getGroqClient().chat.completions.create(
      {
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      },
      { timeout: TRANSLATION_TIMEOUT_MS, maxRetries: 0 }
    );
    return completion.choices[0].message.content;
  } catch (error) {
    if (error instanceof Groq.APIConnectionTimeoutError) {
      throw new ProviderTimeoutError('groq-translation', TRANSLATION_TIMEOUT_MS);
    }
    throw error;
  }
}

async function translateWithOpenRouter(userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const { signal, clear } = createTimeoutSignal(TRANSLATION_TIMEOUT_MS);
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API request failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    if (signal.aborted) {
      throw new ProviderTimeoutError('openrouter-translation', TRANSLATION_TIMEOUT_MS);
    }
    throw error;
  } finally {
    clear();
  }
}

async function translateWithGemini(userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const { signal, clear } = createTimeoutSignal(TRANSLATION_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { role: 'system', parts: [{ text: TRANSLATION_SYSTEM_PROMPT }] },
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API request failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    return parts.map((part) => part.text || '').join('');
  } catch (error) {
    if (signal.aborted) {
      throw new ProviderTimeoutError('gemini-translation', TRANSLATION_TIMEOUT_MS);
    }
    throw error;
  } finally {
    clear();
  }
}

const TRANSLATION_PROVIDER_CHAIN = [
  { name: 'groq', translate: translateWithGroq },
  { name: 'openrouter', translate: translateWithOpenRouter },
  { name: 'gemini', translate: translateWithGemini },
];

function keepRequestedPunjabiFields(parsed, request) {
  const translated = {};
  for (const key of Object.keys(request)) {
    const value = parsed[key];
    if (typeof value === 'string' && value.trim()) {
      translated[key] = value.trim();
    }
  }
  return translated;
}

async function translateResultToPunjabi(result) {
  const request = buildTranslationRequest(result);
  if (Object.keys(request).length === 0) {
    return {};
  }

  const userPrompt = `Translate every value of this JSON object into Punjabi (Shahmukhi script) and return the same keys:\n${JSON.stringify(request)}`;

  for (const { name, translate } of TRANSLATION_PROVIDER_CHAIN) {
    try {
      const content = await translate(userPrompt);
      const translated = keepRequestedPunjabiFields(JSON.parse(stripCodeFences(content)), request);
      if (Object.keys(translated).length > 0) {
        return translated;
      }
      console.warn(`[punjabiTranslationService] Provider "${name}" returned no usable Punjabi fields.`);
    } catch (error) {
      console.warn(`[punjabiTranslationService] Provider "${name}" failed (${error.message}).`);
    }
  }

  throw new Error('Punjabi translation is temporarily unavailable. Please try again in a moment.');
}

module.exports = { translateResultToPunjabi };
