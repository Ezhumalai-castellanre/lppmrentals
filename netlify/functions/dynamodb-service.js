const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// DynamoDB Configuration
const TABLE_NAME = 'DraftSaved';

// Size Limitation Strategy:
// DynamoDB has a 400KB item size limit. This service implements aggressive compression:
// 1. Remove large data fields (encryptedDocuments, signatures, webhookResponses, etc.)
// 2. Truncate large strings to 200 characters
// 3. If still too large, save only essential metadata
// 4. Future improvement: Consider using S3 for large document data and storing only references

// AWS Configuration from environment variables
const AWS_REGION = process.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID || 'AKIA35BCK6ZHZC4EWVHT';
const AWS_SECRET_ACCESS_KEY = process.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY || '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';

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
  
  // Remove encrypted documents which are very large
  if (compressed.encryptedDocuments) {
    console.log('🗑️ Removing encryptedDocuments data to reduce size');
    delete compressed.encryptedDocuments;
  }
  
  // Remove uploaded documents metadata
  if (compressed.uploadedDocuments) {
    console.log('🗑️ Removing uploadedDocuments data to reduce size');
    delete compressed.uploadedDocuments;
  }
  
  // Preserve uploadedFilesMetadata for Co-Applicant and Guarantor documents
  // but remove other large metadata to stay within size limits
  if (compressed.uploadedFilesMetadata) {
    console.log('📁 Preserving uploadedFilesMetadata for Co-Applicant and Guarantor documents');
    
    // Keep only essential metadata for Co-Applicant and Guarantor
    const preservedMetadata = {};
    
    // Preserve Co-Applicant document metadata
    if (compressed.uploadedFilesMetadata.coApplicant_photo_id) {
      preservedMetadata.coApplicant_photo_id = compressed.uploadedFilesMetadata.coApplicant_photo_id;
    }
    if (compressed.uploadedFilesMetadata.coApplicant_social_security) {
      preservedMetadata.coApplicant_social_security = compressed.uploadedFilesMetadata.coApplicant_social_security;
    }
    if (compressed.uploadedFilesMetadata.coApplicant_w9_forms) {
      preservedMetadata.coApplicant_w9_forms = compressed.uploadedFilesMetadata.coApplicant_w9_forms;
    }
    if (compressed.uploadedFilesMetadata.coApplicant_employment_letter) {
      preservedMetadata.coApplicant_employment_letter = compressed.uploadedFilesMetadata.coApplicant_employment_letter;
    }
    if (compressed.uploadedFilesMetadata.coApplicant_pay_stubs) {
      preservedMetadata.coApplicant_pay_stubs = compressed.uploadedFilesMetadata.coApplicant_pay_stubs;
    }
    if (compressed.uploadedFilesMetadata.coApplicant_tax_returns) {
      preservedMetadata.coApplicant_tax_returns = compressed.uploadedFilesMetadata.coApplicant_tax_returns;
    }
    if (compressed.uploadedFilesMetadata.coApplicant_bank_statement) {
      preservedMetadata.coApplicant_bank_statement = compressed.uploadedFilesMetadata.coApplicant_bank_statement;
    }
    if (compressed.uploadedFilesMetadata.coApplicant_credit_report) {
      preservedMetadata.coApplicant_credit_report = compressed.uploadedFilesMetadata.coApplicant_credit_report;
    }
    
    // Preserve Guarantor document metadata
    if (compressed.uploadedFilesMetadata.guarantor_photo_id) {
      preservedMetadata.guarantor_photo_id = compressed.uploadedFilesMetadata.guarantor_photo_id;
    }
    if (compressed.uploadedFilesMetadata.guarantor_social_security) {
      preservedMetadata.guarantor_social_security = compressed.uploadedFilesMetadata.guarantor_social_security;
    }
    if (compressed.uploadedFilesMetadata.guarantor_w9_forms) {
      preservedMetadata.guarantor_w9_forms = compressed.uploadedFilesMetadata.guarantor_w9_forms;
    }
    if (compressed.uploadedFilesMetadata.guarantor_employment_letter) {
      preservedMetadata.guarantor_employment_letter = compressed.uploadedFilesMetadata.guarantor_employment_letter;
    }
    if (compressed.uploadedFilesMetadata.guarantor_pay_stubs) {
      preservedMetadata.guarantor_pay_stubs = compressed.uploadedFilesMetadata.guarantor_pay_stubs;
    }
    if (compressed.uploadedFilesMetadata.guarantor_tax_returns) {
      preservedMetadata.guarantor_tax_returns = compressed.uploadedFilesMetadata.guarantor_tax_returns;
    }
    if (compressed.uploadedFilesMetadata.guarantor_bank_statement) {
      preservedMetadata.guarantor_bank_statement = compressed.uploadedFilesMetadata.guarantor_bank_statement;
    }
    if (compressed.uploadedFilesMetadata.guarantor_credit_report) {
      preservedMetadata.guarantor_credit_report = compressed.uploadedFilesMetadata.guarantor_credit_report;
    }
    
    // Replace the full metadata with only the preserved Co-Applicant and Guarantor metadata
    compressed.uploadedFilesMetadata = preservedMetadata;
    
    console.log('✅ Preserved Co-Applicant and Guarantor document metadata');
  }
  
  // Remove signatures which can be large base64 strings
  if (compressed.signatures) {
    console.log('🗑️ Removing signatures data to reduce size');
    delete compressed.signatures;
  }
  
  // Remove signature timestamps
  if (compressed.signatureTimestamps) {
    console.log('🗑️ Removing signatureTimestamps data to reduce size');
    delete compressed.signatureTimestamps;
  }
  
  // Remove documents array
  if (compressed.documents) {
    console.log('🗑️ Removing documents data to reduce size');
    delete compressed.documents;
  }
  
  // Remove raw form data which can be large
  if (compressed.rawFormData) {
    console.log('🗑️ Removing rawFormData to reduce size');
    delete compressed.rawFormData;
  }
  
  // Remove raw form values
  if (compressed.rawFormValues) {
    console.log('🗑️ Removing rawFormValues to reduce size');
    delete compressed.rawFormValues;
  }
  
  // Truncate large string fields
  const truncateLargeStrings = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > 500) {
        console.log(`✂️ Truncating large string field: ${key} (${value.length} chars)`);
        obj[key] = value.substring(0, 200) + '... [truncated]';
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
        // Keep essential flags
        hasCoApplicant: data.hasCoApplicant,
        hasGuarantor: data.hasGuarantor,
        // Preserve Co-Applicant and Guarantor document metadata
        uploadedFilesMetadata: data.uploadedFilesMetadata ? {
          // Only preserve Co-Applicant and Guarantor metadata
          ...(data.uploadedFilesMetadata.coApplicant_photo_id && { coApplicant_photo_id: data.uploadedFilesMetadata.coApplicant_photo_id }),
          ...(data.uploadedFilesMetadata.coApplicant_social_security && { coApplicant_social_security: data.uploadedFilesMetadata.coApplicant_social_security }),
          ...(data.uploadedFilesMetadata.coApplicant_w9_forms && { coApplicant_w9_forms: data.uploadedFilesMetadata.coApplicant_w9_forms }),
          ...(data.uploadedFilesMetadata.coApplicant_employment_letter && { coApplicant_employment_letter: data.uploadedFilesMetadata.coApplicant_employment_letter }),
          ...(data.uploadedFilesMetadata.coApplicant_pay_stubs && { coApplicant_pay_stubs: data.uploadedFilesMetadata.coApplicant_pay_stubs }),
          ...(data.uploadedFilesMetadata.coApplicant_tax_returns && { coApplicant_tax_returns: data.uploadedFilesMetadata.coApplicant_tax_returns }),
          ...(data.uploadedFilesMetadata.coApplicant_bank_statement && { coApplicant_bank_statement: data.uploadedFilesMetadata.coApplicant_bank_statement }),
          ...(data.uploadedFilesMetadata.coApplicant_credit_report && { coApplicant_credit_report: data.uploadedFilesMetadata.coApplicant_credit_report }),
          ...(data.uploadedFilesMetadata.guarantor_photo_id && { guarantor_photo_id: data.uploadedFilesMetadata.guarantor_photo_id }),
          ...(data.uploadedFilesMetadata.guarantor_social_security && { guarantor_social_security: data.uploadedFilesMetadata.guarantor_social_security }),
          ...(data.uploadedFilesMetadata.guarantor_w9_forms && { guarantor_w9_forms: data.uploadedFilesMetadata.guarantor_w9_forms }),
          ...(data.uploadedFilesMetadata.guarantor_employment_letter && { guarantor_employment_letter: data.uploadedFilesMetadata.guarantor_employment_letter }),
          ...(data.uploadedFilesMetadata.guarantor_pay_stubs && { guarantor_pay_stubs: data.uploadedFilesMetadata.guarantor_pay_stubs }),
          ...(data.uploadedFilesMetadata.guarantor_tax_returns && { guarantor_tax_returns: data.uploadedFilesMetadata.guarantor_tax_returns }),
          ...(data.uploadedFilesMetadata.guarantor_bank_statement && { guarantor_bank_statement: data.uploadedFilesMetadata.guarantor_bank_statement }),
          ...(data.uploadedFilesMetadata.guarantor_credit_report && { guarantor_credit_report: data.uploadedFilesMetadata.guarantor_credit_report }),
        } : null,
      }
    };
  }
  
  // If still too large, save only the absolute minimum
  const minimalData = {
    applicantId: data.applicantId,
    currentStep: data.currentStep,
    lastSaved: data.lastSaved,
    isComplete: data.isComplete,
    formData: {
      hasCoApplicant: data.hasCoApplicant || false,
      hasGuarantor: data.hasGuarantor || false,
      // Preserve Co-Applicant and Guarantor document metadata even in minimal mode
      uploadedFilesMetadata: data.uploadedFilesMetadata ? {
        // Only preserve Co-Applicant and Guarantor metadata
        ...(data.uploadedFilesMetadata.coApplicant_photo_id && { coApplicant_photo_id: data.uploadedFilesMetadata.coApplicant_photo_id }),
        ...(data.uploadedFilesMetadata.coApplicant_social_security && { coApplicant_social_security: data.uploadedFilesMetadata.coApplicant_social_security }),
        ...(data.uploadedFilesMetadata.coApplicant_w9_forms && { coApplicant_w9_forms: data.uploadedFilesMetadata.coApplicant_w9_forms }),
        ...(data.uploadedFilesMetadata.coApplicant_employment_letter && { coApplicant_employment_letter: data.uploadedFilesMetadata.coApplicant_employment_letter }),
        ...(data.uploadedFilesMetadata.coApplicant_pay_stubs && { coApplicant_pay_stubs: data.uploadedFilesMetadata.coApplicant_pay_stubs }),
        ...(data.uploadedFilesMetadata.coApplicant_tax_returns && { coApplicant_tax_returns: data.uploadedFilesMetadata.coApplicant_tax_returns }),
        ...(data.uploadedFilesMetadata.coApplicant_bank_statement && { coApplicant_bank_statement: data.uploadedFilesMetadata.coApplicant_bank_statement }),
        ...(data.uploadedFilesMetadata.coApplicant_credit_report && { coApplicant_credit_report: data.uploadedFilesMetadata.coApplicant_credit_report }),
        ...(data.uploadedFilesMetadata.guarantor_photo_id && { guarantor_photo_id: data.uploadedFilesMetadata.guarantor_photo_id }),
        ...(data.uploadedFilesMetadata.guarantor_social_security && { guarantor_social_security: data.uploadedFilesMetadata.guarantor_social_security }),
        ...(data.uploadedFilesMetadata.guarantor_w9_forms && { guarantor_w9_forms: data.uploadedFilesMetadata.guarantor_w9_forms }),
        ...(data.uploadedFilesMetadata.guarantor_employment_letter && { guarantor_employment_letter: data.uploadedFilesMetadata.guarantor_employment_letter }),
        ...(data.uploadedFilesMetadata.guarantor_pay_stubs && { guarantor_pay_stubs: data.uploadedFilesMetadata.guarantor_pay_stubs }),
        ...(data.uploadedFilesMetadata.guarantor_tax_returns && { guarantor_tax_returns: data.uploadedFilesMetadata.guarantor_tax_returns }),
        ...(data.uploadedFilesMetadata.guarantor_bank_statement && { guarantor_bank_statement: data.uploadedFilesMetadata.guarantor_bank_statement }),
        ...(data.uploadedFilesMetadata.guarantor_credit_report && { guarantor_credit_report: data.uploadedFilesMetadata.guarantor_credit_report }),
      } : null,
    }
  };
  
  const minimalJson = JSON.stringify(minimalData);
  console.log('📊 Minimal data size:', minimalJson.length, 'characters');
  
  if (minimalJson.length > maxSize) {
    console.error('❌ Even minimal data is too large:', minimalJson.length, 'characters');
    throw new Error('Item size has exceeded the maximum allowed size');
  }
  
  return minimalData;
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
    
    // Clean the form data to remove undefined values
    const cleanedFormData = cleanData(formData);
    
    console.log('🧹 Cleaned form data size:', JSON.stringify(cleanedFormData).length, 'characters');
    
    // Compress data if it's too large for DynamoDB
    const compressedFormData = compressData(cleanedFormData);
    
    const draftData = {
      applicantId,
      formData: compressedFormData,
      currentStep,
      lastSaved: new Date().toISOString(),
      isComplete,
    };

    // Check final size before saving
    const finalSize = JSON.stringify(draftData).length;
    console.log('📊 Final draft data size:', finalSize, 'characters');
    
    if (finalSize > 400000) { // DynamoDB limit is 400KB
      console.error('❌ Draft data still too large after compression:', finalSize, 'characters');
      throw new Error('Item size has exceeded the maximum allowed size');
    }

    // Validate the draft data before saving
    if (!validateDraftData(draftData)) {
      throw new Error('Invalid draft data');
    }

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: draftData,
    });

    await docClient.send(command);
    console.log('✅ Draft saved successfully for applicantId:', applicantId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving draft:', error);
    throw error;
  }
}

async function loadDraft(applicantId) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        applicantId,
      },
    });

    const response = await docClient.send(command);
    
    if (response.Item) {
      console.log('✅ Draft loaded successfully for applicantId:', applicantId);
      return { success: true, draft: response.Item };
    } else {
      console.log('ℹ️ No draft found for applicantId:', applicantId);
      return { success: true, draft: null };
    }
  } catch (error) {
    console.error('❌ Error loading draft:', error);
    throw error;
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
    return draft.draft !== null;
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

module.exports = {
  saveDraft,
  loadDraft,
  deleteDraft,
  draftExists,
  getDraftMetadata,
  compressData,
  cleanData,
}; 