import { storage } from './storage-mock.js';
import { insertRentalApplicationSchema } from './schema-mock.js';
import { createCorsResponse, handlePreflight } from './utils.js';

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

      if (event.httpMethod !== 'POST') {
      return createCorsResponse(405, { error: 'Method not allowed' });
    }


    
  try {
    console.log('=== SUBMIT-APPLICATION FUNCTION CALLED ===');
    
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (jsonErr) {
      console.error('JSON parse error:', jsonErr, 'Body:', event.body);
      return createCorsResponse(400, { error: 'Malformed JSON', message: jsonErr instanceof Error ? jsonErr.message : 'Unknown JSON error' });
    }
    const { applicationData, uploadedFilesMetadata } = body;

    if (!applicationData) {
      return createCorsResponse(400, { error: 'Missing application data' });
    }

    // Log the received data for debugging
    console.log('Received applicationData:', JSON.stringify(applicationData, null, 2));
    console.log('Received uploadedFilesMetadata:', JSON.stringify(uploadedFilesMetadata, null, 2));

    // Coerce number fields if they are strings
    const numberFields = [
      'monthlyRent',
      'applicantLengthAtAddressYears',
      'applicantLengthAtAddressMonths',
      'applicantCurrentRent'
    ];
    for (const field of numberFields) {
      if (field in applicationData && typeof applicationData[field] === 'string' && applicationData[field].trim() !== '') {
        const coerced = Number(applicationData[field]);
        if (!isNaN(coerced)) applicationData[field] = coerced;
      }
    }

    // Validate application data
    try {
      const validatedData = insertRentalApplicationSchema.parse(applicationData);
      console.log('Validation passed. validatedData:', validatedData);

      // Create application in database
      const result = await storage.createApplication({
        ...validatedData,
        documents: uploadedFilesMetadata ? JSON.stringify(uploadedFilesMetadata) : undefined,
        encryptedData: undefined // No longer sending encrypted data to server
      });

      return createCorsResponse(200, {
        success: true,
        applicationId: result.id,
        message: 'Application submitted successfully'
      });
    } catch (validationError) {
      // Zod validation error
      if (validationError && validationError.errors) {
        console.error('Validation error:', validationError.errors);
        return createCorsResponse(400, {
          error: 'Validation failed',
          details: validationError.errors
        });
      }
      // Other error
      console.error('Validation error:', validationError);
      return createCorsResponse(400, {
        error: 'Validation failed',
        message: validationError instanceof Error ? validationError.message : 'Unknown validation error'
      });
    }
  } catch (error) {
    // Log the full error object
    console.error('Submit application error:', error);
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error && error.stack ? error.stack : undefined
    });
  }
}; 