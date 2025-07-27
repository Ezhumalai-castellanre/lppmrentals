import { insertRentalApplicationSchema } from './schema.js';
import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  if (event.httpMethod !== 'POST') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    console.log('=== TEST SCHEMA FUNCTION CALLED ===');
    
    // Parse JSON body
    let body;
    try {
      body = JSON.parse(event.body);
      console.log('✅ JSON parsed successfully');
    } catch (jsonErr) {
      console.error('❌ JSON parse error:', jsonErr);
      return createCorsResponse(400, { 
        error: 'Malformed JSON', 
        message: jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON error'
      });
    }
    
    const { applicationData } = body;

    if (!applicationData) {
      console.error('❌ Missing application data');
      return createCorsResponse(400, { 
        error: 'Missing application data'
      });
    }

    console.log('📋 Testing schema validation with data:', JSON.stringify(applicationData, null, 2));
    
    // Test schema validation
    try {
      const validatedData = insertRentalApplicationSchema.parse(applicationData);
      console.log('✅ Schema validation passed');
      console.log('📋 Validated data:', JSON.stringify(validatedData, null, 2));
      
      return createCorsResponse(200, {
        success: true,
        message: 'Schema validation passed',
        validatedData
      });
    } catch (validationError) {
      console.error('❌ Schema validation failed:', validationError);
      return createCorsResponse(400, {
        success: false,
        error: 'Schema validation failed',
        details: validationError.errors || validationError.message,
        message: 'Please check your form data and try again'
      });
    }

  } catch (error) {
    console.error('❌ Test schema error:', error);
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 