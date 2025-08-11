import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  console.log('=== TEST DRAFT FUNCTION CALLED ===');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    return createCorsResponse(200, {
      success: true,
      message: 'Test draft function is working!',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      headers: event.headers
    });
  } catch (error) {
    console.error('❌ Test draft function error:', error);
    
    return createCorsResponse(500, {
      success: false,
      error: error.message || 'Test draft function failed',
      details: error.stack
    });
  }
};
