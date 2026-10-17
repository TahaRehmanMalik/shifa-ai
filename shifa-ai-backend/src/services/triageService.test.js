const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateTriage, TriageValidationError } = require('./triageService');
const triageRules = require('../config/triageRules.json');

const LEVEL_ORDER = ['self_care', 'soon', 'urgent', 'emergency'];

function rankOf(level) {
  return LEVEL_ORDER.indexOf(level);
}

function buildAdultInput(overrides = {}) {
  return {
    ageGroup: 'adult',
    sex: 'female',
    isPregnant: false,
    mainComplaint: 'mild headache',
    durationDays: 2,
    severity: 3,
    redFlags: [],
    conditions: [],
    ...overrides,
  };
}

function reasonIds(result) {
  return result.reasons.map((reason) => reason.id);
}

test('chest pain red flag gives emergency with a Rescue 1122 escalation', () => {
  const result = evaluateTriage(buildAdultInput({ mainComplaint: 'pain', redFlags: ['chest_pain'] }));
  assert.equal(result.level, 'emergency');
  assert.equal(result.escalate, true);
  assert.ok(reasonIds(result).includes('chest_pain'));
  assert.match(result.message_en, /Rescue 1122/);
  assert.match(result.message_en, /nearest hospital/);
});

test('chest pain typed in the complaint is detected without ticking the red flag', () => {
  const result = evaluateTriage(buildAdultInput({ mainComplaint: 'I have chest pain since morning' }));
  assert.equal(result.level, 'emergency');
  assert.ok(reasonIds(result).includes('chest_pain'));
});

test('infant under 3 months with fever gives urgent or higher', () => {
  const result = evaluateTriage({
    ageGroup: 'infant',
    ageMonths: 2,
    sex: 'male',
    mainComplaint: 'baby has a fever',
    durationDays: 1,
    severity: 4,
  });
  assert.ok(rankOf(result.level) >= rankOf('urgent'));
  assert.ok(reasonIds(result).includes('fever_under_3_months'));
  assert.equal(result.escalate, true);
});

test('infant with fever and unknown age in months is treated conservatively as urgent or higher', () => {
  const result = evaluateTriage({
    ageGroup: 'infant',
    sex: 'female',
    mainComplaint: 'bukhar',
    durationDays: 1,
    severity: 3,
  });
  assert.ok(rankOf(result.level) >= rankOf('urgent'));
});

test('older infant with fever is at least soon but not raised by the under-3-months rule', () => {
  const result = evaluateTriage({
    ageGroup: 'infant',
    ageMonths: 8,
    sex: 'female',
    mainComplaint: 'fever',
    durationDays: 1,
    severity: 3,
  });
  assert.equal(result.level, 'soon');
  assert.ok(!reasonIds(result).includes('fever_under_3_months'));
});

test('severity 9 gives at least urgent and mentions the government hospital or BHU', () => {
  const result = evaluateTriage(buildAdultInput({ mainComplaint: 'back pain', severity: 9 }));
  assert.ok(rankOf(result.level) >= rankOf('urgent'));
  assert.ok(reasonIds(result).includes('high_severity'));
  assert.match(result.message_en, /government hospital/);
  assert.match(result.message_en, /BHU/);
});

test('mild 2-day headache with no flags gives self_care', () => {
  const result = evaluateTriage(buildAdultInput());
  assert.equal(result.level, 'self_care');
  assert.equal(result.escalate, false);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.message_en, triageRules.levels.self_care.message_en);
  assert.equal(result.message_ur, triageRules.levels.self_care.message_ur);
});

test('diabetic with severity 6 is raised one step above the same case without diabetes', () => {
  const withoutDiabetes = evaluateTriage(buildAdultInput({ severity: 6 }));
  const withDiabetes = evaluateTriage(buildAdultInput({ severity: 6, conditions: ['diabetes'] }));
  assert.equal(withoutDiabetes.level, 'self_care');
  assert.equal(withDiabetes.level, 'soon');
  assert.equal(rankOf(withDiabetes.level), rankOf(withoutDiabetes.level) + 1);
  assert.ok(reasonIds(withDiabetes).includes('risk_diabetes'));
});

test('risk factor does not raise the level when severity is below 5', () => {
  const result = evaluateTriage(buildAdultInput({ severity: 4, conditions: ['diabetes', 'hypertension'] }));
  assert.equal(result.level, 'self_care');
});

test('several risk factors raise the level by only one step', () => {
  const result = evaluateTriage(buildAdultInput({ severity: 6, conditions: ['diabetes', 'heart_disease'] }));
  assert.equal(result.level, 'soon');
  assert.ok(reasonIds(result).includes('risk_diabetes'));
  assert.ok(reasonIds(result).includes('risk_heart_disease'));
});

test('isPregnant counts as the pregnancy risk factor', () => {
  const result = evaluateTriage(buildAdultInput({ isPregnant: true, mainComplaint: 'nausea', severity: 5 }));
  assert.equal(result.level, 'soon');
  assert.ok(reasonIds(result).includes('risk_pregnancy'));
});

test('bleeding during pregnancy gives emergency', () => {
  const result = evaluateTriage(buildAdultInput({ isPregnant: true, mainComplaint: 'some bleeding today', severity: 4 }));
  assert.equal(result.level, 'emergency');
  assert.ok(reasonIds(result).includes('pregnancy_with_bleeding_or_severe_pain'));
});

test('suicidal_thoughts gives emergency and tells the user to contact emergency services or a trusted person', () => {
  const result = evaluateTriage(buildAdultInput({ mainComplaint: 'feeling very low', redFlags: ['suicidal_thoughts'] }));
  assert.equal(result.level, 'emergency');
  assert.equal(result.escalate, true);
  assert.match(result.message_en, /emergency services/);
  assert.match(result.message_en, /trusted person/);
  assert.match(result.message_en, /immediately/);
  assert.ok(result.message_ur.includes('قابلِ اعتماد شخص'));
});

test('suicidal_thoughts rule is configured as emergency in the rules file', () => {
  const flag = triageRules.redFlags.find((redFlag) => redFlag.id === 'suicidal_thoughts');
  assert.equal(flag.level, 'emergency');
});

test('invalid severity throws a TriageValidationError', () => {
  for (const severity of [11, -1, '5', Number.NaN, undefined]) {
    assert.throws(
      () => evaluateTriage(buildAdultInput({ severity })),
      (error) => error instanceof TriageValidationError && error.field === 'severity'
    );
  }
});

test('unknown red flag id throws a TriageValidationError', () => {
  assert.throws(
    () => evaluateTriage(buildAdultInput({ redFlags: ['chest_pain', 'broken_toe'] })),
    (error) => error instanceof TriageValidationError && error.field === 'redFlags'
  );
});

test('missing required fields throw a TriageValidationError', () => {
  for (const field of ['ageGroup', 'sex', 'mainComplaint', 'durationDays', 'severity']) {
    const input = buildAdultInput();
    delete input[field];
    assert.throws(
      () => evaluateTriage(input),
      (error) => error instanceof TriageValidationError && error.field === field
    );
  }
});

test('unknown condition and bad age group are rejected', () => {
  assert.throws(() => evaluateTriage(buildAdultInput({ conditions: ['diabetic'] })), TriageValidationError);
  assert.throws(() => evaluateTriage(buildAdultInput({ ageGroup: 'teen' })), TriageValidationError);
});

test('multiple matching rules resolve to the highest level', () => {
  const result = evaluateTriage(
    buildAdultInput({ mainComplaint: 'cough', durationDays: 10, severity: 9, redFlags: ['chest_pain'] })
  );
  assert.equal(result.level, 'emergency');
  assert.deepEqual(new Set(reasonIds(result)), new Set(['chest_pain', 'high_severity', 'prolonged_symptoms']));
  assert.equal(result.reasons[0].id, 'chest_pain');
});

test('long duration with high severity resolves to urgent, not soon', () => {
  const result = evaluateTriage(buildAdultInput({ mainComplaint: 'cough', durationDays: 10, severity: 8 }));
  assert.equal(result.level, 'urgent');
  assert.ok(reasonIds(result).includes('prolonged_symptoms'));
  assert.ok(reasonIds(result).includes('high_severity'));
});

test('stiff neck needs fever in the complaint to trigger by keyword', () => {
  assert.equal(evaluateTriage(buildAdultInput({ mainComplaint: 'stiff neck after sleeping' })).level, 'self_care');
  assert.equal(evaluateTriage(buildAdultInput({ mainComplaint: 'stiff neck and fever' })).level, 'emergency');
});

test('keywords match whole words only', () => {
  assert.equal(evaluateTriage(buildAdultInput({ mainComplaint: 'my shoes fitsize is wrong and I have a headache' })).level, 'self_care');
});

test('rules file declares its source and that it is not clinically validated', () => {
  assert.match(triageRules.source, /Manchester Triage System/);
  assert.match(triageRules.source, /ETAT/);
  assert.match(triageRules.source, /NHS/);
  assert.match(triageRules.source, /NOT clinically validated/);
  assert.match(triageRules.levels.emergency.message_en, /Rescue 1122/);
  assert.match(triageRules.levels.urgent.message_en, /government hospital or BHU/);
});

test('every rule level in the rules file is a known level', () => {
  const ruleLevels = [
    ...triageRules.redFlags.map((rule) => rule.level),
    ...triageRules.redFlags.flatMap((rule) => Object.values(rule.levelByAgeGroup || {})),
    ...triageRules.ageRules.map((rule) => rule.level),
    ...triageRules.severityRules.map((rule) => rule.level),
    ...triageRules.durationRules.map((rule) => rule.level),
  ];
  for (const level of ruleLevels) {
    assert.ok(LEVEL_ORDER.includes(level), `unknown level ${level}`);
  }
  for (const level of LEVEL_ORDER) {
    assert.ok(triageRules.levels[level].message_en);
    assert.ok(triageRules.levels[level].message_ur);
  }
});
