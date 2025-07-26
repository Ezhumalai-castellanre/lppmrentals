import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  console.log('=== SUBMIT-APPLICATION FUNCTION CALLED ===');
  console.log('Event method:', event.httpMethod);
  console.log('Event path:', event.path);
  console.log('Event body length:', event.body ? event.body.length : 0);
  
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) {
    console.log('Returning preflight response');
    return preflightResponse;
  }

  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    console.log('=== FORWARDING TO MAKE.COM WEBHOOK ===');
    
    // Just forward the raw body to the webhook
    const webhookUrl = 'https://hook.us1.make.com/og5ih0pl1br72r1pko39iimh3hdl31hk';
    
    console.log('Sending raw body to webhook, length:', event.body ? event.body.length : 0);
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: event.body, // Send the raw body as-is
    });

    console.log('Webhook response status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', webhookResponse.status, errorText);
      
      return createCorsResponse(webhookResponse.status, { 
        error: 'Webhook submission failed',
        message: `Webhook returned ${webhookResponse.status}: ${webhookResponse.statusText}`,
        details: errorText
      });
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
    console.error('Function error:', error);
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 