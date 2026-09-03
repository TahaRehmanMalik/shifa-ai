const { pool } = require('../config/db');

async function logQuery({
  symptomInput,
  inputLanguage,
  inputMode,
  matchedDiseaseId,
  source,
  aiProvider,
  aiRawResponse,
  citations,
  responseTimeMs,
}) {
  await pool.query(
    `INSERT INTO query_logs
      (symptom_input, input_language, input_mode, matched_disease_id, source, ai_provider, ai_raw_response, citations, response_time_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      symptomInput,
      inputLanguage,
      inputMode,
      matchedDiseaseId || null,
      source,
      aiProvider || null,
      aiRawResponse ? JSON.stringify(aiRawResponse) : null,
      citations ? JSON.stringify(citations) : null,
      responseTimeMs,
    ]
  );
}

module.exports = { logQuery };
