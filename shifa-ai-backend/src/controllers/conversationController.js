const conversationService = require('../services/conversationService');

async function getMessages(req, res) {
  const { id } = req.params;

  try {
    const owns = await conversationService.conversationBelongsToUser(id, req.userId);
    if (!owns) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await conversationService.getAllMessages(id);
    return res.json({ conversationId: Number(id), messages });
  } catch (error) {
    console.error('[conversationController] getMessages failed:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation messages' });
  }
}

async function listConversations(req, res) {
  try {
    const conversations = await conversationService.listUserConversations(req.userId);
    return res.json({
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        created_at: conversation.created_at,
        preview: conversation.preview,
      })),
    });
  } catch (error) {
    console.error('[conversationController] listConversations failed:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

module.exports = { getMessages, listConversations };
