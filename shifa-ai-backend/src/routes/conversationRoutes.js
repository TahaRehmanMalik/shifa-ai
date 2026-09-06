const express = require('express');
const conversationController = require('../controllers/conversationController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.get('/conversations', requireAuth, conversationController.listConversations);
router.get('/conversations/:id/messages', requireAuth, conversationController.getMessages);

module.exports = router;
