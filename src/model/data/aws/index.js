// src/model/data/aws/index.js

const logger = require('../../../logger');

// S3 client + commands
const s3Client = require('./s3Client');
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

// DynamoDB Document Client + commands
const ddbDocClient = require('./ddbDocClient');
const {
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');

/**
 * Write fragment metadata to DynamoDB
 */
function writeFragment(fragment) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: fragment,
  };

  const command = new PutCommand(params);

  try {
    return ddbDocClient.send(command);
  } catch (err) {
    logger.warn({ err, params, fragment }, 'error writing fragment to DynamoDB');
    throw err;
  }
}

/**
 * Read fragment metadata from DynamoDB
 */
async function readFragment(ownerId, id) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  const command = new GetCommand(params);

  try {
    const data = await ddbDocClient.send(command);
    return data?.Item;
  } catch (err) {
    logger.warn({ err, params }, 'error reading fragment from DynamoDB');
    throw err;
  }
}

/**
 * List fragments for a user
 * If expand=false -> return ids only
 * If expand=true -> return full metadata objects
 */
async function listFragments(ownerId, expand = false) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    KeyConditionExpression: 'ownerId = :ownerId',
    ExpressionAttributeValues: { ':ownerId': ownerId },
  };

  if (!expand) {
    params.ProjectionExpression = 'id';
  }

  const command = new QueryCommand(params);

  try {
    const data = await ddbDocClient.send(command);
    return expand ? data?.Items : data?.Items.map((item) => item.id);
  } catch (err) {
    logger.error({ err, params }, 'error listing fragments from DynamoDB');
    throw err;
  }
}

/**
 * Convert a Readable stream to Buffer
 */
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

/**
 * Write fragment data to S3
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
    logger.error({ err, Bucket: params.Bucket, Key: params.Key }, 'Error uploading data to S3');
    throw new Error('unable to upload fragment data');
  }
}

/**
 * Read fragment data from S3
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
    logger.error({ err, Bucket: params.Bucket, Key: params.Key }, 'Error reading data from S3');
    throw new Error('unable to read fragment data');
  }
}

/**
 * Delete fragment metadata from DynamoDB + its data from S3
 */
async function deleteFragment(ownerId, id) {
  //
  // 1. DELETE METADATA FROM DYNAMODB
  //
  const ddbParams = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  const ddbCommand = new DeleteCommand(ddbParams);

  try {
    await ddbDocClient.send(ddbCommand);
  } catch (err) {
    logger.warn({ err, ddbParams }, 'error deleting metadata from DynamoDB');
    throw err;
  }

  //
  // 2. DELETE DATA FROM S3
  //
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  const s3Command = new DeleteObjectCommand(s3Params);

  try {
    await s3Client.send(s3Command);
  } catch (err) {
    logger.error({ err, Bucket: s3Params.Bucket, Key: s3Params.Key }, 'Error deleting fragment data from S3');
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