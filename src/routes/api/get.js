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
    const fragments = await Fragment.byUser(req.user, expand);

    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragments list');
    res
      .status(500)
      .json(createErrorResponse(500, 'Unable to retrieve fragments list'));
  }
});

/**
 * GET /v1/fragments/:id/info - Return metadata only
 */
router.get('/:id/info', async (req, res) => {
  const { id } = req.params;

  try {
    let fragment;

    try {
      fragment = await Fragment.byId(req.user, id);
    } catch {
      return res
        .status(404)
        .json(createErrorResponse(404, 'Fragment not found'));
    }

    res.status(200).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        },
      })
    );
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragment metadata');
    res
      .status(500)
      .json(createErrorResponse(500, 'Unable to retrieve fragment metadata'));
  }
});

/**
 * GET /v1/fragments/:id(.ext)? - Retrieve raw or converted fragment data
 */
router.get('/:id', async (req, res) => {
  try {
    let { id } = req.params;
    let ext = null;

    // Detect extension: e.g., abc.html -> id = abc, ext = html
    const match = id.match(/^([^.]+)\.(.+)$/);
    if (match) {
      id = match[1];
      ext = match[2].toLowerCase();
    }

    // Load fragment
    let fragment;
    try {
      fragment = await Fragment.byId(req.user, id);
    } catch {
      return res
        .status(404)
        .json(createErrorResponse(404, 'Fragment not found'));
    }

    const data = await fragment.getData();

    // No extension → raw fragment
    if (!ext) {
      res.setHeader('Content-Type', fragment.type);
      res.setHeader('Content-Length', fragment.size);
      return res.status(200).send(data);
    }

    // ----------------------------------------
    // NEW FIX: Block non-image → image conversions
    // ----------------------------------------
    const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'];
    const targetIsImage = IMAGE_EXTS.includes(ext.toLowerCase());
    const sourceIsImage = fragment.mimeType.startsWith('image/');

    if (targetIsImage && !sourceIsImage) {
      return res
        .status(415)
        .json(
          createErrorResponse(
            415,
            `Conversion from ${fragment.type} to .${ext} is not supported`
          )
        );
    }

    // Perform conversion
    try {
      const converted = await fragment.convert(ext);

      res.setHeader('Content-Type', converted.type);
      res.setHeader('Content-Length', converted.data.length);
      return res.status(200).send(converted.data);

    } catch (err) {
      return res
        .status(415)
        .json(createErrorResponse(415, err.message));
    }

  } catch (err) {
    logger.error({ err }, 'Error retrieving or converting fragment');
    res
      .status(500)
      .json(createErrorResponse(500, 'Unable to retrieve fragment'));
  }
});

/**
 * DELETE /v1/fragments/:id - Delete fragment
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    let fragment;

    try {
      fragment = await Fragment.byId(req.user, id);
    } catch {
      return res
        .status(404)
        .json(createErrorResponse(404, 'Fragment not found'));
    }

    await Fragment.delete(fragment.ownerId, fragment.id);

    res.status(200).json(createSuccessResponse());
  } catch (err) {
    logger.error({ err }, 'Error deleting fragment');
    res
      .status(500)
      .json(createErrorResponse(500, 'Unable to delete fragment'));
  }
});

module.exports = router;
