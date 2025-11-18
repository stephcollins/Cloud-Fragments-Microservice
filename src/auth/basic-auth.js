const auth = require('http-auth');
const authPassport = require('http-auth-passport');
const authorize = require('./auth-middleware');
const logger = require('../logger');
const crypto = require('crypto');

// Make sure .env contains HTPASSWD_FILE
if (!process.env.HTPASSWD_FILE) {
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

logger.info('Using HTTP Basic Auth for auth');

// Create HTTP Basic authentication strategy
const basic = auth.basic({
  file: process.env.HTPASSWD_FILE,
});

// ✅ Cleaned-up user assignment and consistent hashing
module.exports.strategy = () =>
  authPassport(basic, (req, res, next) => {
    // Extract username safely (sometimes it's nested in req.auth.user)
    const username =
      typeof req.auth?.user === 'string'
        ? req.auth.user
        : req.auth?.user?.name ||
          req.auth?.user?.email ||
          JSON.stringify(req.auth?.user || '');

    // Always attach both email and hash
    req.user = {
      email: username,
      hash: crypto.createHash('sha256').update(username).digest('hex'),
    };

    logger.debug({ user: req.user.email }, 'Authenticated user');
    next();
  });

// Middleware for route protection
module.exports.authenticate = () => authorize('http');