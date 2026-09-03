const { pool } = require('../config/db');

async function createConversation(sessionId) {
  const [result] = await pool.query('INSERT INTO conversations (session_id) VALUES (?)', [sessionId]);
  return result.insertId;
}

async function conversationExists(conversationId) {
  const [rows] = await pool.query('SELECT id FROM conversations WHERE id = ?', [conversationId]);
  return rows.length > 0;
}

async function getRecentMessages(conversationId, limit = 6) {
  const [rows] = await pool.query(
    `SELECT role, content FROM conversation_messages
     WHERE conversation_id = ?
     ORDER BY id DESC
     LIMIT ?`,
    [conversationId, limit]
  );
  return rows.reverse();
}

async function getAllMessages(conversationId) {
  const [rows] = await pool.query(
    `SELECT id, role, content, created_at FROM conversation_messages
     WHERE conversation_id = ?
     ORDER BY id ASC`,
    [conversationId]
  );
  return rows;
}

async function saveMessage(conversationId, role, content) {
  await pool.query('INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?, ?, ?)', [
    conversationId,
    role,
    content,
  ]);
}

module.exports = { createConversation, conversationExists, getRecentMessages, getAllMessages, saveMessage };
