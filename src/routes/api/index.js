/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Helper for parsing raw body up to 5MB, supporting multiple content types
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        const { type } = contentType.parse(req);
        return Fragment.isSupportedType(type);
      } catch {
        return false;
      }
    },
  });

// ✅ Mount the router from get.js, which includes / and /:id
router.use('/fragments', require('./get'));

// ✅ POST /v1/fragments
router.post('/fragments', rawBody(), require('./post'));

module.exports = router;