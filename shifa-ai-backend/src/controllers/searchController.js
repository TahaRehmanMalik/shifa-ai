const diseaseService = require('../services/diseaseService');
const aiService = require('../services/aiService');
const logService = require('../services/logService');
const conversationService = require('../services/conversationService');
const punjabiTranslationService = require('../services/punjabiTranslationService');
const crisisService = require('../services/crisisService');
const { DISCLAIMER_EN, DISCLAIMER_UR, DISCLAIMER_PA } = require('../services/aiPrompt');

const VALID_LANGUAGES = ['en', 'ur', 'pa'];
const VALID_INPUT_MODES = ['text', 'voice'];

// Heuristic only — there's no NLP layer here. A message that leans on
// referential/conversational cues is treated as a follow-up, since the
// curated DB has no memory of prior turns and would otherwise be asked to
// match on fragments like "what about turmeric for this?".
const FOLLOW_UP_PATTERN = /\b(this|that|it|these|those|instead|also|again|more|another|same)\b|what about|how about/i;

function looksLikeFollowUp(symptomText) {
  return FOLLOW_UP_PATTERN.test(symptomText.trim());
}

const OFF_TOPIC_MESSAGE_EN =
  'Shifa AI can only help with questions about symptoms, diseases, or medicine. Please describe a health concern.';
const OFF_TOPIC_MESSAGE_UR =
  'شفاء AI صرف علامات، بیماریوں یا ادویات سے متعلق سوالات میں مدد کر سکتا ہے۔ براہ کرم اپنا صحت سے متعلق مسئلہ بیان کریں۔';

const OFF_TOPIC_MESSAGE_PA =
  'شفاء AI صرف علامتاں، بیماریاں یا دوائیاں بارے سوالاں وچ مدد کر سکدا اے۔ مہربانی کر کے اپنی صحت دا مسئلہ دسو۔';

const UNSAFE_MESSAGE_EN =
  "We're not able to provide this information as it could be harmful. Please visit your nearest hospital and consult a doctor.";
const UNSAFE_MESSAGE_UR =
  'ہم یہ معلومات فراہم نہیں کر سکتے کیونکہ یہ نقصان دہ ہو سکتی ہے۔ براہ کرم اپنے قریبی ہسپتال جائیں اور ڈاکٹر سے مشورہ کریں۔';

const UNSAFE_MESSAGE_PA =
  'اسیں ایہہ جانکاری نئیں دے سکدے کیوں جے ایہہ نقصان دہ ہو سکدی اے۔ مہربانی کر کے اپنے نیڑے دے ہسپتال جاؤ تے ڈاکٹر نال صلاح کرو۔';

function punjabiTextOrNull(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function buildOffTopicResponse() {
  return {
    response_type: 'off_topic',
    message_en: OFF_TOPIC_MESSAGE_EN,
    message_ur: OFF_TOPIC_MESSAGE_UR,
    message_pa: OFF_TOPIC_MESSAGE_PA,
  };
}

function buildUnsafeResponse() {
  return {
    response_type: 'unsafe_request',
    message_en: UNSAFE_MESSAGE_EN,
    message_ur: UNSAFE_MESSAGE_UR,
    message_pa: UNSAFE_MESSAGE_PA,
  };
}

// Fast, deterministic safety net that doesn't depend on the model behaving
// correctly — matched before the curated database or any AI provider is
// ever called.
const UNSAFE_TEXT_PATTERNS = [
  /overdose/i,
  /lethal\s+dose/i,
  /lethal\s+amount/i,
  /fatal\s+dose/i,
  /toxic\s+dose/i,
  /how\s+(much|many).{0,30}(to\s+take|dose).{0,20}(die|kill|death)/i,
  /how\s+to\s+(kill|poison|harm)/i,
  /poison(ing)?\s+(someone|somebody|a\s+person|him|her|them)/i,
  /an[ae]sthesia\s+dosage/i,
  /an[ae]sthesia\s+dose/i,
  /knock\s+(someone|somebody|him|her|them)\s+out/i,
  /how\s+to\s+overdose/i,
  /suicide\s+(dose|method|pill)/i,
  /kill\s+(myself|someone|somebody|a\s+person)/i,
  /chloroform\s+(someone|somebody|him|her|them)/i,
];

function containsUnsafeContent(symptomText) {
  return UNSAFE_TEXT_PATTERNS.some((pattern) => pattern.test(symptomText));
}

// Shapes a raw AI parse into the safe, response_type-specific payload the
// frontend is allowed to see. health_query keeps the full existing schema;
// medicine_info is trimmed to just its summary; off_topic and unsafe_request
// discard whatever the model wrote and substitute the fixed backend message.
function shapeAiResult(parsed) {
  const responseType = parsed && parsed.response_type;

  if (responseType === 'medicine_info') {
    return {
      response_type: 'medicine_info',
      medicine_summary_en: parsed.medicine_summary_en || '',
      medicine_summary_ur: parsed.medicine_summary_ur || '',
      medicine_summary_pa: punjabiTextOrNull(parsed.medicine_summary_pa),
      disclaimer_en: DISCLAIMER_EN,
      disclaimer_ur: DISCLAIMER_UR,
      disclaimer_pa: DISCLAIMER_PA,
    };
  }

  if (responseType === 'off_topic') {
    return buildOffTopicResponse();
  }

  if (responseType === 'unsafe_request') {
    return buildUnsafeResponse();
  }

  return {
    response_type: 'health_query',
    condition_en: parsed.condition_en,
    condition_ur: parsed.condition_ur,
    condition_pa: punjabiTextOrNull(parsed.condition_pa),
    root_cause_en: parsed.root_cause_en,
    root_cause_ur: parsed.root_cause_ur,
    root_cause_pa: punjabiTextOrNull(parsed.root_cause_pa),
    diet_plan_en: parsed.diet_plan_en,
    diet_plan_ur: parsed.diet_plan_ur,
    diet_plan_pa: punjabiTextOrNull(parsed.diet_plan_pa),
    medicine_class_en: parsed.medicine_class_en,
    medicine_class_ur: parsed.medicine_class_ur,
    medicine_class_pa: punjabiTextOrNull(parsed.medicine_class_pa),
    disclaimer_en: DISCLAIMER_EN,
    disclaimer_ur: DISCLAIMER_UR,
    disclaimer_pa: DISCLAIMER_PA,
    citations: Array.isArray(parsed.citations) ? parsed.citations : [],
  };
}

async function search(req, res) {
  const startedAt = Date.now();
  const requestStartIso = new Date(startedAt).toISOString();
  const { symptomText, language, inputMode, conversationId } = req.body;

  if (!symptomText || typeof symptomText !== 'string' || !symptomText.trim()) {
    return res.status(400).json({ error: 'symptomText is required' });
  }
  if (!VALID_LANGUAGES.includes(language)) {
    return res.status(400).json({ error: `language must be one of ${VALID_LANGUAGES.join(', ')}` });
  }
  const resolvedInputMode = VALID_INPUT_MODES.includes(inputMode) ? inputMode : 'text';

  try {
    let resolvedConversationId = conversationId;

    if (resolvedConversationId) {
      const owns = await conversationService.conversationBelongsToUser(resolvedConversationId, req.userId);
      if (!owns) {
        return res.status(404).json({ error: 'conversationId not found' });
      }
    } else {
      resolvedConversationId = await conversationService.createConversation(req.userId);
    }

    const fixedResponse = crisisService.containsSelfHarmContent(symptomText)
      ? { source: 'crisis', payload: crisisService.buildCrisisResponse() }
      : containsUnsafeContent(symptomText)
        ? { source: 'blocked', payload: buildUnsafeResponse() }
        : null;

    if (fixedResponse) {
      await conversationService.saveMessage(resolvedConversationId, 'user', symptomText);
      await conversationService.saveMessage(resolvedConversationId, 'assistant', JSON.stringify(fixedResponse.payload));

      const totalEndAt = Date.now();
      console.log(
        `[searchController][timing] total source=${fixedResponse.source} start=${requestStartIso} end=${new Date(totalEndAt).toISOString()} elapsedMs=${totalEndAt - startedAt}`
      );

      return res.json({ source: fixedResponse.source, conversationId: resolvedConversationId, ...fixedResponse.payload });
    }

    const isFollowUp = Boolean(conversationId) && looksLikeFollowUp(symptomText);
    const curatedMatch = isFollowUp ? null : await diseaseService.findCuratedMatch(symptomText);

    if (curatedMatch) {
      const formatted = diseaseService.formatCuratedResult(curatedMatch);
      const responseTimeMs = Date.now() - startedAt;

      await logService.logQuery({
        symptomInput: symptomText,
        inputLanguage: language,
        inputMode: resolvedInputMode,
        matchedDiseaseId: curatedMatch.id,
        source: 'database',
        aiProvider: null,
        aiRawResponse: null,
        citations: null,
        responseTimeMs,
      });

      await conversationService.saveMessage(resolvedConversationId, 'user', symptomText);
      await conversationService.saveMessage(resolvedConversationId, 'assistant', JSON.stringify(formatted));

      const totalEndAt = Date.now();
      console.log(
        `[searchController][timing] total source=database start=${requestStartIso} end=${new Date(totalEndAt).toISOString()} elapsedMs=${totalEndAt - startedAt}`
      );

      return res.json({ source: 'database', conversationId: resolvedConversationId, ...formatted });
    }

    const history = conversationId ? await conversationService.getRecentMessages(resolvedConversationId, 6) : [];
    const aiResult = await aiService.generateHealthResponse(symptomText, language, history);
    const responseTimeMs = Date.now() - startedAt;

    await logService.logQuery({
      symptomInput: symptomText,
      inputLanguage: language,
      inputMode: resolvedInputMode,
      matchedDiseaseId: null,
      source: 'ai',
      aiProvider: aiResult.provider,
      aiRawResponse: aiResult.rawResponse,
      citations: aiResult.citations,
      responseTimeMs,
    });

    const shapedResult = shapeAiResult(aiResult.parsed);

    await conversationService.saveMessage(resolvedConversationId, 'user', symptomText);
    await conversationService.saveMessage(resolvedConversationId, 'assistant', JSON.stringify(shapedResult));

    const totalEndAt = Date.now();
    console.log(
      `[searchController][timing] total source=ai provider=${aiResult.provider} start=${requestStartIso} end=${new Date(totalEndAt).toISOString()} elapsedMs=${totalEndAt - startedAt}`
    );

    return res.json({
      source: 'ai',
      provider: aiResult.provider,
      conversationId: resolvedConversationId,
      ...shapedResult,
    });
  } catch (error) {
    const totalEndAt = Date.now();
    console.log(
      `[searchController][timing] total source=error start=${requestStartIso} end=${new Date(totalEndAt).toISOString()} elapsedMs=${totalEndAt - startedAt}`
    );
    console.error('[searchController] search failed:', error);
    return res.status(500).json({ error: 'Failed to process symptom search', details: error.message });
  }
}

async function listDiseases(req, res) {
  try {
    const diseases = await diseaseService.listDiseases();
    return res.json(diseases);
  } catch (error) {
    console.error('[searchController] listDiseases failed:', error);
    return res.status(500).json({ error: 'Failed to fetch diseases' });
  }
}

async function getDisease(req, res) {
  try {
    const disease = await diseaseService.getDiseaseById(req.params.id);
    if (!disease) {
      return res.status(404).json({ error: 'Disease not found' });
    }
    return res.json({
      source: 'database',
      id: disease.id,
      name_pa: disease.name_pa,
      ...diseaseService.formatCuratedResult(disease),
    });
  } catch (error) {
    console.error('[searchController] getDisease failed:', error);
    return res.status(500).json({ error: 'Failed to fetch disease' });
  }
}

async function translateToPunjabi(req, res) {
  const { result } = req.body;

  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return res.status(400).json({ error: 'result is required' });
  }

  try {
    const translated = await punjabiTranslationService.translateResultToPunjabi(result);
    return res.json({ ...translated, disclaimer_pa: DISCLAIMER_PA });
  } catch (error) {
    console.error('[searchController] translateToPunjabi failed:', error);
    return res.status(502).json({ error: error.message });
  }
}

module.exports = {
  search,
  listDiseases,
  getDisease,
  translateToPunjabi,
  containsUnsafeContent,
  buildUnsafeResponse,
  shapeAiResult,
};
