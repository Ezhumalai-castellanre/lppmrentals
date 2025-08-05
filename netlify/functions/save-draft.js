const { saveDraft } = require('./dynamodb-service');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { applicantId, formData, currentStep, isComplete = false } = JSON.parse(event.body);

    if (!applicantId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'applicantId is required' })
      };
    }

    const result = await saveDraft(applicantId, formData, currentStep, isComplete);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error saving draft:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to save draft',
        message: error.message 
      })
    };
  }
}; 