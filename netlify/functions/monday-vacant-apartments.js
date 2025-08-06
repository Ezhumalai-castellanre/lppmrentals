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
    const BOARD_ID = process.env.MONDAY_BOARD_ID || "8740450373";

    const query = `
      query {
        boards(ids: [${BOARD_ID}]) {
          items_page(query_params: {
            rules: [
              { column_id: "color_mkp7fmq4", compare_value: "Vacant", operator: contains_terms }
            ]
          }) {
            items {
              id
              name
              column_values(ids: ["color_mkp7xdce", "color_mkp77nrv", "color_mkp7fmq4", "link_mktj22y9"]) {
                id
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

    const units = items.map((item) => ({
      id: item.id,
      name: item.name,
      propertyName: item.column_values.find((c) => c.id === "color_mkp7xdce")?.text || "",
      unitType: item.column_values.find((c) => c.id === "color_mkp77nrv")?.text || "",
      status: item.column_values.find((c) => c.id === "color_mkp7fmq4")?.text || "",
      imageUrl: item.column_values.find((c) => c.id === "link_mktj22y9")?.text || ""
    }));

    return createCorsResponse(200, { units });

  } catch (error) {
    console.error('Monday API proxy error:', error);
    
    return createCorsResponse(500, { error: "Failed to fetch units from Monday.com" });
  }
}; 