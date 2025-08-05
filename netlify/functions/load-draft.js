import { loadDraft } from './dynamodb-service.js';

export const handler = async (event, context) => {
  console.log('🔄 Load draft function called');
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

  if (event.httpMethod !== 'GET') {
    console.log('❌ Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📥 Parsing query parameters...');
    const { applicantId } = event.queryStringParameters || {};
    console.log('✅ Query parameters parsed');

    if (!applicantId) {
      console.log('❌ Missing applicantId');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'applicantId is required' })
      };
    }

    console.log('🔄 Calling loadDraft function...');
    const result = await loadDraft(applicantId);
    console.log('✅ Draft loaded successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('❌ Error in load-draft function:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to load draft',
        message: error.message,
        stack: error.stack
      })
    };
  }
}; 