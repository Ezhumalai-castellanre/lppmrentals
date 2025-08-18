const fetch = require('node-fetch');

// Webhook URLs for Make.com
const FILE_WEBHOOK_URL = 'https://hook.us1.make.com/2vu8udpshhdhjkoks8gchub16wjp7cu3';
const FORM_WEBHOOK_URL = 'https://hook.us1.make.com/og5ih0pl1br72r1pko39iimh3hdl31hk';

exports.handler = async (event, context) => {
  console.log('=== WEBHOOK PROXY LAMBDA FUNCTION CALLED ===');
  
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    // Check if it's a POST request
    if (event.httpMethod !== 'POST') {
              return {
          statusCode: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          body: JSON.stringify({
            error: 'Method not allowed',
            message: 'Only POST requests are supported'
          })
        };
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
              return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          body: JSON.stringify({
            error: 'Invalid JSON',
            message: 'Request body must be valid JSON'
          })
        };
    }

    // Check request size
    const bodySize = event.body ? event.body.length : 0;
    const bodySizeMB = Math.round(bodySize / (1024 * 1024) * 100) / 100;
    console.log(`📦 Request body size: ${bodySizeMB}MB`);
    
    if (bodySize > 50 * 1024 * 1024) { // 50MB limit
      console.log('❌ Request too large');
      return {
        statusCode: 413,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Request too large',
          message: 'Request body exceeds 50MB limit'
        })
      };
    }

    const { webhookType, webhookData } = body;

    if (!webhookType || !webhookData) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'webhookType and webhookData are required'
        })
      };
    }

    let webhookUrl;
    let webhookPayload;

    if (webhookType === 'file_upload') {
      webhookUrl = FILE_WEBHOOK_URL;
      webhookPayload = {
        reference_id: webhookData.reference_id,
        file_name: webhookData.file_name,
        section_name: webhookData.section_name,
        document_name: webhookData.document_name,
        s3_url: webhookData.s3_url,
        s3_key: webhookData.s3_key,
        file_size: webhookData.file_size,
        file_type: webhookData.file_type,
        application_id: webhookData.application_id,
        comment_id: webhookData.comment_id,
        uploaded_at: webhookData.uploaded_at,
      };
    } else if (webhookType === 'form_data') {
      webhookUrl = FORM_WEBHOOK_URL;
      webhookPayload = {
        reference_id: webhookData.reference_id,
        application_id: webhookData.application_id,
        form_data: webhookData.form_data,
      };
    } else {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        body: JSON.stringify({
          error: 'Invalid webhook type',
          message: 'webhookType must be either "file_upload" or "form_data"'
        })
      };
    }

    console.log(`📤 Sending ${webhookType} to webhook: ${webhookUrl}`);
    console.log(`📦 Payload size: ${JSON.stringify(webhookPayload).length} bytes`);

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      const responseBody = await webhookResponse.text();

      if (webhookResponse.ok) {
        console.log('✅ Webhook call successful');
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          body: JSON.stringify({
            success: true,
            message: 'Webhook sent successfully',
            webhookResponse: responseBody,
            statusCode: webhookResponse.status
          })
        };
      } else {
        console.error('❌ Webhook call failed:', webhookResponse.status, responseBody);
        return {
          statusCode: webhookResponse.status,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          body: JSON.stringify({
            success: false,
            error: 'Webhook call failed',
            statusCode: webhookResponse.status,
            responseBody: responseBody
          })
        };
      }

    } catch (webhookError) {
      console.error('❌ Error calling webhook:', webhookError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        body: JSON.stringify({
          success: false,
          error: 'Webhook call failed',
          message: webhookError.message || 'Unknown webhook error'
        })
      };
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred'
      })
    };
  }
};
