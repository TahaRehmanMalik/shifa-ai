const { OAuth2Client } = require('google-auth-library');
const authService = require('../services/authService');
const userService = require('../services/userService');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setSessionCookie(res, token) {
  res.cookie(authService.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
  });
}

async function googleSignIn(req, res) {
  const { idToken } = req.body;

  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const user = await userService.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
    });

    const token = authService.createSessionToken(user.id);
    setSessionCookie(res, token);

    return res.json({ user: userService.toPublicUser(user) });
  } catch (error) {
    console.error('[authController] googleSignIn failed:', error);
    return res.status(401).json({ error: 'Invalid Google ID token' });
  }
}

async function requestOtp(req, res) {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const recentCount = await otpService.countRecentRequests(normalizedEmail);
    if (recentCount < otpService.RATE_LIMIT_MAX_REQUESTS) {
      const code = authService.generateOtp();
      const codeHash = await authService.hashOtp(code);
      await otpService.createOtp(normalizedEmail, codeHash);
      await emailService.sendOtpEmail(normalizedEmail, code);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[authController] requestOtp failed:', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
}

async function verifyOtp(req, res) {
  const { email, code } = req.body;

  if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
    return res.status(400).json({ error: 'email and code are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const otpRow = await otpService.findLatestValidOtp(normalizedEmail);

    if (!otpRow || otpRow.attempts >= otpService.MAX_ATTEMPTS) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    const isValid = await authService.verifyOtpHash(code, otpRow.code_hash);
    if (!isValid) {
      await otpService.incrementAttempts(otpRow.id);
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    await otpService.markConsumed(otpRow.id);

    const user = await userService.findOrCreateEmailUser(normalizedEmail);
    const token = authService.createSessionToken(user.id);
    setSessionCookie(res, token);

    return res.json({ user: userService.toPublicUser(user) });
  } catch (error) {
    console.error('[authController] verifyOtp failed:', error);
    return res.status(500).json({ error: 'Failed to verify code' });
  }
}

function logout(req, res) {
  res.clearCookie(authService.SESSION_COOKIE_NAME);
  return res.json({ success: true });
}

async function me(req, res) {
  const token = req.cookies[authService.SESSION_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { userId } = authService.verifySessionToken(token);
    const user = await userService.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    return res.json({ user: userService.toPublicUser(user) });
  } catch (error) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
}

module.exports = { googleSignIn, requestOtp, verifyOtp, logout, me };
