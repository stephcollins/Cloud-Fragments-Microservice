const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const contentType = require('content-type');

/**
 * Handle POST requests to create a new fragment
 */
module.exports = async (req, res) => {
  try {
    // Ensure request has a valid Content-Type header
    const type = req.headers['content-type'];
    if (!type || !Fragment.isSupportedType(type)) {
      logger.warn({ type }, 'Unsupported content type');
      return res.status(415).json(createErrorResponse(415, 'Unsupported Content-Type'));
    }

    // Ensure body was parsed as a Buffer
    if (!Buffer.isBuffer(req.body)) {
      logger.error('Request body is not a Buffer');
      return res.status(400).json(createErrorResponse(400, 'Invalid request body'));
    }

    // Create and save fragment
    const fragment = new Fragment({
      ownerId: req.user,
      type: contentType.parse(type).type,
      size: req.body.length,
    });
    await fragment.save();
    await fragment.setData(req.body);

    // Set Location header with API_URL or fallback to host
    const baseUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = new URL(`/v1/fragments/${fragment.id}`, baseUrl).toString();

    logger.info({ fragment }, 'Fragment created successfully');

    // Respond with 201 Created
    res.setHeader('Location', location);
    res.status(201).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error({ err }, 'Error creating fragment');
    res.status(500).json(createErrorResponse(500, err.message));
  }
};