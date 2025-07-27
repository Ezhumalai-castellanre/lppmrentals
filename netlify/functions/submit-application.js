export const handler = async (event, context) => {
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
    console.log('=== SUBMIT-APPLICATION FUNCTION CALLED ===');
    console.log('📥 Request ID:', event.headers['x-request-id'] || context.awsRequestId || 'unknown');
    
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
    const { applicationData, uploadedFilesMetadata } = body;

    if (!applicationData) {
      console.error('❌ Missing application data');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        },
        body: JSON.stringify({ 
          error: 'Missing application data'
        })
      };
    }

    // Log received data
    console.log('📋 Received applicationData keys:', Object.keys(applicationData));
    console.log('📋 Received uploadedFilesMetadata:', uploadedFilesMetadata ? 'Present' : 'Not present');
    
    // Log specific field values for debugging
    console.log('🔍 Detailed field inspection:');
    console.log('  - buildingAddress:', applicationData.buildingAddress);
    console.log('  - apartmentNumber:', applicationData.apartmentNumber);
    console.log('  - moveInDate:', applicationData.moveInDate);
    console.log('  - monthlyRent:', applicationData.monthlyRent, 'type:', typeof applicationData.monthlyRent);
    console.log('  - apartmentType:', applicationData.apartmentType);
    console.log('  - applicantName:', applicationData.applicantName);
    console.log('  - applicantDob:', applicationData.applicantDob);
    console.log('  - applicantEmail:', applicationData.applicantEmail);
    console.log('  - applicantAddress:', applicationData.applicantAddress);
    console.log('  - applicantCity:', applicationData.applicantCity);
    console.log('  - applicantState:', applicationData.applicantState);
    console.log('  - applicantZip:', applicationData.applicantZip);
    
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