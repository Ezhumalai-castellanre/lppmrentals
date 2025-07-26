import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  if (event.httpMethod !== 'POST') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    console.log('=== PROXY TO MAKE.COM WEBHOOK ===');
    
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (jsonErr) {
      console.error('JSON parse error:', jsonErr, 'Body:', event.body);
      return createCorsResponse(400, { error: 'Malformed JSON', message: jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON error' });
    }

    // Add metadata to the request
    const webhookPayload = {
      ...body,
      metadata: {
        ...body.metadata,
        submittedAt: new Date().toISOString(),
        source: 'lppmrentals-application-form',
        version: '1.0',
        proxy: true
      }
    };

    console.log('Sending to Make.com webhook:', JSON.stringify(webhookPayload, null, 2));

    // Proxy the request to Make.com webhook
    const webhookUrl = 'https://hook.us1.make.com/og5ih0pl1br72r1pko39iimh3hdl31hk';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    console.log('Webhook response status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', webhookResponse.status, errorText);
      
      // Handle specific webhook errors
      if (webhookResponse.status === 413) {
        return createCorsResponse(413, { 
          error: 'Content too large', 
          message: 'Application data is too large. Please reduce file sizes and try again.' 
        });
      } else if (webhookResponse.status === 504) {
        return createCorsResponse(504, { 
          error: 'Timeout', 
          message: 'Submission timed out. Please try again with smaller files.' 
        });
      } else {
        return createCorsResponse(webhookResponse.status, { 
          error: 'Webhook submission failed',
          message: `Webhook returned ${webhookResponse.status}: ${webhookResponse.statusText}`,
          details: errorText
        });
      }
    }

    // Try to get response body
    let responseBody;
    try {
      responseBody = await webhookResponse.json();
    } catch (e) {
      responseBody = { status: 'success', message: 'Data sent to webhook' };
    }

    console.log('Webhook submission successful:', responseBody);

    return createCorsResponse(200, {
      success: true,
      message: 'Application submitted successfully to webhook',
      webhookResponse: responseBody
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error && error.stack ? error.stack : undefined
    });
  }
}; 