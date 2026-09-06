const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;
const SESSION_EXPIRY = '7d';
const SESSION_COOKIE_NAME = 'shifa_session';

function generateOtp() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

function hashOtp(code) {
  return bcrypt.hash(code, SALT_ROUNDS);
}

function verifyOtpHash(code, hash) {
  return bcrypt.compare(code, hash);
}

function createSessionToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: SESSION_EXPIRY });
}

function verifySessionToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  SESSION_COOKIE_NAME,
  generateOtp,
  hashOtp,
  verifyOtpHash,
  createSessionToken,
  verifySessionToken,
};
