const authService = require('../services/authService');

function requireAuth(req, res, next) {
  const token = req.cookies[authService.SESSION_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { userId } = authService.verifySessionToken(token);
    req.userId = userId;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
}

module.exports = requireAuth;
