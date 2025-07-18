import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  console.log('Test missing subitems function called with:', {
    path: event.path,
    httpMethod: event.httpMethod,
    queryStringParameters: event.queryStringParameters,
    pathParameters: event.pathParameters,
    rawPath: event.rawPath,
    requestContext: event.requestContext
  });

  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  // Support GET method only
  if (event.httpMethod !== 'GET') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    // Extract applicant ID from path parameters
    let applicantId = event.pathParameters?.applicantId;
    
    // If pathParameters is not available, try to extract from the path
    if (!applicantId) {
      const pathMatch = event.path.match(/\/api\/test-missing-subitems\/(.+)/);
      if (pathMatch) {
        applicantId = pathMatch[1];
      } else if (event.rawPath) {
        const rawPathMatch = event.rawPath.match(/\/api\/test-missing-subitems\/(.+)/);
        if (rawPathMatch) {
          applicantId = rawPathMatch[1];
        }
      }
    }
    
    console.log('Extracted applicant ID:', applicantId);
    
    if (!applicantId) {
      console.error('No applicant ID found in path:', event.path);
      return createCorsResponse(400, { 
        error: 'Applicant ID is required',
        debug: {
          path: event.path,
          rawPath: event.rawPath,
          pathParameters: event.pathParameters
        }
      });
    }

    // Return a simple test response
    return createCorsResponse(200, {
      success: true,
      applicantId: applicantId,
      message: 'Test function working correctly',
      debug: {
        path: event.path,
        rawPath: event.rawPath,
        pathParameters: event.pathParameters
      }
    });

  } catch (error) {
    console.error('Test function error:', error);
    
    return createCorsResponse(500, { 
      error: "Test function failed",
      details: error.message 
    });
  }
}; 