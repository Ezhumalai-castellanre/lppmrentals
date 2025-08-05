const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// AWS Configuration from environment variables
const AWS_REGION = process.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID || 'AKIA35BCK6ZHZC4EWVHT';
const AWS_SECRET_ACCESS_KEY = process.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY || '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';
const TABLE_NAME = process.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved';

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
    
    const draftData = {
      applicantId,
      formData: cleanedFormData,
      currentStep,
      lastSaved: new Date().toISOString(),
      isComplete,
    };

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
}; 