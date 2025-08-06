import { corsHeaders, createCorsResponse, prepareWebhookPayload } from './utils';

export const handler = async (event, context) => {
  console.log('=== MINIMAL SUBMIT-APPLICATION FUNCTION CALLED ===');
  console.log('📥 Request ID:', event.headers['x-request-id'] || context.awsRequestId || 'unknown');
  
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check request size
    const bodySize = event.body ? event.body.length : 0;
    const bodySizeMB = Math.round(bodySize / (1024 * 1024) * 100) / 100;
    console.log(`📦 Request body size: ${bodySizeMB}MB`);
    
    if (bodySize > 10 * 1024 * 1024) { // 10MB limit
      console.log('❌ Request too large');
      return {
        statusCode: 413,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        },
        body: JSON.stringify({ 
          error: 'Request too large', 
          message: 'Request body exceeds 10MB limit' 
        })
      };
    }
    
    // Parse JSON body
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('✅ JSON parsed successfully');
      console.log('📋 Received body keys:', Object.keys(body));
    } catch (jsonErr) {
      console.error('❌ JSON parse error:', jsonErr);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        },
        body: JSON.stringify({ 
          error: 'Malformed JSON', 
          message: jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON error'
        })
      };
    }
    
    // Extract data
    const { applicationData, userInfo } = body;

    if (!applicationData || !userInfo) {
      console.error('❌ Missing application data or user info');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        },
        body: JSON.stringify({ 
          error: 'Missing application data or user info'
        })
      };
    }

    // Prepare the webhook payload with proper applicantId and zoneinfo mapping
    const payload = prepareWebhookPayload(applicationData, userInfo);
    console.log('✅ Prepared webhook payload with mapped values:', { 
      applicantId: payload.applicantId,
      zoneinfo: payload.zoneinfo 
    });

    // Log received data
    console.log('📋 Received applicationData keys:', Object.keys(applicationData));
    
    // Return success response
    console.log('✅ Function executed successfully (minimal version)');
    
    const result = {
      id: Math.floor(Math.random() * 1000) + 1,
      applicationDate: new Date().toISOString(),
      status: 'submitted',
      requestId: event.headers['x-request-id'] || context.awsRequestId || 'unknown'
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        applicationId: result.id,
        message: 'Application submitted successfully (minimal version)',
        requestId: result.requestId
      })
    };

  } catch (error) {
    // Comprehensive error logging
    console.error('❌ Submit application error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error message:', error instanceof Error ? error.message : 'No message');
    console.error('❌ Error name:', error instanceof Error ? error.name : 'No name');
    console.error('❌ Request ID:', event.headers['x-request-id'] || context.awsRequestId || 'unknown');
    
    // Log additional context
    console.error('❌ Request method:', event.httpMethod);
    console.error('❌ Request headers:', JSON.stringify(event.headers, null, 2));
    console.error('❌ Request body size:', event.body ? event.body.length : 0);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId: event.headers['x-request-id'] || context.awsRequestId || 'unknown'
      })
    };
  }
}; 