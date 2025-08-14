import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  console.log('Monday available rentals function called with:', {
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
    // Try to fetch from the new NYC listings API first
    console.log('Fetching from NYC listings API...');
    const nycResponse = await fetch('https://5sdpaqwf0f.execute-api.us-east-1.amazonaws.com/dev/getnyclisting', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "Stage": "Active"
      }),
    });

    if (nycResponse.ok) {
      const nycResult = await nycResponse.json();
      console.log('NYC listings API response:', JSON.stringify(nycResult, null, 2));
      
      // Handle the new API response structure
      let rentals = [];
      
      if (nycResult.body) {
        try {
          // Parse the body if it's a JSON string
          const bodyData = typeof nycResult.body === 'string' ? JSON.parse(nycResult.body) : nycResult.body;
          
          // Check if we have items array
          if (bodyData.items && Array.isArray(bodyData.items)) {
            rentals = bodyData.items.map((item) => ({
              id: item.id || String(Math.random()),
              name: item.name || 'Unknown Unit',
              propertyName: item.address || 'Unknown Property',
              unitType: item.unit_type || 'Unknown',
              status: item.Stage || 'Available',
              monthlyRent: item.price ? `$${item.price}` : 'Contact',
              amenities: item.description || item.short_description || '',
              mediaFiles: (item.subitems || []).map((subitem) => ({
                id: subitem.id || String(Math.random()),
                name: subitem.name || 'Media',
                url: subitem.url || '',
                type: 'Media',
                isVideo: false
              }))
            }));
          }
        } catch (parseError) {
          console.error('Error parsing API response body:', parseError);
        }
      }
      
      // Fallback: check if result has rentals or items directly
      if (rentals.length === 0) {
        if (nycResult.rentals && Array.isArray(nycResult.rentals)) {
          rentals = nycResult.rentals;
        } else if (nycResult.items && Array.isArray(nycResult.items)) {
          rentals = nycResult.items.map((item) => ({
            id: item.id || String(Math.random()),
            name: item.name || 'Unknown Unit',
            propertyName: item.address || 'Unknown Property',
            unitType: item.unit_type || 'Unknown',
            status: item.Stage || 'Available',
            monthlyRent: item.price ? `$${item.price}` : 'Contact',
            amenities: item.description || item.short_description || '',
            mediaFiles: (item.subitems || []).map((subitem) => ({
              id: subitem.id || String(Math.random()),
              name: subitem.name || 'Media',
              url: subitem.url || '',
              type: 'Media',
              isVideo: false
            }))
          }));
        }
      }
      
      // If the new API returns data, use it
      if (rentals.length > 0) {
        console.log('Returning rentals from NYC listings API:', rentals.length);
        return createCorsResponse(200, { rentals });
      }
    }

    // Fallback to Monday.com API if NYC API fails or returns no data
    console.log('Falling back to Monday.com API...');
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN || "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU";
    const BOARD_ID = process.env.MONDAY_BOARD_ID || "9769934634";

    console.log('Fetching available rentals from Monday.com with token:', MONDAY_API_TOKEN ? 'Present' : 'Missing');
    console.log('Board ID:', BOARD_ID);

    // Query to get all items with their subitems (media files)
    const query = `
      query {
        boards(ids: [${BOARD_ID}]) {
          items_page(limit: 100) {
            items {
              id
              name
              column_values {
                id
                value
                text
              }
              subitems {
                id
                name
                column_values {
                  id
                  value
                  text
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
      console.log(`  Subitems: ${item.subitems?.length || 0}`);
    });
    
    const rentals = items.map((item) => {
      // Extract amenities from long_text_mktkpv9y
      const amenitiesCol = item.column_values.find(col => col.id === "long_text_mktkpv9y");
      const amenities = amenitiesCol ? amenitiesCol.text : "";

      // Extract media files from subitems
      const mediaFiles = item.subitems?.map(subitem => {
        const linkCol = subitem.column_values.find(col => col.id === "link_mktkw42r");
        if (linkCol && linkCol.value) {
          try {
            const linkData = JSON.parse(linkCol.value);
            return {
              id: subitem.id,
              name: subitem.name,
              url: linkData.url,
              type: linkData.text || "Media",
              isVideo: subitem.name.toLowerCase().includes('.mov') || 
                      subitem.name.toLowerCase().includes('.mp4') ||
                      subitem.name.toLowerCase().includes('.avi')
            };
          } catch (e) {
            console.log('Error parsing link column value:', e);
            return null;
          }
        }
        return null;
      }).filter(Boolean) || [];

      return {
        id: item.id,
        name: item.name,
        propertyName: item.column_values.find((col) => col.id === "text_mktkkbsb")?.text || "", // Address column
        unitType: item.column_values.find((col) => col.id === "color_mktkdvc5")?.text || "", // Unit Type column
        status: item.column_values.find((col) => col.id === "color_mktk40b8")?.text || "", // Marketing column as status
        monthlyRent: item.column_values.find((col) => col.id === "numeric_mktkj4pm")?.text || "", // Rent column
        amenities: amenities,
        mediaFiles: mediaFiles
      };
    });

    console.log('Returning available rentals from Monday.com fallback:', rentals.length);
    return createCorsResponse(200, { rentals });

  } catch (error) {
    console.error('API proxy error:', error);
    
    return createCorsResponse(500, { 
      error: "Failed to fetch available rentals from both NYC listings API and Monday.com",
      details: error.message 
    });
  }
};
