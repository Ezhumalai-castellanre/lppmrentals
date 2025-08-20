exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get the target URL from query parameters
  const targetUrl = event.queryStringParameters?.url;
  if (!targetUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing target URL' })
    };
  }

  try {
    // Forward the request to the target URL
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': event.headers['content-type'] || 'application/json',
        ...Object.fromEntries(
          Object.entries(event.headers).filter(([key]) => 
            key.toLowerCase().startsWith('x-') || 
            key.toLowerCase() === 'authorization'
          )
        )
      },
      body: event.body
    });

    const responseBody = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': 'https://production.d3gr5amtgpvpl9.amplifyapp.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      },
      body: responseBody
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://production.d3gr5amtgpvpl9.amplifyapp.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      },
      body: JSON.stringify({ error: 'Proxy request failed', details: error.message })
    };
  }
};
