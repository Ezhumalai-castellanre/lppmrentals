import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  if (event.httpMethod !== 'POST') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    console.log('=== TEST-SIMPLE FUNCTION CALLED ===');
    console.log('📥 Request ID:', event.headers['x-request-id'] || context.awsRequestId || 'unknown');
    console.log('📥 Request headers:', JSON.stringify(event.headers, null, 2));
    console.log('Event body length:', event.body ? event.body.length : 0);
    
    // Test JSON parsing
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('✅ JSON parsed successfully');
      console.log('📋 Received keys:', Object.keys(body));
    } catch (jsonErr) {
      console.error('❌ JSON parse error:', jsonErr);
      return createCorsResponse(400, { 
        error: 'Malformed JSON', 
        message: jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON error'
      });
    }
    
    // Test with minimal payload
    const testData = {
      testField: 'test value',
      timestamp: new Date().toISOString(),
      requestId: event.headers['x-request-id'] || context.awsRequestId || 'unknown'
    };
    
    console.log('✅ Test function working correctly');
    
    return createCorsResponse(200, {
      success: true,
      message: 'Test simple function working',
      data: testData,
      receivedData: body
    });
  } catch (error) {
    console.error('❌ Test simple function error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error && error.stack ? error.stack : undefined
    });
  }
}; 