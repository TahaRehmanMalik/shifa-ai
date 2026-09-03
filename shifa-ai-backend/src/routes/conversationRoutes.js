const express = require('express');
const conversationController = require('../controllers/conversationController');

const router = express.Router();

router.get('/conversations/:id/messages', conversationController.getMessages);

module.exports = router;
