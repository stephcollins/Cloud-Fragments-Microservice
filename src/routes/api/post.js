// src/routes/api/post.js
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');
const contentType = require('content-type');

module.exports = async (req, res) => {
  try {
    // 1️⃣ Validate Content-Type
    const type = req.headers['content-type'];
    if (!type || !Fragment.isSupportedType(type)) {
      return res.status(415).json(createErrorResponse(415, 'Unsupported Content-Type'));
    }

    // 2️⃣ Ensure body is a Buffer
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json(createErrorResponse(400, 'Invalid request body; expected Buffer'));
    }

    // 3️⃣ Get user email from req.user (middleware already decoded Basic Auth)
    if (!req.user?.email) {
      return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
    }

    // 4️⃣ Hash email using Fragment.createOwnerId() (MATCHES fragment.js behavior)
    const ownerId = Fragment.createOwnerId(req.user.email);

    // 5️⃣ Create Fragment metadata entry
    const fragment = new Fragment({
      ownerId,
      type: contentType.parse(type).type,
      size: req.body.length,
    });

    // 6️⃣ Save both metadata + data (Buffer)
    await fragment.setData(req.body);

    // 7️⃣ Build Location header
    const baseUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = `${baseUrl}/v1/fragments/${fragment.id}`;
    
    res.setHeader('Location', location);
    res.status(201).json(createSuccessResponse({ fragment }));

  } catch (err) {
    logger.error({ err }, 'Error creating fragment');
    res.status(500).json(createErrorResponse(500, err.message));
  }
};
