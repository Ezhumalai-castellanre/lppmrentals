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
      // Extract amenities from long_text_mktjp2nj
      const amenitiesCol = item.column_values.find(col => col.id === "long_text_mktjp2nj");
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
        status: "Available Now", // Always show "Available Now" for available rentals
        monthlyRent: item.column_values.find((col) => col.id === "numeric_mktkj4pm")?.text || "", // Rent column
        amenities: amenities,
        mediaFiles: mediaFiles
      };
    });

    console.log('Returning available rentals:', rentals.length);
    return createCorsResponse(200, { rentals });

  } catch (error) {
    console.error('Monday API proxy error:', error);
    
    return createCorsResponse(500, { 
      error: "Failed to fetch available rentals from Monday.com",
      details: error.message 
    });
  }
};
