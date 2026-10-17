const triageRules = require('../config/triageRules.json');
const { containsAnyPhrase, normalizeText, CRISIS_RED_FLAG_ID } = require('./triageService');

const crisisFlag = triageRules.redFlags.find((redFlag) => redFlag.id === CRISIS_RED_FLAG_ID);

if (!crisisFlag || !crisisFlag.message_en || !crisisFlag.message_ur || !crisisFlag.message_pa) {
  throw new Error(`triageRules.json must define ${CRISIS_RED_FLAG_ID} with message_en, message_ur and message_pa`);
}

function containsSelfHarmContent(text) {
  return typeof text === 'string' && containsAnyPhrase(normalizeText(text), crisisFlag.keywords);
}

function buildCrisisResponse() {
  return {
    response_type: 'crisis_support',
    message_en: crisisFlag.message_en,
    message_ur: crisisFlag.message_ur,
    message_pa: crisisFlag.message_pa,
  };
}

module.exports = { containsSelfHarmContent, buildCrisisResponse };
