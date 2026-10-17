const express = require('express');
const triageController = require('../controllers/triageController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/triage', requireAuth, triageController.triage);

module.exports = router;
