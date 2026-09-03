const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();

router.post('/search', searchController.search);
router.get('/diseases', searchController.listDiseases);
router.get('/diseases/:id', searchController.getDisease);

module.exports = router;
