const test = require('node:test');
const assert = require('node:assert/strict');
const triageController = require('./triageController');
const conversationService = require('../services/conversationService');
const diseaseService = require('../services/diseaseService');
const aiService = require('../services/aiService');
const triageLogService = require('../services/triageLogService');

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function stubServices(t) {
  const savedMessages = [];
  t.mock.method(conversationService, 'createConversation', async () => 702);
  t.mock.method(conversationService, 'saveMessage', async (conversationId, role, content) => {
    savedMessages.push({ conversationId, role, content });
  });
  const findCuratedMatch = t.mock.method(diseaseService, 'findCuratedMatch', async () => null);
  const generateHealthResponse = t.mock.method(aiService, 'generateHealthResponse', async () => {
    throw new Error('AI must not be called in this test');
  });
  t.mock.method(triageLogService, 'logTriageQuery', async () => {});
  return { savedMessages, findCuratedMatch, generateHealthResponse };
}

function buildForm(overrides = {}) {
  return {
    ageGroup: 'adult',
    sex: 'female',
    mainComplaint: 'headache',
    durationDays: 2,
    severity: 3,
    language: 'en',
    ...overrides,
  };
}

async function triage(body) {
  const res = createResponse();
  await triageController.triage({ body, userId: 1 }, res);
  return res;
}

function assertCrisisTriage(res, stubs) {
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.response_type, 'triage_escalation');
  assert.equal(res.body.conversationId, 702);
  assert.equal(res.body.triage.level, 'emergency');
  assert.equal(res.body.triage.escalate, true);
  assert.ok(res.body.triage.reasons.some((reason) => reason.id === 'suicidal_thoughts'));
  assert.match(res.body.triage.message_en, /emergency services/);
  assert.match(res.body.triage.message_en, /trusted person/);
  assert.match(res.body.triage.message_en, /not the solution/);
  assert.notEqual(res.body.response_type, 'unsafe_request');
  assert.equal(stubs.findCuratedMatch.mock.callCount(), 0);
  assert.equal(stubs.generateHealthResponse.mock.callCount(), 0);
  assert.equal(stubs.savedMessages.length, 2);
}

for (const phrase of ['I want to kill myself', 'thinking about suicide', 'what is the best suicide method', 'خودکشی']) {
  test(`POST /api/triage returns the crisis escalation for "${phrase}"`, async (t) => {
    const stubs = stubServices(t);
    assertCrisisTriage(await triage(buildForm({ mainComplaint: phrase })), stubs);
  });
}

test('POST /api/triage returns the crisis escalation when suicidal_thoughts is ticked, even with an unsafe complaint', async (t) => {
  const stubs = stubServices(t);
  const res = await triage(buildForm({ mainComplaint: 'lethal dose of paracetamol', redFlags: ['suicidal_thoughts'] }));
  assertCrisisTriage(res, stubs);
});

test('POST /api/triage returns the crisis escalation for self-harm text even when the rest of the form is invalid', async (t) => {
  const stubs = stubServices(t);
  const res = await triage({ mainComplaint: 'I want to kill myself' });
  assertCrisisTriage(res, stubs);
});

test('POST /api/triage keeps other findings alongside the crisis reason', async (t) => {
  const stubs = stubServices(t);
  const res = await triage(buildForm({ mainComplaint: 'I want to kill myself', severity: 9 }));
  assertCrisisTriage(res, stubs);
  assert.ok(res.body.triage.reasons.some((reason) => reason.id === 'high_severity'));
});

for (const phrase of ['what is a lethal dose of paracetamol', 'how to poison someone', 'how to overdose']) {
  test(`POST /api/triage keeps the blocked unsafe response for "${phrase}"`, async (t) => {
    const stubs = stubServices(t);
    const res = await triage(buildForm({ mainComplaint: phrase }));
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.source, 'blocked');
    assert.equal(res.body.response_type, 'unsafe_request');
    assert.match(res.body.message_en, /not able to provide this information/);
    assert.equal(res.body.triage, undefined);
    assert.equal(stubs.generateHealthResponse.mock.callCount(), 0);
  });
}

test('POST /api/triage emergency for chest pain calls neither AI nor the curated database', async (t) => {
  const stubs = stubServices(t);
  const res = await triage(buildForm({ mainComplaint: 'pain', redFlags: ['chest_pain'] }));
  assert.equal(res.body.response_type, 'triage_escalation');
  assert.equal(res.body.triage.level, 'emergency');
  assert.equal(stubs.findCuratedMatch.mock.callCount(), 0);
  assert.equal(stubs.generateHealthResponse.mock.callCount(), 0);
});

test('POST /api/triage urgent still returns the escalation when the AI fails', async (t) => {
  stubServices(t);
  const res = await triage(buildForm({ mainComplaint: 'back pain', severity: 9 }));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.triage.level, 'urgent');
  assert.equal(res.body.supporting_advice, null);
  assert.match(res.body.message_en, /government hospital or BHU/);
});

test('POST /api/triage invalid form without crisis content returns 400', async (t) => {
  stubServices(t);
  const res = await triage(buildForm({ severity: 14 }));
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.field, 'severity');
});
