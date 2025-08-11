import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createCorsResponse, handlePreflight } from './utils.js';

// AWS Configuration from environment variables
const AWS_REGION = process.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID || 'AKIA35BCK6ZHZC4EWVHT';
const AWS_SECRET_ACCESS_KEY = process.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY || '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';
const TABLE_NAME = process.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved';

// Log configuration for debugging
console.log('🔧 Get Draft DynamoDB Configuration:', {
  region: AWS_REGION,
  tableName: TABLE_NAME,
  accessKeyId: AWS_ACCESS_KEY_ID ? `${AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'Not set',
  hasSecretKey: !!AWS_SECRET_ACCESS_KEY,
});

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  if (event.httpMethod !== 'GET') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    console.log('=== GET DRAFT FUNCTION CALLED ===');
    
    // Get applicantId from query parameters
    const { applicantId } = event.queryStringParameters || {};

    if (!applicantId) {
      return createCorsResponse(400, { error: 'Missing applicant ID' });
    }

    console.log('🔍 Retrieving draft for applicant:', applicantId);

    // Get draft from DynamoDB
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        applicantId: applicantId
      }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      console.log('📭 No draft found for applicant:', applicantId);
      return createCorsResponse(404, {
        success: false,
        message: 'No draft found',
        applicantId
      });
    }

    const draftData = result.Item;
    
    console.log('✅ Draft retrieved successfully:', {
      applicantId,
      lastSaved: draftData.lastSaved,
      currentStep: draftData.currentStep,
      hasWebhookResponses: !!draftData.webhookResponses,
      webhookResponseKeys: draftData.webhookResponses ? Object.keys(draftData.webhookResponses) : [],
      hasUploadedFiles: !!draftData.uploadedFilesMetadata,
      uploadedFileSections: draftData.uploadedFilesMetadata ? Object.keys(draftData.uploadedFilesMetadata) : [],
      dataSize: JSON.stringify(draftData).length
    });

    // Extract and format the response
    const response = {
      success: true,
      message: 'Draft retrieved successfully',
      applicantId: draftData.applicantId,
      lastSaved: draftData.lastSaved,
      currentStep: draftData.currentStep,
      isComplete: draftData.isComplete || false,
      compressed: draftData.compressed || false,
      version: draftData.version || '1.0',
      
      // Form data
      formData: draftData.form_data || draftData.rawFormData || {},
      
      // Webhook responses (file URLs)
      webhookResponses: draftData.webhookResponses || {},
      
      // Uploaded files metadata with URLs
      uploadedFilesMetadata: draftData.uploadedFilesMetadata || {},
      
      // Other form state
      signatures: draftData.signatures || {},
      documents: draftData.documents || {},
      encryptedDocuments: draftData.encryptedDocuments || {},
      uploadedDocuments: draftData.uploadedDocuments || {},
      
      // Flags
      hasCoApplicant: draftData.hasCoApplicant || false,
      hasGuarantor: draftData.hasGuarantor || false,
      
      // Raw data for restoration
      rawFormData: draftData.rawFormData || {},
      rawFormValues: draftData.rawFormValues || {}
    };

    return createCorsResponse(200, response);

  } catch (error) {
    console.error('❌ Get draft error:', error);
    
    return createCorsResponse(500, {
      success: false,
      error: error.message || 'Failed to retrieve draft',
      details: error.stack
    });
  }
};
