import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

      if (event.httpMethod !== 'POST') {
      return createCorsResponse(405, { error: 'Method not allowed' });
    }

  try {
    const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN || "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU";
    const BOARD_ID = process.env.MONDAY_BOARD_ID || "9769934634";

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
      throw new Error(`Monday API error: ${response.status}`);
    }

    const result = await response.json();
    const items = result?.data?.boards?.[0]?.items_page?.items ?? [];

    const units = items.map((item) => {
      // Extract first image from subitems
      let imageUrl = "";
      if (item.subitems && item.subitems.length > 0) {
        const firstSubitem = item.subitems[0];
        const linkCol = firstSubitem.column_values.find((c) => c.id === "link_mktkw42r");
        if (linkCol && linkCol.value) {
          try {
            const linkData = JSON.parse(linkCol.value);
            imageUrl = linkData.url;
          } catch (e) {
            console.log('Error parsing link column value:', e);
          }
        }
      }

      return {
        id: item.id,
        name: item.name,
        propertyName: item.column_values.find((c) => c.id === "text_mktkkbsb")?.text || "", // Address column
        unitType: item.column_values.find((c) => c.id === "color_mktkdvc5")?.text || "", // Unit Type column
        status: item.column_values.find((c) => c.id === "color_mktk40b8")?.text || "", // Marketing column as status
        imageUrl: imageUrl
      };
    });

    return createCorsResponse(200, { units });

  } catch (error) {
    console.error('Monday API proxy error:', error);
    
    return createCorsResponse(500, { error: "Failed to fetch units from Monday.com" });
  }
}; 