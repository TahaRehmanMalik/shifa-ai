const triageService = require('../services/triageService');
const aiService = require('../services/aiService');
const diseaseService = require('../services/diseaseService');
const conversationService = require('../services/conversationService');
const triageLogService = require('../services/triageLogService');
const crisisService = require('../services/crisisService');
const { containsUnsafeContent, buildUnsafeResponse, shapeAiResult } = require('./searchController');

const VALID_LANGUAGES = ['en', 'ur', 'pa'];
const TRIAGE_ORIGIN = 'triage';
const MAX_OTHER_CONDITIONS_LENGTH = 200;

function normalizeOtherConditions(value) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, MAX_OTHER_CONDITIONS_LENGTH) : null;
}

function describeForm(form) {
  const ageText = Number.isInteger(form.ageMonths) ? `${form.ageGroup} (${form.ageMonths} months old)` : form.ageGroup;
  const knownConditions = Array.isArray(form.conditions)
    ? form.conditions.map((condition) => condition.replace(/_/g, ' '))
    : [];
  const allConditions = form.otherConditions ? [...knownConditions, form.otherConditions] : knownConditions;
  const conditionsText = allConditions.length ? allConditions.join(', ') : 'none';
  const lines = [
    `Main complaint: ${form.mainComplaint.trim()}`,
    `Age group: ${ageText}`,
    `Sex: ${form.sex}`,
    form.isPregnant === true ? 'Pregnant: yes' : null,
    `Duration: ${form.durationDays} day(s)`,
    `Severity: ${form.severity}/10`,
    `Known conditions: ${conditionsText}`,
  ];
  return lines.filter(Boolean).join('\n');
}

function buildUrgentAdvicePrompt(form) {
  return [
    describeForm(form),
    'This person has already been told to see a doctor today at the nearest government hospital or BHU.',
    'Give brief, safe supporting advice for while they arrange to be seen.',
  ].join('\n');
}

function pickTriageInput(body) {
  return {
    ageGroup: body.ageGroup,
    ageMonths: body.ageMonths,
    sex: body.sex,
    isPregnant: body.isPregnant,
    mainComplaint: body.mainComplaint,
    durationDays: body.durationDays,
    severity: body.severity,
    redFlags: body.redFlags,
    conditions: body.conditions,
    otherConditions: normalizeOtherConditions(body.otherConditions),
  };
}

function indicatesCrisis(body) {
  const flagged = Array.isArray(body.redFlags) && body.redFlags.includes(triageService.CRISIS_RED_FLAG_ID);
  return flagged || crisisService.containsSelfHarmContent(body.mainComplaint);
}

function evaluateCrisisTriage(form) {
  const redFlags = Array.isArray(form.redFlags)
    ? [...new Set([...form.redFlags, triageService.CRISIS_RED_FLAG_ID])]
    : [triageService.CRISIS_RED_FLAG_ID];
  try {
    return triageService.evaluateTriage({ ...form, redFlags });
  } catch (error) {
    if (error instanceof triageService.TriageValidationError) {
      return triageService.buildCrisisTriage();
    }
    throw error;
  }
}

async function saveExchange(userId, userText, assistantPayload) {
  try {
    const conversationId = await conversationService.createConversation(userId);
    await conversationService.saveMessage(conversationId, 'user', userText);
    const savedPayload = { ...assistantPayload, origin: TRIAGE_ORIGIN };
    await conversationService.saveMessage(conversationId, 'assistant', JSON.stringify(savedPayload));
    return conversationId;
  } catch (error) {
    console.error('[triageController] saving conversation failed:', error.message);
    return null;
  }
}

async function logSafely(entry) {
  try {
    await triageLogService.logTriageQuery(entry);
  } catch (error) {
    console.error('[triageController] logging triage query failed:', error.message);
  }
}

async function requestAiAdvice(promptText, language) {
  try {
    const aiResult = await aiService.generateHealthResponse(promptText, language, []);
    return { aiResult, shaped: shapeAiResult(aiResult.parsed) };
  } catch (error) {
    console.error('[triageController] AI supporting advice failed:', error.message);
    return null;
  }
}

async function handleUrgent(form, triage, language, startedAt) {
  const promptText = buildUrgentAdvicePrompt(form);
  const advice = await requestAiAdvice(promptText, language);

  if (advice) {
    await logSafely({
      symptomInput: promptText,
      inputLanguage: language,
      matchedDiseaseId: null,
      source: 'ai',
      aiProvider: advice.aiResult.provider,
      aiRawResponse: advice.aiResult.rawResponse,
      citations: advice.aiResult.citations,
      responseTimeMs: Date.now() - startedAt,
      triageLevel: triage.level,
    });
  }

  return {
    response_type: 'triage_escalation',
    message_en: triage.message_en,
    message_ur: triage.message_ur,
    supporting_advice: advice ? advice.shaped : null,
    triage,
  };
}

async function findCuratedMatchSafely(mainComplaint) {
  try {
    return await diseaseService.findCuratedMatch(mainComplaint);
  } catch (error) {
    console.error('[triageController] curated lookup failed:', error.message);
    return null;
  }
}

async function handleRoutine(form, triage, language, startedAt) {
  const symptomText = describeForm(form);
  const curatedMatch = await findCuratedMatchSafely(form.mainComplaint.trim());

  if (curatedMatch) {
    const formatted = diseaseService.formatCuratedResult(curatedMatch);
    await logSafely({
      symptomInput: symptomText,
      inputLanguage: language,
      matchedDiseaseId: curatedMatch.id,
      source: 'database',
      aiProvider: null,
      aiRawResponse: null,
      citations: null,
      responseTimeMs: Date.now() - startedAt,
      triageLevel: triage.level,
    });
    return { source: 'database', ...formatted, triage };
  }

  const advice = await requestAiAdvice(symptomText, language);

  if (!advice) {
    return {
      response_type: 'triage_result',
      message_en: triage.message_en,
      message_ur: triage.message_ur,
      triage,
    };
  }

  await logSafely({
    symptomInput: symptomText,
    inputLanguage: language,
    matchedDiseaseId: null,
    source: 'ai',
    aiProvider: advice.aiResult.provider,
    aiRawResponse: advice.aiResult.rawResponse,
    citations: advice.aiResult.citations,
    responseTimeMs: Date.now() - startedAt,
    triageLevel: triage.level,
  });

  return { source: 'ai', provider: advice.aiResult.provider, ...advice.shaped, triage };
}

async function triage(req, res) {
  const startedAt = Date.now();
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const language = body.language === undefined ? 'en' : body.language;

  if (typeof body.mainComplaint !== 'string' || !body.mainComplaint.trim()) {
    return res.status(400).json({ error: 'mainComplaint is required', field: 'mainComplaint' });
  }
  if (!VALID_LANGUAGES.includes(language)) {
    return res.status(400).json({ error: `language must be one of ${VALID_LANGUAGES.join(', ')}`, field: 'language' });
  }

  try {
    if (indicatesCrisis(body)) {
      const crisisTriage = evaluateCrisisTriage(pickTriageInput(body));
      const payload = { response_type: 'triage_escalation', triage: crisisTriage };
      const conversationId = await saveExchange(req.userId, body.mainComplaint.trim(), payload);
      console.log(`[triageController][timing] level=emergency source=crisis elapsedMs=${Date.now() - startedAt}`);
      return res.json({ conversationId, ...payload });
    }

    if (containsUnsafeContent(body.mainComplaint)) {
      const unsafeResponse = buildUnsafeResponse();
      const conversationId = await saveExchange(req.userId, body.mainComplaint, unsafeResponse);
      return res.json({ source: 'blocked', conversationId, ...unsafeResponse });
    }

    const form = pickTriageInput(body);
    let triageResult;
    try {
      triageResult = triageService.evaluateTriage(form);
    } catch (error) {
      if (error instanceof triageService.TriageValidationError) {
        return res.status(400).json({ error: error.message, field: error.field });
      }
      throw error;
    }

    let payload;
    if (triageResult.level === 'emergency') {
      payload = { response_type: 'triage_escalation', triage: triageResult };
    } else if (triageResult.level === 'urgent') {
      payload = await handleUrgent(form, triageResult, language, startedAt);
    } else {
      payload = await handleRoutine(form, triageResult, language, startedAt);
    }

    const conversationId = await saveExchange(req.userId, describeForm(form), payload);

    console.log(
      `[triageController][timing] level=${triageResult.level} source=${payload.source || 'triage'} elapsedMs=${Date.now() - startedAt}`
    );

    return res.json({ conversationId, ...payload, triage: triageResult });
  } catch (error) {
    console.error('[triageController] triage failed:', error);
    return res.status(500).json({ error: 'Failed to process triage request', details: error.message });
  }
}

module.exports = { triage };
