import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// AWS Configuration from environment variables
const AWS_REGION = process.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID || 'AKIA35BCK6ZHZC4EWVHT';
const AWS_SECRET_ACCESS_KEY = process.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY || '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';
const TABLE_NAME = process.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved';

// Log configuration for debugging
console.log('🔧 DynamoDB Configuration:', {
  region: AWS_REGION,
  tableName: TABLE_NAME,
  accessKeyId: AWS_ACCESS_KEY_ID ? `${AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'Not set',
  hasSecretKey: !!AWS_SECRET_ACCESS_KEY,
});

// Validate required environment variables
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️ AWS DynamoDB credentials not properly configured. Check your environment variables.');
}

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

// Compress large data by removing unnecessary fields and truncating large strings
function compressData(data, maxSize = 350000) { // 350KB to leave room for metadata
  const jsonString = JSON.stringify(data);
  console.log('📊 Data size before compression:', jsonString.length, 'characters');
  
  if (jsonString.length <= maxSize) {
    return data;
  }
  
  console.log('⚠️ Data too large, compressing...');
  
  // Create a compressed version by removing large fields
  const compressed = { ...data };
  
  // Remove uploaded files data as it's the largest contributor
  if (compressed.uploadedFiles) {
    console.log('🗑️ Removing uploadedFiles data to reduce size');
    delete compressed.uploadedFiles;
  }
  
  // Remove webhook responses which can be large
  if (compressed.webhookResponses) {
    console.log('🗑️ Removing webhookResponses data to reduce size');
    delete compressed.webhookResponses;
  }
  
  // OPTIMIZED: Compress uploadedFilesMetadata more aggressively
  if (compressed.uploadedFilesMetadata) {
    console.log('🗜️ Compressing uploadedFilesMetadata to reduce size');
    const originalMetadataSize = JSON.stringify(compressed.uploadedFilesMetadata).length;
    
    // Only keep essential fields for each file
    const compressedMetadata = {};
    Object.entries(compressed.uploadedFilesMetadata).forEach(([section, files]) => {
      if (Array.isArray(files)) {
        compressedMetadata[section] = files.map(file => ({
          file_name: file.file_name,
          file_size: file.file_size,
          mime_type: file.mime_type,
          upload_date: file.upload_date
          // Remove any additional fields that might be large
        }));
      }
    });
    
    compressed.uploadedFilesMetadata = compressedMetadata;
    const compressedMetadataSize = JSON.stringify(compressed.uploadedFilesMetadata).length;
    console.log(`📊 UploadedFilesMetadata compressed: ${originalMetadataSize} -> ${compressedMetadataSize} characters (${Math.round((originalMetadataSize - compressedMetadataSize) / originalMetadataSize * 100)}% reduction)`);
  }
  
  // Truncate large string fields
  const truncateLargeStrings = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > 1000) {
        console.log(`✂️ Truncating large string field: ${key} (${value.length} chars)`);
        obj[key] = value.substring(0, 500) + '... [truncated]';
      } else if (typeof value === 'object' && value !== null) {
        truncateLargeStrings(value);
      }
    }
  };
  
  truncateLargeStrings(compressed);
  
  const compressedJson = JSON.stringify(compressed);
  console.log('📊 Data size after compression:', compressedJson.length, 'characters');
  
  if (compressedJson.length > maxSize) {
    console.log('⚠️ Data still too large after compression, saving minimal data');
    // Save only essential fields
    return {
      applicantId: data.applicantId,
      currentStep: data.currentStep,
      lastSaved: data.lastSaved,
      isComplete: data.isComplete,
      // Keep only basic form structure without large data
      formData: {
        applicant: data.applicant ? {
          firstName: data.applicant.firstName,
          lastName: data.applicant.lastName,
          email: data.applicant.email,
          phone: data.applicant.phone,
          // Remove large fields
        } : null,
        coApplicant: data.coApplicant ? {
          firstName: data.coApplicant.firstName,
          lastName: data.coApplicant.lastName,
          email: data.coApplicant.email,
          phone: data.coApplicant.phone,
          // Remove large fields
        } : null,
        guarantor: data.guarantor ? {
          firstName: data.guarantor.firstName,
          lastName: data.guarantor.lastName,
          email: data.guarantor.email,
          phone: data.guarantor.phone,
          // Remove large fields
        } : null,
        // Keep basic property info
        property: data.property ? {
          address: data.property.address,
          unit: data.property.unit,
          // Remove large fields
        } : null,
      }
    };
  }
  
  return compressed;
}

// Validate draft data before saving
function validateDraftData(draftData) {
  if (!draftData.applicantId || typeof draftData.applicantId !== 'string') {
    console.error('❌ Invalid applicantId:', draftData.applicantId);
    return false;
  }
  
  if (typeof draftData.currentStep !== 'number' || draftData.currentStep < 0) {
    console.error('❌ Invalid currentStep:', draftData.currentStep);
    return false;
  }
  
  if (typeof draftData.isComplete !== 'boolean') {
    console.error('❌ Invalid isComplete:', draftData.isComplete);
    return false;
  }
  
  if (!draftData.lastSaved || typeof draftData.lastSaved !== 'string') {
    console.error('❌ Invalid lastSaved:', draftData.lastSaved);
    return false;
  }
  
  return true;
}

// DynamoDB Service Functions
async function saveDraft(applicantId, formData, currentStep, isComplete = false) {
  try {
    console.log('🔄 Saving draft for applicantId:', applicantId);
    console.log('📊 Original form data size:', JSON.stringify(formData).length, 'characters');
    
    // Validate the draft data
    const draftData = {
      applicantId,
      form_data: formData, // Use form_data as the main container
      currentStep,
      lastSaved: new Date().toISOString(),
      isComplete,
    };
    
    if (!validateDraftData(draftData)) {
      throw new Error('Invalid draft data structure');
    }
    
    // Clean and compress the data
    const cleanedData = cleanData(draftData);
    const compressedData = compressData(cleanedData);
    
    console.log('📊 Final compressed data size:', JSON.stringify(compressedData).length, 'characters');
    
    // Save to DynamoDB
    const params = {
      TableName: 'DraftSaved',
      Item: {
        applicantId: applicantId,
        form_data: JSON.stringify(compressedData.form_data),
        currentStep: compressedData.currentStep,
        lastSaved: compressedData.lastSaved,
        isComplete: compressedData.isComplete,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };
    
    console.log('💾 Saving to DynamoDB with params:', JSON.stringify(params, null, 2));
    
    const result = await dynamoDB.put(params).promise();
    console.log('✅ Draft saved successfully:', result);
    
    return {
      success: true,
      applicantId,
      currentStep,
      lastSaved: draftData.lastSaved,
      isComplete
    };
  } catch (error) {
    console.error('❌ Error saving draft:', error);
    throw new Error(`Failed to save draft: ${error.message}`);
  }
}

async function loadDraft(applicantId) {
  try {
    console.log('🔄 Loading draft for applicantId:', applicantId);
    
    const params = {
      TableName: 'DraftSaved',
      Key: {
        applicantId: applicantId
      }
    };
    
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
      console.log('📭 No draft found for applicantId:', applicantId);
      return null;
    }
    
    console.log('📥 Draft found, parsing data...');
    
    // Parse the form_data from JSON string
    let formData = {};
    try {
      formData = JSON.parse(result.Item.form_data);
    } catch (parseError) {
      console.error('❌ Error parsing form_data:', parseError);
      // Try to parse as old format
      try {
        formData = JSON.parse(result.Item.formData || '{}');
      } catch (oldParseError) {
        console.error('❌ Error parsing old format formData:', oldParseError);
        formData = {};
      }
    }
    
    const draftData = {
      applicantId: result.Item.applicantId,
      form_data: formData,
      currentStep: result.Item.currentStep,
      lastSaved: result.Item.lastSaved,
      isComplete: result.Item.isComplete,
    };
    
    console.log('✅ Draft loaded successfully for applicantId:', applicantId);
    console.log('📊 Draft data size:', JSON.stringify(draftData).length, 'characters');
    
    return draftData;
  } catch (error) {
    console.error('❌ Error loading draft:', error);
    throw new Error(`Failed to load draft: ${error.message}`);
  }
}

async function deleteDraft(applicantId) {
  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { applicantId },
    });

    await docClient.send(command);
    console.log('✅ Draft deleted successfully for applicantId:', applicantId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting draft:', error);
    throw error;
  }
}

async function draftExists(applicantId) {
  try {
    const draft = await loadDraft(applicantId);
    return draft !== null;
  } catch (error) {
    console.error('❌ Error checking draft existence:', error);
    return false;
  }
}

async function getDraftMetadata(applicantId) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { applicantId },
      ProjectionExpression: 'currentStep, lastSaved, isComplete',
    });

    const response = await docClient.send(command);
    
    if (response.Item) {
      return {
        currentStep: response.Item.currentStep,
        lastSaved: response.Item.lastSaved,
        isComplete: response.Item.isComplete,
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting draft metadata:', error);
    return null;
  }
}

export {
  saveDraft,
  loadDraft,
  deleteDraft,
  draftExists,
  getDraftMetadata,
  compressData,
  cleanData,
}; 