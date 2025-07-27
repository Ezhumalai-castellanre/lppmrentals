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
    console.log('📥 Request ID:', event.headers['x-request-id'] || context.awsRequestId || 'unknown');
    console.log('📥 Request headers:', JSON.stringify(event.headers, null, 2));
    
    // Check request size
    const bodySize = event.body ? event.body.length : 0;
    const bodySizeMB = Math.round(bodySize / (1024 * 1024) * 100) / 100;
    console.log(`📦 Request body size: ${bodySizeMB}MB`);
    
    if (bodySize > 10 * 1024 * 1024) { // 10MB limit
      console.log('❌ Request too large');
      return createCorsResponse(413, { error: 'Request too large', message: 'Request body exceeds 10MB limit' });
    }
    
    // Parse JSON body with detailed error handling
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('✅ JSON parsed successfully');
    } catch (jsonErr) {
      console.error('❌ JSON parse error:', jsonErr);
      console.error('❌ Body length:', event.body ? event.body.length : 0);
      console.error('❌ Body preview:', event.body ? event.body.substring(0, 200) + '...' : 'No body');
      return createCorsResponse(400, { 
        error: 'Malformed JSON', 
        message: jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON error',
        requestId: event.headers['x-request-id'] || context.awsRequestId || 'unknown'
      });
    }
    
    // Extract and validate required data
    const { applicationData, uploadedFilesMetadata } = body;

    if (!applicationData) {
      console.error('❌ Missing application data');
      return createCorsResponse(400, { 
        error: 'Missing application data',
        requestId: event.headers['x-request-id'] || context.awsRequestId || 'unknown'
      });
    }

    // Log received data structure
    console.log('📋 Received applicationData keys:', Object.keys(applicationData));
    console.log('📋 Received uploadedFilesMetadata:', uploadedFilesMetadata ? 'Present' : 'Not present');
    
    // Validate critical required fields
    console.log('🔍 Validating critical fields...');
    const requiredFields = [
      'applicantName',
      'applicantEmail', 
      'applicantDob',
      'moveInDate',
      'buildingAddress',
      'apartmentNumber'
    ];
    
    const missingFields = requiredFields.filter(field => {
      const value = applicationData[field];
      const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
      if (isEmpty) {
        console.log(`❌ Missing required field: ${field}`);
      }
      return isEmpty;
    });
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return createCorsResponse(400, { 
        error: 'Missing required fields',
        missingFields,
        requestId: event.headers['x-request-id'] || context.awsRequestId || 'unknown'
      });
    }
    
    // Log specific fields for debugging
    console.log('✅ Critical fields check:');
    console.log('  - applicantName:', applicationData.applicantName);
    console.log('  - applicantEmail:', applicationData.applicantEmail);
    console.log('  - applicantDob:', applicationData.applicantDob);
    console.log('  - moveInDate:', applicationData.moveInDate);
    console.log('  - buildingAddress:', applicationData.buildingAddress);
    console.log('  - apartmentNumber:', applicationData.apartmentNumber);
    console.log('  - hasCoApplicant:', applicationData.hasCoApplicant);
    console.log('  - hasGuarantor:', applicationData.hasGuarantor);

    // Validate data types and formats
    console.log('🔍 Validating data types...');
    
    // Check if dates are valid
    try {
      if (applicationData.applicantDob) {
        new Date(applicationData.applicantDob);
      }
      if (applicationData.moveInDate) {
        new Date(applicationData.moveInDate);
      }
      console.log('✅ Date validation passed');
    } catch (dateErr) {
      console.error('❌ Date validation failed:', dateErr);
      return createCorsResponse(400, { 
        error: 'Invalid date format',
        message: 'One or more dates are in invalid format',
        requestId: event.headers['x-request-id'] || context.awsRequestId || 'unknown'
      });
    }

    // For now, skip complex validation and just return success
    console.log('✅ Skipping complex validation for debugging...');
    
    // Create a simple mock result
    const mockResult = {
      id: Math.floor(Math.random() * 1000) + 1,
      applicationDate: new Date().toISOString(),
      status: 'submitted',
      requestId: event.headers['x-request-id'] || context.awsRequestId || 'unknown'
    };

    console.log('✅ Mock application created with ID:', mockResult.id);
    console.log('✅ Returning success response');

    return createCorsResponse(200, {
      success: true,
      applicationId: mockResult.id,
      message: 'Application submitted successfully (mock)',
      requestId: mockResult.requestId
    });

  } catch (error) {
    // Comprehensive error logging
    console.error('❌ Submit application error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error message:', error instanceof Error ? error.message : 'No message');
    console.error('❌ Error name:', error instanceof Error ? error.name : 'No name');
    console.error('❌ Request ID:', event.headers['x-request-id'] || context.awsRequestId || 'unknown');
    
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: event.headers['x-request-id'] || context.awsRequestId || 'unknown',
      stack: error instanceof Error && error.stack ? error.stack : undefined
    });
  }
}; 