const { pool } = require('../config/db');

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_REQUESTS = 3;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

async function countRecentRequests(email) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM otp_codes
     WHERE email = ? AND consumed = FALSE AND created_at >= (NOW() - INTERVAL ? MINUTE)`,
    [email, RATE_LIMIT_WINDOW_MINUTES]
  );
  return rows[0].count;
}

async function createOtp(email, codeHash) {
  await pool.query(
    `INSERT INTO otp_codes (email, code_hash, expires_at) VALUES (?, ?, NOW() + INTERVAL ? MINUTE)`,
    [email, codeHash, OTP_EXPIRY_MINUTES]
  );
}

async function findLatestValidOtp(email) {
  const [rows] = await pool.query(
    `SELECT * FROM otp_codes
     WHERE email = ? AND consumed = FALSE AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function incrementAttempts(id) {
  await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [id]);
}

async function markConsumed(id) {
  await pool.query('UPDATE otp_codes SET consumed = TRUE WHERE id = ?', [id]);
}

module.exports = {
  RATE_LIMIT_MAX_REQUESTS,
  MAX_ATTEMPTS,
  countRecentRequests,
  createOtp,
  findLatestValidOtp,
  incrementAttempts,
  markConsumed,
};
