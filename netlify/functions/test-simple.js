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
    console.log('Event body length:', event.body ? event.body.length : 0);
    
    return createCorsResponse(200, {
      success: true,
      message: 'Test simple function working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test simple function error:', error);
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 