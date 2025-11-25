const express = require('express');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

const router = express.Router();

/**
 * GET /v1/fragments - List all fragments for the current user
 */
router.get('/', async (req, res) => {
  try {
    const expand = req.query.expand === '1' || req.query.expand === 'true';

    // ✅ Log the authenticated user to confirm identity being used
    logger.debug({ user: req.user }, 'Authenticated user debug');

    const fragments = await Fragment.byUser(req.user, expand);

    logger.debug(
      { expand, count: fragments.length },
      'Returning fragments for current user'
    );

    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragments list');
    res
      .status(500)
      .json(createErrorResponse(500, 'Unable to retrieve fragments list'));
  }
});

/**
 * GET /v1/fragments/:id - Retrieve a specific fragment by ID
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let fragment;

    // 🔹 Try to load the fragment, and map "Fragment not found" to 404
    try {
      fragment = await Fragment.byId(req.user, id);
    } catch (err) {
      if (err.message === 'Fragment not found') {
        return res
          .status(404)
          .json(createErrorResponse(404, 'Fragment not found'));
      }
      throw err; // Any other error becomes 500 below
    }

    // ✅ Retrieve fragment data
    const data = await fragment.getData();

    // ✅ Determine response type based on Accept header
    const accepts = req.headers.accept || '*/*';
    if (accepts === '*/*' || accepts.includes(fragment.type)) {
      res.setHeader('Content-Type', fragment.type);
      res.setHeader('Content-Length', fragment.size);
      return res.status(200).send(data);
    }

    // ✅ Otherwise, return JSON metadata
    res.status(200).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragment by ID');
    res
      .status(500)
      .json(createErrorResponse(500, 'Unable to retrieve fragment'));
  }
});

/**
 * DELETE /v1/fragments/:id - Delete a specific fragment by ID
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let fragment;

    // Try to load the fragment first so we know it exists
    try {
      fragment = await Fragment.byId(req.user, id);
    } catch (err) {
      // Our Fragment.byId throws "Fragment not found" for missing fragments
      if (err.message === 'Fragment not found') {
        return res
          .status(404)
          .json(createErrorResponse(404, 'Fragment not found'));
      }
      throw err;
    }

    // Use the fragment's ownerId (hashed) + id for deletion
    await Fragment.delete(fragment.ownerId, fragment.id);

    logger.debug(
      { ownerId: fragment.ownerId, id: fragment.id },
      'Deleted fragment'
    );

    // 200 OK, no extra body needed for the lab, but we return a success envelope
    res.status(200).json(createSuccessResponse());
  } catch (err) {
    logger.error({ err }, 'Error deleting fragment');
    res
      .status(500)
      .json(createErrorResponse(500, 'Unable to delete fragment'));
  }
});

module.exports = router;