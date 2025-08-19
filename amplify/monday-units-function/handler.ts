import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('=== MONDAY UNITS FUNCTION CALLED ===');
  
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
    const propertyId = queryParams.propertyId;
    
    if (!propertyId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Missing propertyId parameter',
          message: 'propertyId is required'
        })
      };
    }

    console.log(`🔍 Looking for units for property: ${propertyId}`);

    // TODO: Implement your Monday.com API logic here
    // This is where you would call the Monday.com API to get units data
    
    // Mock response for now
    const mockResponse = {
      success: true,
      propertyId: propertyId,
      units: [
        {
          id: '1',
          name: 'Unit 101',
          status: 'available',
          rent: 1500,
          bedrooms: 1,
          bathrooms: 1
        },
        {
          id: '2',
          name: 'Unit 102',
          status: 'occupied',
          rent: 1600,
          bedrooms: 2,
          bathrooms: 1
        }
      ],
      message: 'Units retrieved successfully'
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
    console.error('❌ Error in monday-units function:', error);
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
