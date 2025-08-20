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
    // Extract applicant ID from query parameters, path parameters, or request body
    let applicantId = event.queryStringParameters?.applicantId;
    
    // If not in query parameters, try path parameters
    if (!applicantId) {
      applicantId = event.pathParameters?.applicantId;
    }
    
    // For POST requests, also check the request body
    if (!applicantId && event.httpMethod === 'POST' && event.body) {
      try {
        const body = JSON.parse(event.body);
        applicantId = body.applicantId;
        console.log('Extracted applicantId from POST body:', applicantId);
      } catch (parseError) {
        console.error('Failed to parse POST body:', parseError);
      }
    }
    
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
          error: 'Applicant ID is required',
          message: 'applicantId is required in query parameters, path parameters, or request body'
        })
      };
    }

    console.log(`🔍 Looking for missing subitems for applicant: ${applicantId}`);

    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN || "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU";
    const BOARD_ID = process.env.MONDAY_DOCUMENTS_BOARD_ID || "9602025981";

    console.log('Fetching from Monday.com with token:', MONDAY_API_TOKEN ? 'Present' : 'Missing');
    console.log('Board ID:', BOARD_ID);

    const query = `
      query {
        boards(ids: [${BOARD_ID}]) {
          items_page {
            items {
              id
              name
              column_values(ids: ["text_mksxyax3", "text_mksxn3da", "text_mksxdc76"]) {
                id
                text
              }
              subitems {
                id
                name
                column_values(ids: ["status", "color_mksyqx5h", "text_mkt9gepz", "text_mkt9x4qd", "text_mktanfxj", "link_mktsj2d"]) {
                  id
                  text
                  ... on StatusValue {
                    label
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error('Monday API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Monday API error response:', errorText);
      throw new Error(`Monday API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Monday.com API Response Status:', response.status);
    console.log('Monday.com API Response:', JSON.stringify(result, null, 2));
    
    const items = result?.data?.boards?.[0]?.items_page?.items ?? [];
    
    console.log('📊 Found', items.length, 'total items in the board');
    
    // Find items matching the applicant ID (check both new Lppm format and old formats)
    const searchApplicantIds = [applicantId];
    
    // If the requested ID is in new Lppm format, also search for old format equivalents
    if (applicantId.startsWith('Lppm-')) {
      // Extract date and number from Lppm format
      const match = applicantId.match(/^Lppm-(\d{8})-(\d{5})$/);
      if (match) {
        const [, dateStr, numberStr] = match;
        const timestamp = new Date(
          parseInt(dateStr.substring(0, 4)),
          parseInt(dateStr.substring(4, 6)) - 1,
          parseInt(dateStr.substring(6, 8))
        ).getTime();
        
        // Create old format equivalents
        const oldZoneFormat = `zone_${timestamp}_${numberStr}`;
        const oldTempFormat = `temp_${timestamp}_${numberStr}`;
        
        searchApplicantIds.push(oldZoneFormat, oldTempFormat);
        console.log(`🔍 Also searching for old format equivalents: ${oldZoneFormat}, ${oldTempFormat}`);
      }
    }
    
    // If the requested ID is in old format, also search for new Lppm format
    if (applicantId.startsWith('zone_') || applicantId.startsWith('temp_')) {
      // Extract timestamp and number from old format
      const match = applicantId.match(/^(zone_|temp_)(\d+)_(.+)$/);
      if (match) {
        const [, prefix, timestamp, numberStr] = match;
        const date = new Date(parseInt(timestamp));
        const dateStr = date.getFullYear().toString() + 
                       String(date.getMonth() + 1).padStart(2, '0') + 
                       String(date.getDate()).padStart(2, '0');
        
        const newLppmFormat = `Lppm-${dateStr}-${numberStr.padStart(5, '0')}`;
        searchApplicantIds.push(newLppmFormat);
        console.log(`🔍 Also searching for new Lppm format: ${newLppmFormat}`);
      }
    }
    
    console.log(`🔍 Searching for applicant IDs: ${searchApplicantIds.join(', ')}`);
    
    // Find items that have subitems matching any of the possible applicant IDs
    const matchingItems = items.filter(item => {
      const subitems = item.subitems || [];
      
      // Check if any subitem has the matching applicant ID
      const hasMatchingSubitem = subitems.some(sub => {
        const subitemApplicantId = sub.column_values.find(cv => cv.id === "text_mkt9gepz")?.text;
        const matches = searchApplicantIds.includes(subitemApplicantId);
        
        if (matches) {
          console.log(`🔍 Found matching subitem in ${item.name}: ${sub.name} with applicant ID: "${subitemApplicantId}"`);
        }
        
        return matches;
      });
      
      if (hasMatchingSubitem) {
        console.log(`✅ Found matching item: ${item.name} with matching subitems`);
      }
      
      return hasMatchingSubitem;
    });

    console.log('📊 Found', matchingItems.length, 'items matching applicant ID', `"${applicantId}"`);

    interface MissingSubitem {
      id: string;
      name: string;
      status: string;
      applicantType: string;
      documentType: string | null;
      applicantId: string;
      documentKey: string | null;
      fileLink: string | null;
      parentItemId: string;
      parentItemName: string;
      coApplicantName: string | null;
      guarantorName: string | null;
    }

    const results: MissingSubitem[] = [];

    for (const item of matchingItems) {
      console.log(`👤 Processing matching parent item: ${item.name} (ID: ${item.id})`);
      
      const parentItemId = item.id;
      const parentItemName = item.name;
      
      // Extract Co-Applicant and Guarantor names
      const coApplicantName = item.column_values.find(cv => cv.id === "text_mksxn3da")?.text || null;
      const guarantorName = item.column_values.find(cv => cv.id === "text_mksxdc76")?.text || null;
      
      console.log(`👥 Applicant: ${parentItemName}, Co-Applicant: ${coApplicantName}, Guarantor: ${guarantorName}`);
      
      const subitems = item.subitems || [];
      console.log(`📄 Found ${subitems.length} subitems for this parent`);

      for (const sub of subitems) {
        const statusValue = sub.column_values.find(cv => cv.id === "status");
        const status = statusValue?.label || statusValue?.text || "Unknown";
        const applicantType = sub.column_values.find(cv => cv.id === "color_mksyqx5h")?.text || "Unknown";
        const subitemApplicantId = sub.column_values.find(cv => cv.id === "text_mkt9gepz")?.text;
        
        console.log(`🔍 Processing subitem: ${sub.name} - Applicant ID: "${subitemApplicantId}", Status: "${status}", Type: "${applicantType}"`);
        
        // Only include subitems that match the requested applicant ID
        if (searchApplicantIds.includes(subitemApplicantId) && ["Missing", "Received", "Rejected"].includes(status)) {
          console.log(`✅ Adding subitem to results: ${sub.name} (${status}) for applicant ${subitemApplicantId}`);
          
          // Extract additional useful information from subitem column values
          const documentType = sub.column_values.find(cv => cv.id === "text_mkt9x4qd")?.text || null;
          const applicantId = subitemApplicantId;
          const documentKey = sub.column_values.find(cv => cv.id === "text_mktanfxj")?.text || null;
          const fileLink = sub.column_values.find(cv => cv.id === "link_mktsj2d")?.text || null;
          
          results.push({
            id: sub.id,
            name: sub.name,
            status,
            applicantType,
            documentType,
            applicantId,
            documentKey,
            fileLink,
            parentItemId,
            parentItemName,
            coApplicantName,
            guarantorName
          });
        } else {
          if (!searchApplicantIds.includes(subitemApplicantId)) {
            console.log(`❌ Skipping subitem: ${sub.name} - Applicant ID "${subitemApplicantId}" doesn't match search criteria`);
          } else if (!["Missing", "Received", "Rejected"].includes(status)) {
            console.log(`❌ Skipping subitem: ${sub.name} - Status "${status}" not in allowed list`);
          }
        }
      }
    }

    console.log('✅ Final Results:', results.length, 'missing subitems found');
    
    // Log summary of what was found
    if (results.length > 0) {
      console.log('📋 Summary of found subitems:');
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.name} (${result.status}) - ${result.applicantType} - ${result.documentType}`);
      });
    } else {
      console.log('⚠️  No results found. This could mean:');
      console.log('   - No subitems match the applicant ID');
      console.log('   - All matching subitems have status other than Missing/Received/Rejected');
      console.log('   - There\'s an issue with the column mapping');
    }
    
    console.log('📤 Sending response:', JSON.stringify(results, null, 2));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(results)
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
