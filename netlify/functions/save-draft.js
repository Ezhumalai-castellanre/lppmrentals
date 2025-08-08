const { saveDraft } = require('./dynamodb-service.js');

exports.handler = async (event, context) => {
  console.log('🔄 Save draft function called');
  console.log('📋 Event:', JSON.stringify(event, null, 2));
  
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('❌ Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📥 Parsing request body...');
    const { applicantId, formData, currentStep, isComplete = false } = JSON.parse(event.body);
    console.log('✅ Request parsed successfully');

    if (!applicantId) {
      console.log('❌ Missing applicantId');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'applicantId is required' })
      };
    }

    console.log('🔄 Calling saveDraft function...');
    const result = await saveDraft(applicantId, formData, currentStep, isComplete);
    console.log('✅ Draft saved successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('❌ Error in save-draft function:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to save draft',
        message: error.message,
        stack: error.stack
      })
    };
  }
}; 