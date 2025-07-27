import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  if (event.httpMethod !== 'POST') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    console.log('=== SUBMIT-APPLICATION FUNCTION CALLED ===');
    
    // Check request size
    const bodySize = event.body ? event.body.length : 0;
    const bodySizeMB = Math.round(bodySize / (1024 * 1024) * 100) / 100;
    console.log(`Request body size: ${bodySizeMB}MB`);
    
    if (bodySize > 10 * 1024 * 1024) { // 10MB limit
      return createCorsResponse(413, { error: 'Request too large', message: 'Request body exceeds 10MB limit' });
    }
    
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (jsonErr) {
      console.error('JSON parse error:', jsonErr, 'Body length:', event.body ? event.body.length : 0);
      return createCorsResponse(400, { error: 'Malformed JSON', message: jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON error' });
    }
    
    const { applicationData, uploadedFilesMetadata } = body;

    if (!applicationData) {
      return createCorsResponse(400, { error: 'Missing application data' });
    }

    // Log basic info without the full data to avoid log overflow
    console.log('Received applicationData keys:', Object.keys(applicationData));
    console.log('Received uploadedFilesMetadata:', uploadedFilesMetadata ? 'Present' : 'Not present');
    
    // Log specific fields that might cause issues
    console.log('Critical fields check:');
    console.log('  - applicantName:', applicationData.applicantName);
    console.log('  - applicantEmail:', applicationData.applicantEmail);
    console.log('  - applicantDob:', applicationData.applicantDob);
    console.log('  - moveInDate:', applicationData.moveInDate);
    console.log('  - hasCoApplicant:', applicationData.hasCoApplicant);
    console.log('  - hasGuarantor:', applicationData.hasGuarantor);

    // For now, skip validation and just return success
    console.log('Skipping validation for debugging...');
    
    // Create a simple mock result
    const mockResult = {
      id: Math.floor(Math.random() * 1000) + 1,
      applicationDate: new Date().toISOString(),
      status: 'submitted'
    };

    console.log('Mock application created with ID:', mockResult.id);

    return createCorsResponse(200, {
      success: true,
      applicationId: mockResult.id,
      message: 'Application submitted successfully (mock)'
    });

  } catch (error) {
    // Log the full error object
    console.error('Submit application error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error && error.stack ? error.stack : undefined
    });
  }
}; 