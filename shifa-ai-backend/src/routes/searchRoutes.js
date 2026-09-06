const express = require('express');
const searchController = require('../controllers/searchController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/search', requireAuth, searchController.search);
router.get('/diseases', searchController.listDiseases);
router.get('/diseases/:id', searchController.getDisease);

module.exports = router;
