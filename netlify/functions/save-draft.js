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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    let { applicantId, formData } = JSON.parse(event.body);

    if (!applicantId || !formData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'applicantId and formData are required' }),
      };
    }

    // Check if the data size exceeds DynamoDB limit (400KB)
    const dataSize = JSON.stringify(formData).length;
    if (dataSize > 400000) {
      console.warn(`Draft data size (${dataSize} bytes) exceeds DynamoDB limit`);
      
      // Try to compress by removing non-essential fields
      const compressedFormData = {
        ...formData,
        // Remove large fields that might cause size issues
        rawFormData: undefined,
        rawFormValues: undefined,
        // Keep only essential metadata for documents
        documents: formData.documents ? Object.fromEntries(
          Object.entries(formData.documents).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.map(doc => ({
              filename: doc.filename || doc.file_name,
              webhookbodyUrl: doc.webhookbodyUrl || doc.extracted_url,
              upload_date: doc.upload_date
            })) : value
          ])
        ) : formData.documents
      };

      const compressedSize = JSON.stringify(compressedFormData).length;
      if (compressedSize > 400000) {
        return {
          statusCode: 413,
          headers,
          body: JSON.stringify({ 
            error: 'Draft data too large even after compression',
            originalSize: dataSize,
            compressedSize: compressedSize
          }),
        };
      }

      // Use compressed data
      formData = compressedFormData;
    }

    const params = {
      TableName: TABLE_NAME,
      Item: {
        applicantId: applicantId,
        formData: formData,
        lastUpdated: new Date().toISOString(),
        dataSize: JSON.stringify(formData).length
      }
    };

    await dynamoDB.put(params).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Draft saved successfully',
        dataSize: params.Item.dataSize
      }),
    };

  } catch (error) {
    console.error('Error saving draft:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Could not save draft',
        details: error.message 
      }),
    };
  }
};
