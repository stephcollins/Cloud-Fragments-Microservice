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
  try {
    const { id } = req.params;
    const fragment = await Fragment.byId(req.user, id);

    if (!fragment) {
      return res
        .status(404)
        .json(createErrorResponse(404, 'Fragment not found'));
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

module.exports = router;