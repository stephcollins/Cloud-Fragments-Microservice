// src/model/data/aws/index.js

// XXX: temporary use of memory-db until we add DynamoDB
const MemoryDB = require('../memory/memory-db');
const logger = require('../../../logger');

// S3 client + commands
const s3Client = require('./s3Client');
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

// One DB for fragment "metadata" only (still in-memory for now)
const metadata = new MemoryDB();

/**
 * Write fragment metadata.
 */
function writeFragment(fragment) {
  const meta = {
    id: fragment.id,
    ownerId: fragment.ownerId,
    created: fragment.created,
    updated: fragment.updated,
    type: fragment.type,
    size: fragment.size,
  };

  return metadata.put(fragment.ownerId, fragment.id, meta);
}

/**
 * Read fragment metadata.
 */
function readFragment(ownerId, id) {
  return metadata.get(ownerId, id);
}

/**
 * List fragments for a user.
 * If expand = false -> array of IDs
 * If expand = true  -> array of metadata objects
 */
async function listFragments(ownerId, expand = false) {
  const results = await metadata.query(ownerId);

  if (expand) {
    return results;
  }

  return results.map((f) => f.id);
}

/**
 * Convert a Readable stream into a Buffer.
 */
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

/**
 * Write fragment data (Buffer) to S3.
 */
async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  const command = new PutObjectCommand(params);

  try {
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

/**
 * Read fragment data (Buffer) from S3.
 */
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  const command = new GetObjectCommand(params);

  try {
    const data = await s3Client.send(command);
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

/**
 * Delete fragment metadata and S3 object.
 */
async function deleteFragment(ownerId, id) {
  // delete from in-memory metadata
  await metadata.del(ownerId, id);

  // delete from S3
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  const command = new DeleteObjectCommand(params);

  try {
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
    throw new Error('unable to delete fragment data');
  }
}

module.exports = {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
};