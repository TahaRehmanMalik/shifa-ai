const { pool } = require('../config/db');

async function findByGoogleId(googleId) {
  const [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createUser({ email, name, googleId, avatarUrl }) {
  const [result] = await pool.query(
    'INSERT INTO users (email, name, google_id, avatar_url) VALUES (?, ?, ?, ?)',
    [email, name || null, googleId || null, avatarUrl || null]
  );
  return findById(result.insertId);
}

async function linkGoogleId(userId, googleId, name, avatarUrl) {
  await pool.query(
    'UPDATE users SET google_id = ?, name = COALESCE(name, ?), avatar_url = COALESCE(avatar_url, ?) WHERE id = ?',
    [googleId, name || null, avatarUrl || null, userId]
  );
  return findById(userId);
}

async function findOrCreateGoogleUser({ googleId, email, name, avatarUrl }) {
  const byGoogleId = await findByGoogleId(googleId);
  if (byGoogleId) {
    return byGoogleId;
  }

  const byEmail = await findByEmail(email);
  if (byEmail) {
    return linkGoogleId(byEmail.id, googleId, name, avatarUrl);
  }

  return createUser({ email, name, googleId, avatarUrl });
}

async function findOrCreateEmailUser(email) {
  const existing = await findByEmail(email);
  if (existing) {
    return existing;
  }
  return createUser({ email });
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
  };
}

module.exports = {
  findByGoogleId,
  findByEmail,
  findById,
  createUser,
  findOrCreateGoogleUser,
  findOrCreateEmailUser,
  toPublicUser,
};
