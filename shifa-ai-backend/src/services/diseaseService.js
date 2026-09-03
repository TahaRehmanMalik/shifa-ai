const { pool } = require('../config/db');
const { DISCLAIMER_EN, DISCLAIMER_UR } = require('./aiPrompt');

async function findCuratedMatch(symptomText) {
  const searchTerm = `%${symptomText.trim()}%`;
  const [rows] = await pool.query(
    `SELECT * FROM diseases
     WHERE name_en LIKE ? OR symptoms_en LIKE ? OR search_keywords LIKE ?
     ORDER BY id ASC
     LIMIT 1`,
    [searchTerm, searchTerm, searchTerm]
  );
  return rows[0] || null;
}

function formatCuratedResult(disease) {
  return {
    response_type: 'health_query',
    condition_en: disease.name_en,
    condition_ur: disease.name_ur,
    root_cause_en: disease.root_cause_en,
    root_cause_ur: disease.root_cause_ur,
    diet_plan_en: disease.diet_plan_en,
    diet_plan_ur: disease.diet_plan_ur,
    medicine_class_en: disease.medicine_class_en,
    medicine_class_ur: disease.medicine_class_ur,
    disclaimer_en: DISCLAIMER_EN,
    disclaimer_ur: DISCLAIMER_UR,
    citations: [],
  };
}

async function listDiseases() {
  const [rows] = await pool.query('SELECT id, name_en, name_ur, name_pa FROM diseases ORDER BY id ASC');
  return rows;
}

async function getDiseaseById(id) {
  const [rows] = await pool.query('SELECT * FROM diseases WHERE id = ?', [id]);
  return rows[0] || null;
}

module.exports = { findCuratedMatch, formatCuratedResult, listDiseases, getDiseaseById };
