import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('=== MONDAY MISSING SUBITEMS FUNCTION CALLED ===');
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const applicantId = queryParams.applicantId;
    
    if (!applicantId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Missing applicantId parameter',
          message: 'applicantId is required'
        })
      };
    }

    console.log(`🔍 Looking for missing subitems for applicant: ${applicantId}`);

    // TODO: Implement your Monday.com API logic here
    // This is where you would call the Monday.com API to get missing subitems
    
    // Mock response for now
    const mockResponse = {
      success: true,
      applicantId: applicantId,
      missingSubitems: [
        {
          id: '1',
          name: 'Bank Statement',
          status: 'missing',
          section: 'financial_documents'
        },
        {
          id: '2', 
          name: 'Pay Stubs',
          status: 'missing',
          section: 'employment_documents'
        }
      ],
      message: 'Missing subitems retrieved successfully'
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(mockResponse)
    };

  } catch (error) {
    console.error('❌ Error in monday-missing-subitems function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
};
