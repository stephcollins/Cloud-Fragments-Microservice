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
        const { type } = contentType.parse(req.headers['content-type']);
        return Fragment.isSupportedType(type);
      } catch {
        return false;
      }
    },
  });

// Mount the router from get.js (GET, DELETE, info, conversions)
router.use('/fragments', require('./get'));

// POST /v1/fragments
router.post('/fragments', rawBody(), require('./post'));

// PUT /v1/fragments/:id
router.put('/fragments/:id', rawBody(), require('./put'));

module.exports = router;
