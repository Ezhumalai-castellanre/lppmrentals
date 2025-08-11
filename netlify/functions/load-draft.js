const AWS = require('aws-sdk');
const { DynamoDB } = require('aws-sdk');

// Configure AWS
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1',
  accessKeyId: process.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID,
  secretAccessKey: process.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY,
});

const TABLE_NAME = process.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved';

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const { applicantId } = event.queryStringParameters || {};

    if (!applicantId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'applicantId is required' }),
      };
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        applicantId: applicantId
      }
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Draft not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        applicantId: result.Item.applicantId,
        formData: result.Item.formData,
        lastUpdated: result.Item.lastUpdated,
        dataSize: result.Item.dataSize
      }),
    };

  } catch (error) {
    console.error('Error loading draft:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Could not load draft',
        details: error.message 
      }),
    };
  }
};
