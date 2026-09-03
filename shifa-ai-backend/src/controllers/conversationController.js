const conversationService = require('../services/conversationService');

async function getMessages(req, res) {
  const { id } = req.params;

  try {
    const exists = await conversationService.conversationExists(id);
    if (!exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await conversationService.getAllMessages(id);
    return res.json({ conversationId: Number(id), messages });
  } catch (error) {
    console.error('[conversationController] getMessages failed:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation messages' });
  }
}

module.exports = { getMessages };
