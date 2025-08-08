const { deleteDraft } = require('./dynamodb-service.js');

exports.handler = async (event, context) => {
  console.log('🔄 Delete draft function called');
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

  if (event.httpMethod !== 'DELETE') {
    console.log('❌ Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const applicantId = event.queryStringParameters?.applicantId;
    console.log('📥 Applicant ID from query params:', applicantId);

    if (!applicantId) {
      console.log('❌ Missing applicantId');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'applicantId is required' })
      };
    }

    console.log('🔄 Calling deleteDraft function...');
    const result = await deleteDraft(applicantId);
    console.log('✅ Draft deleted successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('❌ Error in delete-draft function:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to delete draft',
        message: error.message,
        stack: error.stack
      })
    };
  }
}; 