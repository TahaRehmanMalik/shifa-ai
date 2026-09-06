const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/auth/google', authController.googleSignIn);
router.post('/auth/otp/request', authController.requestOtp);
router.post('/auth/otp/verify', authController.verifyOtp);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authController.me);

module.exports = router;
