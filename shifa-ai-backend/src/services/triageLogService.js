const { pool } = require('../config/db');

async function logTriageQuery({
  symptomInput,
  inputLanguage,
  matchedDiseaseId,
  source,
  aiProvider,
  aiRawResponse,
  citations,
  responseTimeMs,
  triageLevel,
}) {
  await pool.query(
    `INSERT INTO query_logs
      (symptom_input, input_language, input_mode, matched_disease_id, source, ai_provider, ai_raw_response, citations, response_time_ms, triage_level)
     VALUES (?, ?, 'text', ?, ?, ?, ?, ?, ?, ?)`,
    [
      symptomInput,
      inputLanguage,
      matchedDiseaseId || null,
      source,
      aiProvider || null,
      aiRawResponse ? JSON.stringify(aiRawResponse) : null,
      citations ? JSON.stringify(citations) : null,
      responseTimeMs,
      triageLevel,
    ]
  );
}

module.exports = { logTriageQuery };
