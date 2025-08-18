import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  if (event.httpMethod !== 'POST') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    console.log('=== WEBHOOK PROXY FUNCTION CALLED ===');
    
    // Check request size
    const bodySize = event.body ? event.body.length : 0;
    const bodySizeMB = Math.round(bodySize / (1024 * 1024) * 100) / 100;
    console.log(`📦 Request body size: ${bodySizeMB}MB`);
    
    if (bodySize > 10 * 1024 * 1024) { // 10MB limit
      console.log('❌ Request too large');
      return createCorsResponse(413, { 
        error: 'Request too large', 
        message: 'Request body exceeds 10MB limit' 
      });
    }
    
    // Parse JSON body
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('✅ JSON parsed successfully');
      console.log('📋 Received body keys:', Object.keys(body));
    } catch (jsonErr) {
      console.error('❌ JSON parse error:', jsonErr);
      return createCorsResponse(400, { 
        error: 'Malformed JSON', 
        message: jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON error'
      });
    }

    // Extract webhook type and data
    const { webhookType, webhookData } = body;

    if (!webhookType || !webhookData) {
      console.error('❌ Missing webhook type or data');
      return createCorsResponse(400, { 
        error: 'Missing webhook type or data'
      });
    }

    // Determine webhook URL based on type
    let webhookUrl;
    switch (webhookType) {
      case 'file_upload':
        webhookUrl = 'https://hook.us1.make.com/2vu8udpshhdhjkoks8gchub16wjp7cu3';
        break;
      case 'form_data':
        webhookUrl = 'https://hook.us1.make.com/og5ih0pl1br72r1pko39iimh3hdl31hk';
        break;
      default:
        console.error('❌ Invalid webhook type:', webhookType);
        return createCorsResponse(400, { 
          error: 'Invalid webhook type',
          message: `Unknown webhook type: ${webhookType}`
        });
    }

    console.log(`📤 Forwarding to webhook: ${webhookUrl}`);
    console.log(`📋 Webhook type: ${webhookType}`);
    console.log(`📊 Payload size: ${(JSON.stringify(webhookData).length / 1024).toFixed(2)}KB`);

    // Forward request to Make.com webhook
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Get response body
      const responseBody = await response.text();
      const responseTime = Date.now() - startTime;

      console.log(`📥 Webhook response received:`, {
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        bodySize: `${responseBody.length} bytes`
      });

      if (response.ok) {
        console.log('✅ Webhook call successful');
        return createCorsResponse(200, {
          success: true,
          status: response.status,
          body: responseBody,
          responseTime: responseTime
        });
      } else {
        console.error('❌ Webhook call failed:', response.status, responseBody);
        return createCorsResponse(response.status, {
          success: false,
          error: `Webhook failed: ${response.status}`,
          message: responseBody,
          status: response.status
        });
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('❌ Webhook request timed out after 60 seconds');
        return createCorsResponse(408, {
          success: false,
          error: 'Webhook request timed out'
        });
      }
      
      console.error('❌ Error calling webhook:', fetchError);
      return createCorsResponse(500, {
        success: false,
        error: 'Failed to call webhook',
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Webhook proxy error:', error instanceof Error ? error.message : 'Unknown error');
    
    return createCorsResponse(500, {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
