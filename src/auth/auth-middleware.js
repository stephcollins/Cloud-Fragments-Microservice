// src/auth/auth-middleware.js
const passport = require('passport');
const { createErrorResponse } = require('../response');
const crypto = require('crypto');
const logger = require('../logger');

/**
 * @param {'bearer' | 'http'} strategyName - the passport strategy to use
 * @returns {Function} - Express middleware function for authentication
 */
module.exports = (strategyName) => {
  return function (req, res, next) {
    /**
     * Custom callback to handle authentication and attach user info
     */
    function callback(err, email) {
      if (err) {
        logger.warn({ err }, 'Error authenticating user');
        return next(createErrorResponse(500, 'Unable to authenticate user'));
      }

      if (!email) {
        return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
      }

      // ✅ Generate a consistent SHA256 hash from the email (no random salt)
      const ownerId = crypto.createHash('sha256').update(email).digest('hex');

      // Attach full user info
      req.user = {
        email,
        id: ownerId,
      };

      logger.debug({ email, ownerId }, 'Authenticated user');
      next();
    }

    passport.authenticate(strategyName, { session: false }, callback)(req, res, next);
  };
};