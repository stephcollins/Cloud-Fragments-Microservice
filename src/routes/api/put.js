const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const contentType = require('content-type');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    // Must be authenticated
    if (!req.user?.email) {
      return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
    }

    // Try to load the fragment
    let fragment;
    try {
      fragment = await Fragment.byId(req.user, id);
    } catch {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Validate Content-Type
    const incomingType = req.headers['content-type'];
    if (!incomingType) {
      return res.status(400).json(createErrorResponse(400, 'Content-Type is required'));
    }

    const normalized = contentType.parse(incomingType).type;

    // Type cannot change
    if (normalized !== fragment.type) {
      return res.status(400).json(createErrorResponse(400, 'Fragment type cannot be changed'));
    }

    // Body must be a buffer
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json(createErrorResponse(400, 'Body must be binary data'));
    }

    // Update data
    await fragment.setData(req.body);

    res.status(200).json(createSuccessResponse({ fragment }));
  } catch (err) {
    console.error(err);
    res.status(500).json(createErrorResponse(500, 'Unable to update fragment'));
  }
};
