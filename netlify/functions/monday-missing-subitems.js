import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  console.log('Monday missing subitems function called with:', {
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
      const pathMatch = event.path.match(/\/api\/monday\/missing-subitems\/(.+)/);
      if (pathMatch) {
        applicantId = pathMatch[1];
      } else if (event.rawPath) {
        const rawPathMatch = event.rawPath.match(/\/api\/monday\/missing-subitems\/(.+)/);
        if (rawPathMatch) {
          applicantId = rawPathMatch[1];
        }
      }
    }
    
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

    console.log('Searching for applicant ID:', applicantId);

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
              column_values(ids: ["text_mksxyax3"]) {
                id
                text
              }
              subitems {
                id
                name
                column_values {
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
    console.log('Monday.com API Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Monday.com API Response:', JSON.stringify(result, null, 2));
    
    const items = result?.data?.boards?.[0]?.items_page?.items ?? [];
    
    console.log('📊 Found', items.length, 'total items in the board');
    
    // Log available applicant IDs for debugging
    console.log('🔍 Available Applicant IDs in the board:');
    items.forEach((item, index) => {
      const applicantIdValue = item.column_values.find(cv => cv.id === "text_mksxyax3")?.text;
      console.log(`  ${index + 1}. Item: ${item.name} - Applicant ID: "${applicantIdValue}"`);
      
      // Log subitems and their column values for debugging
      if (item.subitems && item.subitems.length > 0) {
        console.log(`    📄 Subitems for ${item.name}:`);
        item.subitems.forEach((subitem, subIndex) => {
          console.log(`      ${subIndex + 1}. ${subitem.name}:`);
          subitem.column_values.forEach(cv => {
            console.log(`        - Column ${cv.id}: ${cv.text} (label: ${cv.label || 'N/A'})`);
          });
        });
      }
    });

    // Find items matching the applicant ID
    const matchingItems = items.filter(item => {
      const itemApplicantId = item.column_values.find(cv => cv.id === "text_mksxyax3")?.text;
      const matches = itemApplicantId === applicantId;
      console.log(`🔍 Checking item "${item.name}": Applicant ID "${itemApplicantId}" matches "${applicantId}"? ${matches}`);
      return matches;
    });

    console.log('📊 Found', matchingItems.length, 'items matching applicant ID', `"${applicantId}"`);

    const results = [];

    for (const item of matchingItems) {
      console.log(`👤 Processing matching parent item: ${item.name} (ID: ${item.id})`);
      
      const parentItemId = item.id;
      const parentItemName = item.name;
      
      const subitems = item.subitems || [];
      console.log(`📄 Found ${subitems.length} subitems for this parent`);

      for (const sub of subitems) {
        const statusValue = sub.column_values.find(cv => cv.id === "status");
        const status = statusValue?.label || statusValue?.text || "Unknown";
        const applicantType = sub.column_values.find(cv => cv.id === "color_mksyqx5h")?.text || "Unknown";
        const publicUrl = sub.column_values.find(cv => cv.id === "link_mkt3nz03")?.text || null;
        const previewText = sub.column_values.find(cv => cv.id === "text_mkt5m32r")?.text || null;

        console.log(`  📋 Subitem: ${sub.name} - Status: ${status} - Applicant Type: ${applicantType} - Public URL: ${publicUrl} - Preview Text: ${previewText}`);

        if (["Received", "Missing", "Rejected"].includes(status)) {
          results.push({
            id: sub.id,
            name: sub.name,
            status,
            parentItemId,
            parentItemName,
            applicantType,
            ...(status === "Received" && publicUrl ? { publicUrl } : { action: "Upload Required" }),
            ...(status === "Received" && previewText ? { previewText } : {})
          });
        }
      }
    }

    console.log('✅ Final Results:', results.length, 'missing subitems found');
    console.log('📤 Sending response:', JSON.stringify(results, null, 2));

    return createCorsResponse(200, results);

  } catch (error) {
    console.error('Monday API proxy error:', error);
    
    return createCorsResponse(500, { 
      error: "Failed to fetch missing subitems from Monday.com",
      details: error.message 
    });
  }
}; 