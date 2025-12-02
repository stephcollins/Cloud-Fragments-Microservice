// src/model/data/aws/ddbDocClient.js

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
// Helper library for working with converting DynamoDB types to/from JS
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const logger = require('../../../logger');

/**
 * If AWS credentials are configured in the environment, use them.
 */
const getCredentials = () => {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    };
    logger.debug('Using extra DynamoDB Credentials');
    return credentials;
  }
};

/**
 * If a DynamoDB endpoint is configured (LocalStack/DynamoDB Local), use it.
 */
const getDynamoDBEndpoint = () => {
  if (process.env.AWS_DYNAMODB_ENDPOINT_URL) {
    logger.debug(
      { endpoint: process.env.AWS_DYNAMODB_ENDPOINT_URL },
      'Using alternate DynamoDB endpoint'
    );
    return process.env.AWS_DYNAMODB_ENDPOINT_URL;
  }
};

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: getDynamoDBEndpoint(),
  credentials: getCredentials(),
});

const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: false,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

module.exports = ddbDocClient;