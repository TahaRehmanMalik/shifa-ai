const defaultRules = require('../config/triageRules.json');

const AGE_GROUPS = ['infant', 'child', 'adult', 'elderly'];
const SEXES = ['male', 'female', 'other'];
const MAX_COMPLAINT_LENGTH = 2000;
const CRISIS_RED_FLAG_ID = 'suicidal_thoughts';

class TriageValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'TriageValidationError';
    this.code = 'TRIAGE_VALIDATION_ERROR';
    this.field = field;
  }
}

function isPresent(value) {
  return value !== undefined && value !== null;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateStringList(field, value, knownIds, unknownLabel) {
  if (!isPresent(value)) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new TriageValidationError(field, `${field} must be an array`);
  }
  for (const id of value) {
    if (typeof id !== 'string' || !knownIds.includes(id)) {
      throw new TriageValidationError(field, `Unknown ${unknownLabel} id: ${String(id)}`);
    }
  }
  return [...new Set(value)];
}

function validateInput(input, rules) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TriageValidationError('input', 'Triage input must be an object');
  }

  const { ageGroup, ageMonths, sex, isPregnant, mainComplaint, durationDays, severity } = input;

  if (!AGE_GROUPS.includes(ageGroup)) {
    throw new TriageValidationError('ageGroup', `ageGroup is required and must be one of ${AGE_GROUPS.join(', ')}`);
  }
  if (isPresent(ageMonths) && (!Number.isInteger(ageMonths) || ageMonths < 0)) {
    throw new TriageValidationError('ageMonths', 'ageMonths must be a non-negative whole number');
  }
  if (!SEXES.includes(sex)) {
    throw new TriageValidationError('sex', `sex is required and must be one of ${SEXES.join(', ')}`);
  }
  if (isPresent(isPregnant) && typeof isPregnant !== 'boolean') {
    throw new TriageValidationError('isPregnant', 'isPregnant must be true or false');
  }
  if (typeof mainComplaint !== 'string' || !mainComplaint.trim()) {
    throw new TriageValidationError('mainComplaint', 'mainComplaint is required');
  }
  if (mainComplaint.length > MAX_COMPLAINT_LENGTH) {
    throw new TriageValidationError('mainComplaint', `mainComplaint must be at most ${MAX_COMPLAINT_LENGTH} characters`);
  }
  if (!isFiniteNumber(durationDays) || durationDays < 0) {
    throw new TriageValidationError('durationDays', 'durationDays is required and must be a number of 0 or more');
  }
  if (!isFiniteNumber(severity) || severity < 0 || severity > 10) {
    throw new TriageValidationError('severity', 'severity is required and must be a number from 0 to 10');
  }

  const redFlagIds = rules.redFlags.map((flag) => flag.id);
  const redFlags = validateStringList('redFlags', input.redFlags, redFlagIds, 'red flag');
  const conditions = validateStringList('conditions', input.conditions, rules.knownConditions, 'condition');
  const pregnant = isPregnant === true || conditions.includes('pregnancy');

  return {
    ageGroup,
    ageMonths: isPresent(ageMonths) ? ageMonths : null,
    sex,
    isPregnant: pregnant,
    mainComplaint: mainComplaint.trim(),
    complaintText: normalizeText(mainComplaint),
    durationDays,
    severity,
    redFlags,
    conditions: pregnant && !conditions.includes('pregnancy') ? [...conditions, 'pregnancy'] : conditions,
  };
}

function normalizeText(text) {
  return text.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsPhrase(text, phrase) {
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(normalizeText(phrase))}(?=$|[^\\p{L}\\p{N}])`, 'u');
  return pattern.test(text);
}

function containsAnyPhrase(text, phrases) {
  return Array.isArray(phrases) && phrases.some((phrase) => containsPhrase(text, phrase));
}

function toReason(rule, level) {
  const reason = { id: rule.id, label_en: rule.label_en, label_ur: rule.label_ur, level };
  if (rule.message_en || rule.message_ur) {
    reason.message_en = rule.message_en || null;
    reason.message_ur = rule.message_ur || null;
  }
  return reason;
}

function redFlagDetectedInComplaint(flag, patient) {
  if (!flag.appliesTo.includes(patient.ageGroup)) {
    return false;
  }
  if (flag.requiresPregnancy && !patient.isPregnant) {
    return false;
  }
  if (!containsAnyPhrase(patient.complaintText, flag.keywords)) {
    return false;
  }
  if (flag.alsoRequiresKeywords && !containsAnyPhrase(patient.complaintText, flag.alsoRequiresKeywords)) {
    return false;
  }
  return true;
}

function matchRedFlags(patient, rules) {
  return rules.redFlags
    .filter((flag) => patient.redFlags.includes(flag.id) || redFlagDetectedInComplaint(flag, patient))
    .map((flag) => {
      const level = (flag.levelByAgeGroup && flag.levelByAgeGroup[patient.ageGroup]) || flag.level;
      return toReason(flag, level);
    });
}

function ageRuleMatches(rule, patient) {
  if (!rule.ageGroups.includes(patient.ageGroup)) {
    return false;
  }
  if (isPresent(rule.maxAgeMonthsExclusive)) {
    const ageMatches =
      patient.ageMonths === null ? rule.matchWhenAgeMonthsUnknown === true : patient.ageMonths < rule.maxAgeMonthsExclusive;
    if (!ageMatches) {
      return false;
    }
  }
  if (rule.complaintKeywords && !containsAnyPhrase(patient.complaintText, rule.complaintKeywords)) {
    return false;
  }
  return true;
}

function matchAgeRules(patient, rules) {
  return rules.ageRules.filter((rule) => ageRuleMatches(rule, patient)).map((rule) => toReason(rule, rule.level));
}

function matchSeverityRules(patient, rules) {
  return rules.severityRules
    .filter((rule) => patient.severity >= rule.minSeverity && patient.severity <= rule.maxSeverity)
    .map((rule) => toReason(rule, rule.level));
}

function matchDurationRules(patient, rules) {
  return rules.durationRules
    .filter((rule) => patient.durationDays > rule.moreThanDays)
    .map((rule) => toReason(rule, rule.level));
}

function matchRiskFactorRules(patient, rules) {
  return rules.riskFactorRules.filter(
    (rule) => patient.conditions.includes(rule.condition) && patient.severity >= rule.minSeverity
  );
}

function rankOf(level, rules) {
  const rank = rules.levelOrder.indexOf(level);
  if (rank === -1) {
    throw new Error(`triageRules.json references an unknown level: ${level}`);
  }
  return rank;
}

function joinMessages(parts) {
  return parts.filter(Boolean).join(' ');
}

function findRedFlag(id, rules) {
  const flag = rules.redFlags.find((redFlag) => redFlag.id === id);
  if (!flag) {
    throw new Error(`triageRules.json is missing the ${id} red flag`);
  }
  return flag;
}

function buildCrisisTriage(rules = defaultRules) {
  const flag = findRedFlag(CRISIS_RED_FLAG_ID, rules);
  const levelContent = rules.levels.emergency;
  return {
    level: 'emergency',
    reasons: [{ id: flag.id, label_en: flag.label_en, label_ur: flag.label_ur }],
    escalate: true,
    message_en: joinMessages([flag.message_en, levelContent.message_en]),
    message_ur: joinMessages([flag.message_ur, levelContent.message_ur]),
    action_en: levelContent.action_en,
    action_ur: levelContent.action_ur,
  };
}

function evaluateTriage(input, rules = defaultRules) {
  const patient = validateInput(input, rules);

  const directMatches = [
    ...matchRedFlags(patient, rules),
    ...matchAgeRules(patient, rules),
    ...matchSeverityRules(patient, rules),
    ...matchDurationRules(patient, rules),
  ];

  const baseRank = directMatches.reduce((highest, match) => Math.max(highest, rankOf(match.level, rules)), 0);
  const riskMatches = matchRiskFactorRules(patient, rules);
  const topRank = rules.levelOrder.length - 1;
  const raiseBy = riskMatches.reduce((largest, rule) => Math.max(largest, rule.raiseBy), 0);
  const finalRank = Math.min(baseRank + raiseBy, topRank);
  const level = rules.levelOrder[finalRank];

  const riskReasons = riskMatches.map((rule) => toReason(rule, level));
  const matches = [...directMatches, ...riskReasons].sort((a, b) => rankOf(b.level, rules) - rankOf(a.level, rules));
  const levelContent = rules.levels[level];

  return {
    level,
    reasons: matches.map(({ id, label_en, label_ur }) => ({ id, label_en, label_ur })),
    escalate: rules.escalationLevels.includes(level),
    message_en: joinMessages([...matches.map((match) => match.message_en), levelContent.message_en]),
    message_ur: joinMessages([...matches.map((match) => match.message_ur), levelContent.message_ur]),
    action_en: levelContent.action_en,
    action_ur: levelContent.action_ur,
  };
}

module.exports = {
  evaluateTriage,
  buildCrisisTriage,
  containsAnyPhrase,
  normalizeText,
  TriageValidationError,
  CRISIS_RED_FLAG_ID,
  AGE_GROUPS,
  SEXES,
};
