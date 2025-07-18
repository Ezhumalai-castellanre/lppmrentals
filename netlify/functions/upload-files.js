import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

      if (event.httpMethod !== 'POST') {
      return createCorsResponse(405, { error: 'Method not allowed' });
    }

  try {
    console.log('=== UPLOAD-FILES FUNCTION CALLED ===');
    
    const body = JSON.parse(event.body);
    const { files, personType } = body;

    if (!files || !Array.isArray(files)) {
      return createCorsResponse(400, { error: 'Invalid files data' });
    }

    if (!personType) {
      return createCorsResponse(400, { error: 'Missing person type' });
    }

    // Process uploaded files
    const processedFiles = files.map((file) => ({
      ...file,
      personType,
      uploadedAt: new Date().toISOString()
    }));

    return createCorsResponse(200, {
      success: true,
      files: processedFiles,
      message: `Files uploaded successfully for ${personType}`
    });

  } catch (error) {
    console.error('Upload files error:', error instanceof Error ? error.message : 'Unknown error');
    
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 