import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  if (event.httpMethod !== 'POST') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    console.log('=== TEST-SUBMIT FUNCTION CALLED ===');
    
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (jsonErr) {
      console.error('JSON parse error:', jsonErr, 'Body:', event.body);
      return createCorsResponse(400, { error: 'Malformed JSON', message: jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON error' });
    }

    console.log('Received body:', body);

    return createCorsResponse(200, {
      success: true,
      message: 'Test function working correctly',
      receivedData: body
    });
  } catch (error) {
    console.error('Test function error:', error);
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 