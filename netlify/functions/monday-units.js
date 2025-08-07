import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  console.log('Monday units function called with:', {
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

    console.log('Fetching from Monday.com with token:', MONDAY_API_TOKEN ? 'Present' : 'Missing');
    console.log('Board ID:', BOARD_ID);

  
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
    });
    
    const units = items.map((item) => {
      // Extract images from subitems
      let images = [];
      if (item.subitems && item.subitems.length > 0) {
        images = item.subitems.map(subitem => {
          const linkCol = subitem.column_values.find(col => col.id === "link_mktkw42r");
          if (linkCol && linkCol.value) {
            try {
              const linkData = JSON.parse(linkCol.value);
              return {
                url: linkData.url,
                name: subitem.name,
                id: subitem.id
              };
            } catch (e) {
              console.log('Error parsing link column value:', e);
              return null;
            }
          }
          return null;
        }).filter(Boolean);
      }

      // Extract amenities
      const amenitiesCol = item.column_values.find(col => col.id === "long_text_mktkpv9y");
      const amenities = amenitiesCol ? amenitiesCol.text : "";

      return {
        id: item.id,
        name: item.name,
        propertyName: item.column_values.find((col) => col.id === "text_mktkkbsb")?.text || "", // Address column
        unitType: item.column_values.find((col) => col.id === "color_mktkdvc5")?.text || "", // Unit Type column
        status: item.column_values.find((col) => col.id === "color_mktk40b8")?.text || "", // Marketing column as status
        monthlyRent: item.column_values.find((col) => col.id === "numeric_mktkj4pm")?.text || "", // Rent column
        amenities: amenities,
        images: images
      };
    });

    console.log('Returning units:', units.length);
    return createCorsResponse(200, { units });

  } catch (error) {
    console.error('Monday API proxy error:', error);
    
    return createCorsResponse(500, { 
      error: "Failed to fetch units from Monday.com",
      details: error.message 
    });
  }
}; 