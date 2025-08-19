import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('=== WEBHOOK PROXY FUNCTION CALLED ===');
  console.log('Path:', event.path);
  console.log('HTTP Method:', event.httpMethod);
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }
  
  // Handle monday-missing-subitems endpoint
  if (event.path === '/monday-missing-subitems') {
    return handleMondayMissingSubitems(event);
  }
  
  // Handle monday-units endpoint
  if (event.path === '/monday-units') {
    return handleMondayUnits(event);
  }
  
  // Handle webhook-proxy endpoint (original functionality)
  if (event.path === '/webhook-proxy') {
    return handleWebhookProxy(event);
  }
  
  // Default response for unknown endpoints
  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify({
      error: 'Endpoint not found',
      message: `Path ${event.path} is not supported`
    })
  };
};

async function handleMondayMissingSubitems(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('🔍 Handling monday-missing-subitems request');
  
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
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}

async function handleMondayUnits(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('🏠 Handling monday-units request');
  
  try {
    // Mock response for monday-units
    const mockResponse = {
      success: true,
      units: [
        {
          id: '1',
          name: 'Unit 101',
          status: 'available',
          price: 1500
        },
        {
          id: '2',
          name: 'Unit 102',
          status: 'occupied',
          price: 1600
        }
      ],
      message: 'Units retrieved successfully'
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}

async function handleWebhookProxy(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('📤 Handling webhook-proxy request');
  
  try {
    // Check if it's a POST request
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        })
      };
    }

    // Extract webhook URL and data
    const { webhookUrl, data } = body;

    if (!webhookUrl || !data) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'webhookUrl and data are required'
        })
      };
    }

    console.log(`📤 Forwarding webhook to: ${webhookUrl}`);
    console.log(`📦 Data payload:`, JSON.stringify(data, null, 2));

    // TODO: Implement webhook forwarding logic here
    // This is where you would forward the data to the external webhook URL
    
    // Mock response for now
    const mockResponse = {
      success: true,
      webhookUrl: webhookUrl,
      message: 'Webhook forwarded successfully',
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(mockResponse)
    };

  } catch (error) {
    console.error('❌ Error in webhook proxy function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}
