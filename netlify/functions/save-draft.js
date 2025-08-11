import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { createCorsResponse, handlePreflight } from './utils.js';

// AWS Configuration from environment variables
const AWS_REGION = process.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID || 'AKIA35BCK6ZHZC4EWVHT';
const AWS_SECRET_ACCESS_KEY = process.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY || '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';
const TABLE_NAME = process.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved';

// Log configuration for debugging
console.log('🔧 Save Draft DynamoDB Configuration:', {
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

// Clean data by removing undefined values recursively
function cleanData(data) {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => cleanData(item)).filter(item => item !== null);
  }
  
  if (typeof data === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      const cleanedValue = cleanData(value);
      if (cleanedValue !== null && cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null;
  }
  
  return data;
}

// Compress large data to fit within DynamoDB limits
function compressData(data, maxSize = 350000) { // 350KB to leave room for metadata
  const jsonString = JSON.stringify(data);
  console.log('📊 Draft data size before compression:', jsonString.length, 'characters');
  
  if (jsonString.length <= maxSize) {
    return data;
  }
  
  console.log('⚠️ Draft data too large, compressing...');
  
  // Create a compressed version by removing large fields
  const compressed = { ...data };
  
  // Remove large document data but keep file metadata and URLs
  if (compressed.documents) {
    console.log('🗑️ Removing large documents data to reduce size');
    delete compressed.documents;
  }
  
  if (compressed.encryptedDocuments) {
    console.log('🗑️ Removing large encrypted documents data to reduce size');
    delete compressed.encryptedDocuments;
  }
  
  // Keep webhook responses (URLs) but remove large response bodies
  if (compressed.webhookResponses) {
    console.log('🔗 Keeping webhook response URLs, removing large response bodies');
    const cleanedResponses = {};
    Object.entries(compressed.webhookResponses).forEach(([key, response]) => {
      if (typeof response === 'string') {
        // If it's already a URL string, keep it
        cleanedResponses[key] = response;
      } else if (response && response.body) {
        // Extract just the URL from the response body
        cleanedResponses[key] = response.body;
      } else if (response && response.url) {
        // Extract just the URL from the response
        cleanedResponses[key] = response.url;
      }
    });
    compressed.webhookResponses = cleanedResponses;
  }
  
  // Keep uploaded files metadata but optimize it
  if (compressed.uploadedFilesMetadata) {
    console.log('📁 Optimizing uploaded files metadata');
    const optimizedMetadata = {};
    Object.entries(compressed.uploadedFilesMetadata).forEach(([section, files]) => {
      if (Array.isArray(files)) {
        optimizedMetadata[section] = files.map(file => ({
          file_name: file.file_name,
          file_size: file.file_size,
          mime_type: file.mime_type,
          upload_date: file.upload_date,
          webhook_url: file.webhook_url || null // Keep the webhook URL if available
        }));
      }
    });
    compressed.uploadedFilesMetadata = optimizedMetadata;
  }
  
  const compressedJson = JSON.stringify(compressed);
  console.log('📊 Draft data size after compression:', compressedJson.length, 'characters');
  
  if (compressedJson.length > maxSize) {
    console.log('⚠️ Draft data still too large after compression, saving minimal data');
    // Save only essential fields
    return {
      applicantId: data.applicantId,
      currentStep: data.currentStep,
      lastSaved: data.lastSaved,
      isComplete: data.isComplete,
      webhookResponses: compressed.webhookResponses || {},
      uploadedFilesMetadata: compressed.uploadedFilesMetadata || {},
      // Keep basic form structure without large data
      form_data: {
        applicant: data.applicant ? {
          firstName: data.applicant.firstName,
          lastName: data.applicant.lastName,
          email: data.applicant.email,
          phone: data.applicant.phone,
        } : null,
        coApplicant: data.coApplicant ? {
          firstName: data.coApplicant.firstName,
          lastName: data.coApplicant.lastName,
          email: data.coApplicant.email,
          phone: data.coApplicant.phone,
        } : null,
        guarantor: data.guarantor ? {
          firstName: data.guarantor.firstName,
          lastName: data.guarantor.lastName,
          email: data.guarantor.email,
          phone: data.guarantor.phone,
        } : null,
        property: data.property ? {
          address: data.property.address,
          unit: data.property.unit,
        } : null,
      }
    };
  }
  
  return compressed;
}

export const handler = async (event, context) => {
  // Handle preflight requests
  const preflightResponse = handlePreflight(event);
  if (preflightResponse) return preflightResponse;

  if (event.httpMethod !== 'POST') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    console.log('=== SAVE DRAFT FUNCTION CALLED ===');
    
    const body = JSON.parse(event.body);
    const { draftData, applicantId, action = 'save' } = body;

    if (!draftData) {
      return createCorsResponse(400, { error: 'Missing draft data' });
    }

    if (!applicantId) {
      return createCorsResponse(400, { error: 'Missing applicant ID' });
    }

    console.log('📋 Draft data received:', {
      applicantId,
      action,
      dataSize: JSON.stringify(draftData).length,
      hasWebhookResponses: !!draftData.webhookResponses,
      hasUploadedFiles: !!draftData.uploadedFilesMetadata,
      currentStep: draftData.currentStep,
      hasDocuments: !!draftData.documents
    });

    // Clean and compress the data
    const cleanedData = cleanData(draftData);
    const compressedData = compressData(cleanedData);

    // Add metadata
    const itemToSave = {
      applicantId,
      ...compressedData,
      lastSaved: new Date().toISOString(),
      version: '1.0',
      compressed: true
    };

    console.log('💾 Saving draft to DynamoDB:', {
      tableName: TABLE_NAME,
      applicantId,
      finalSize: JSON.stringify(itemToSave).length,
      hasWebhookResponses: !!itemToSave.webhookResponses,
      webhookResponseKeys: itemToSave.webhookResponses ? Object.keys(itemToSave.webhookResponses) : [],
      hasDocuments: !!itemToSave.documents,
      currentStep: itemToSave.currentStep
    });

    // Save to DynamoDB
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: itemToSave
    });

    const result = await docClient.send(putCommand);
    
    console.log('✅ Draft saved successfully:', {
      applicantId,
      result: result.$metadata,
      savedSize: JSON.stringify(itemToSave).length
    });

    return createCorsResponse(200, {
      success: true,
      message: 'Draft saved successfully',
      applicantId,
      savedAt: itemToSave.lastSaved,
      dataSize: JSON.stringify(itemToSave).length,
      webhookResponses: itemToSave.webhookResponses || {},
      uploadedFiles: itemToSave.uploadedFilesMetadata || {},
      documents: itemToSave.documents || {},
      currentStep: itemToSave.currentStep
    });

  } catch (error) {
    console.error('❌ Save draft error:', error);
    
    return createCorsResponse(500, {
      success: false,
      error: error.message || 'Failed to save draft',
      details: error.stack
    });
  }
};
