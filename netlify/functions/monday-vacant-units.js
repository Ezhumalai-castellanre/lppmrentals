import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  console.log('Monday vacant units function called with:', {
    path: event.path,
    httpMethod: event.httpMethod,
    queryStringParameters: event.queryStringParameters
  });

  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  // Support both GET and POST methods
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN || "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU";
    const BOARD_ID = process.env.MONDAY_BOARD_ID || "8740450373";

    console.log('Fetching vacant units from Monday.com with token:', MONDAY_API_TOKEN ? 'Present' : 'Missing');
    console.log('Board ID:', BOARD_ID);

    // Use the exact query structure requested by the user
    const query = `
      query {
        boards(ids: [${BOARD_ID}]) {
          items_page(query_params: {
            rules: [
              {
                column_id: "color_mkp7fmq4",
                compare_value: "Vacant",
                operator: contains_terms
              }
            ]
          }) {
            items {
              id
              name
              column_values(ids: ["text_mksxyax3", "color_mkp7xdce", "color_mkp77nrv", "color_mkp7fmq4", "numeric_mksz7rkz", "long_text_mktjp2nj", "ink_mktj22y9"]) {
                id
                text
              }
              subitems {
                id
                name
                column_values(ids: ["status", "color_mksyqx5h", "color_mkp7fmq4"]) {
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
      throw new Error(`Monday API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Monday API response:', JSON.stringify(result, null, 2));
    const items = result?.data?.boards?.[0]?.items_page?.items ?? [];
    
    // Debug: Print all column IDs and values for each item
    items.forEach((item, idx) => {
      console.log(`Item #${idx + 1} (${item.name}):`);
      item.column_values.forEach(col => {
        console.log(`  - ${col.id}: ${col.text}`);
      });
    });
    
    const units = items.map((item) => {
      // Extract images from the image column (ink_mktj22y9)
      let images = [];
      const imageCol = item.column_values.find(col => col.id === "ink_mktj22y9");
      if (imageCol && imageCol.text) {
        try {
          const imageData = JSON.parse(imageCol.text);
          if (Array.isArray(imageData)) {
            images = imageData.map(img => ({
              url: img.url,
              name: img.name || '',
              id: img.id || ''
            }));
          }
        } catch (e) {
          console.log('Error parsing image column value:', e);
          // If parsing fails, try to use the text directly as a URL
          if (imageCol.text && imageCol.text.startsWith('http')) {
            images = [{ url: imageCol.text, name: '', id: '' }];
          }
        }
      }

      // Extract amenities (long_text_mktjp2nj)
      const amenitiesCol = item.column_values.find(col => col.id === "long_text_mktjp2nj");
      const amenities = amenitiesCol ? amenitiesCol.text : "";

      // Filter subitems by vacant status as requested
      const filteredSubitems = item.subitems.filter(sub =>
        sub.column_values.find(cv =>
          cv.id === "color_mkp7fmq4" && cv.text === "Vacant"
        )
      );

      return {
        id: item.id,
        name: item.name,
        propertyName: item.column_values.find((col) => col.id === "color_mkp7xdce")?.text || "",
        unitType: item.column_values.find((col) => col.id === "color_mkp77nrv")?.text || "",
        status: item.column_values.find((col) => col.id === "color_mkp7fmq4")?.text || "",
        monthlyRent: item.column_values.find((col) => col.id === "numeric_mksz7rkz")?.text || "",
        amenities: amenities,
        images: images,
        vacantSubitems: filteredSubitems.map(sub => ({
          id: sub.id,
          name: sub.name,
          status: sub.column_values.find(cv => cv.id === "status")?.label || 
                  sub.column_values.find(cv => cv.id === "status")?.text || "",
          applicantType: sub.column_values.find(cv => cv.id === "color_mksyqx5h")?.text || ""
        }))
      };
    });

    console.log('Returning vacant units:', units.length);
    return createCorsResponse(200, { units });

  } catch (error) {
    console.error('Monday API proxy error:', error);
    
    return createCorsResponse(500, { 
      error: "Failed to fetch vacant units from Monday.com",
      details: error.message 
    });
  }
};
