import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  console.log('Test function called with:', {
    path: event.path,
    httpMethod: event.httpMethod
  });

  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  return createCorsResponse(200, { 
    message: 'Netlify functions are working!',
    timestamp: new Date().toISOString(),
    path: event.path,
    method: event.httpMethod
  });
}; 