import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// AWS Configuration from environment variables
const AWS_REGION = import.meta.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = import.meta.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID || 'AKIA35BCK6ZHZC4EWVHT';
const AWS_SECRET_ACCESS_KEY = import.meta.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY || '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';
const TABLE_NAME = import.meta.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved';

// Log configuration for debugging (remove in production)
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

export interface DraftData {
  applicantId: string;
  formData: any;
  currentStep: number;
  lastSaved: string;
  isComplete: boolean;
}

export class DynamoDBService {
  /**
   * Clean data by removing undefined values recursively
   */
  private static cleanData(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.cleanData(item)).filter(item => item !== null);
    }
    
    if (typeof data === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(data)) {
        const cleanedValue = this.cleanData(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : null;
    }
    
    return data;
  }

  /**
   * Validate draft data before saving
   */
  private static validateDraftData(draftData: DraftData): boolean {
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

  /**
   * Save draft data to DynamoDB
   */
  static async saveDraft(applicantId: string, formData: any, currentStep: number, isComplete: boolean = false): Promise<void> {
    try {
      console.log('🔄 Saving draft for applicantId:', applicantId);
      console.log('📊 Original form data size:', JSON.stringify(formData).length, 'characters');
      
      // Clean the form data to remove undefined values
      const cleanedFormData = this.cleanData(formData);
      
      console.log('🧹 Cleaned form data size:', JSON.stringify(cleanedFormData).length, 'characters');
      
      const draftData: DraftData = {
        applicantId,
        formData: cleanedFormData,
        currentStep,
        lastSaved: new Date().toISOString(),
        isComplete,
      };

      // Validate the draft data before saving
      if (!this.validateDraftData(draftData)) {
        throw new Error('Invalid draft data');
      }

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: draftData,
      });

      await docClient.send(command);
      console.log('✅ Draft saved successfully for applicantId:', applicantId);
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      
      // Log additional error details for debugging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      throw new Error(`Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load draft data from DynamoDB
   */
  static async loadDraft(applicantId: string): Promise<DraftData | null> {
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
        return response.Item as DraftData;
      } else {
        console.log('ℹ️ No draft found for applicantId:', applicantId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading draft:', error);
      throw new Error(`Failed to load draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update draft data (partial update)
   */
  static async updateDraft(applicantId: string, updates: Partial<DraftData>): Promise<void> {
    try {
      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Build update expression dynamically
      Object.keys(updates).forEach((key, index) => {
        if (key !== 'applicantId') { // Don't update the partition key
          const attrName = `#attr${index}`;
          const attrValue = `:val${index}`;
          
          // Clean the value before adding to expression
          const cleanedValue = this.cleanData((updates as any)[key]);
          if (cleanedValue !== null && cleanedValue !== undefined) {
            updateExpression.push(`${attrName} = ${attrValue}`);
            expressionAttributeNames[attrName] = key;
            expressionAttributeValues[attrValue] = cleanedValue;
          }
        }
      });

      // Always update lastSaved
      const lastSavedAttr = `#lastSaved`;
      const lastSavedVal = `:lastSaved`;
      updateExpression.push(`${lastSavedAttr} = ${lastSavedVal}`);
      expressionAttributeNames[lastSavedAttr] = 'lastSaved';
      expressionAttributeValues[lastSavedVal] = new Date().toISOString();

      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { applicantId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      });

      await docClient.send(command);
      console.log('✅ Draft updated successfully for applicantId:', applicantId);
    } catch (error) {
      console.error('❌ Error updating draft:', error);
      throw new Error(`Failed to update draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete draft data
   */
  static async deleteDraft(applicantId: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { applicantId },
      });

      await docClient.send(command);
      console.log('✅ Draft deleted successfully for applicantId:', applicantId);
    } catch (error) {
      console.error('❌ Error deleting draft:', error);
      throw new Error(`Failed to delete draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if draft exists
   */
  static async draftExists(applicantId: string): Promise<boolean> {
    try {
      const draft = await this.loadDraft(applicantId);
      return draft !== null;
    } catch (error) {
      console.error('❌ Error checking draft existence:', error);
      return false;
    }
  }

  /**
   * Get draft metadata (without full form data)
   */
  static async getDraftMetadata(applicantId: string): Promise<{ currentStep: number; lastSaved: string; isComplete: boolean } | null> {
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
}

export default DynamoDBService; 