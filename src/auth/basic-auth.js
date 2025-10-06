const auth = require('http-auth');
//const passport = require('passport'); // stays here!
const authPassport = require('http-auth-passport');
const authorize = require('./auth-middleware');
const logger = require('../logger');

if (!process.env.HTPASSWD_FILE) {
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

logger.info('Using HTTP Basic Auth for auth');

module.exports.strategy = () =>
  authPassport(
    auth.basic({
      file: process.env.HTPASSWD_FILE,
    })
  );

// ✅ Updated per README
module.exports.authenticate = () => authorize('http');