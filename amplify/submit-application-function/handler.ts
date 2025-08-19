import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('=== SUBMIT APPLICATION FUNCTION CALLED ===');
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }
  
  try {
    // Check if it's a POST request
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Method not allowed',
          message: 'Only POST requests are supported'
        })
      };
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        })
      };
    }

    // Extract application data
    const { 
      applicantName, 
      email, 
      phone, 
      propertyId, 
      unitId,
      documents 
    } = body;

    if (!applicantName || !email || !propertyId || !unitId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'applicantName, email, propertyId, and unitId are required'
        })
      };
    }

    console.log(`📝 Processing application for: ${applicantName}`);
    console.log(`🏠 Property: ${propertyId}, Unit: ${unitId}`);
    console.log(`📧 Contact: ${email} | ${phone || 'No phone'}`);

    // TODO: Implement your application submission logic here
    // This is where you would:
    // 1. Save to database
    // 2. Send notifications
    // 3. Update Monday.com
    // 4. Process documents
    
    // Mock response for now
    const mockResponse = {
      success: true,
      applicationId: `APP-${Date.now()}`,
      applicantName: applicantName,
      email: email,
      propertyId: propertyId,
      unitId: unitId,
      status: 'submitted',
      message: 'Application submitted successfully',
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(mockResponse)
    };

  } catch (error) {
    console.error('❌ Error in submit application function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
};
