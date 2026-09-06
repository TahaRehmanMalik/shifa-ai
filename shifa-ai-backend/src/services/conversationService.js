const { pool } = require('../config/db');

async function createConversation(userId) {
  const [result] = await pool.query('INSERT INTO conversations (user_id) VALUES (?)', [userId]);
  return result.insertId;
}

async function conversationExists(conversationId) {
  const [rows] = await pool.query('SELECT id FROM conversations WHERE id = ?', [conversationId]);
  return rows.length > 0;
}

async function conversationBelongsToUser(conversationId, userId) {
  const [rows] = await pool.query('SELECT id FROM conversations WHERE id = ? AND user_id = ?', [
    conversationId,
    userId,
  ]);
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

async function listUserConversations(userId) {
  const [rows] = await pool.query(
    `SELECT c.id, c.created_at,
            (SELECT cm.content FROM conversation_messages cm
             WHERE cm.conversation_id = c.id AND cm.role = 'user'
             ORDER BY cm.id ASC LIMIT 1) AS preview
     FROM conversations c
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = {
  createConversation,
  conversationExists,
  conversationBelongsToUser,
  getRecentMessages,
  getAllMessages,
  saveMessage,
  listUserConversations,
};
