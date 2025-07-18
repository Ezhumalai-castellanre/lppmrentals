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
    
    const body = JSON.parse(event.body);
    const { applicationData, uploadedFilesMetadata } = body;

    if (!applicationData) {
      return createCorsResponse(400, { error: 'Missing application data' });
    }

    // Log the received data for debugging
    console.log('Received applicationData:', JSON.stringify(applicationData, null, 2));
    console.log('Received uploadedFilesMetadata:', JSON.stringify(uploadedFilesMetadata, null, 2));

    // Validate application data
    console.log('About to validate applicationData.applicantDob:', applicationData.applicantDob ? applicationData.applicantDob.toString() : 'null');
    console.log('About to validate applicationData.moveInDate:', applicationData.moveInDate ? applicationData.moveInDate.toString() : 'null');
    
    const validatedData = insertRentalApplicationSchema.parse(applicationData);
    
    console.log('Validation passed. validatedData.applicantDob:', validatedData.applicantDob ? validatedData.applicantDob.toString() : 'null');
    console.log('Validation passed. validatedData.moveInDate:', validatedData.moveInDate ? validatedData.moveInDate.toString() : 'null');

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

  } catch (error) {
    console.error('Submit application error:', error instanceof Error ? error.message : 'Unknown error');
    
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 