import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface DraftData {
  applicantId: string; // Changed from application_id to match table schema
  reference_id: string;
  form_data: any;
  current_step: number;
  last_updated: string;
  status: 'draft' | 'submitted';
  uploaded_files_metadata?: any;
  webhook_responses?: any;
  signatures?: any;
  encrypted_documents?: any;
}

export class DynamoDBService {
  private client: DynamoDBClient;
  private tableName: string;

  constructor() {
    this.client = new DynamoDBClient({
      region: import.meta.env.VITE_AWS_DYNAMODB_REGION || 'us-east-1',
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_DYNAMODB_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY || '',
      },
    });
    this.tableName = import.meta.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved';
  }

  // Save draft data
  async saveDraft(draftData: DraftData): Promise<boolean> {
    try {
      console.log('💾 Saving draft to DynamoDB:', {
        table: this.tableName,
        applicantId: draftData.applicantId,
        reference_id: draftData.reference_id,
        current_step: draftData.current_step
      });

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall({
          applicantId: draftData.applicantId, // Changed from application_id to applicantId
          reference_id: draftData.reference_id,
          form_data: draftData.form_data,
          current_step: draftData.current_step,
          last_updated: draftData.last_updated,
          status: draftData.status,
          uploaded_files_metadata: draftData.uploaded_files_metadata || {},
          webhook_responses: draftData.webhook_responses || {},
          signatures: draftData.signatures || {},
          encrypted_documents: draftData.encrypted_documents || {},
        }),
      });

      await this.client.send(command);
      console.log('✅ Draft saved successfully to DynamoDB');
      return true;
    } catch (error) {
      console.error('❌ Error saving draft to DynamoDB:', error);
      return false;
    }
  }

  // Retrieve draft data
  async getDraft(applicationId: string, referenceId: string): Promise<DraftData | null> {
    try {
      console.log('📥 Retrieving draft from DynamoDB:', {
        table: this.tableName,
        applicantId: applicationId,
        reference_id: referenceId
      });

      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({
          applicantId: applicationId, // Changed from application_id to applicantId
          reference_id: referenceId,
        }),
      });

      const response = await this.client.send(command);
      
      if (response.Item) {
        const draftData = unmarshall(response.Item) as DraftData;
        console.log('✅ Draft retrieved successfully from DynamoDB');
        return draftData;
      } else {
        console.log('📭 No draft found for the given application ID and reference ID');
        return null;
      }
    } catch (error) {
      console.error('❌ Error retrieving draft from DynamoDB:', error);
      return null;
    }
  }

  // Update draft status to submitted
  async markAsSubmitted(applicationId: string, referenceId: string): Promise<boolean> {
    try {
      console.log('📝 Marking draft as submitted in DynamoDB:', {
        table: this.tableName,
        applicantId: applicationId,
        reference_id: referenceId
      });

      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({
          applicantId: applicationId, // Changed from application_id to applicantId
          reference_id: referenceId,
        }),
        UpdateExpression: 'SET #status = :status, last_updated = :last_updated',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: marshall({
          ':status': 'submitted',
          ':last_updated': new Date().toISOString(),
        }),
      });

      await this.client.send(command);
      console.log('✅ Draft marked as submitted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error marking draft as submitted:', error);
      return false;
    }
  }

  // Delete draft data
  async deleteDraft(applicationId: string, referenceId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting draft from DynamoDB:', {
        table: this.tableName,
        applicantId: applicationId,
        reference_id: referenceId
      });

      const command = new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({
          applicantId: applicationId,
          reference_id: referenceId,
        }),
      });

      await this.client.send(command);
      console.log('✅ Draft deleted successfully from DynamoDB');
      return true;
    } catch (error) {
      console.error('❌ Error deleting draft from DynamoDB:', error);
      return false;
    }
  }

  // Get all drafts for an application ID
  async getAllDrafts(applicationId: string): Promise<DraftData[]> {
    try {
      console.log('📋 Getting all drafts for application ID:', applicationId);

      // Note: This would require a GSI or scan operation
      // For now, we'll implement a basic scan (not recommended for production)
      // In production, you should create a GSI on application_id
      
      // This is a simplified implementation - in production you'd want to use a GSI
      console.log('⚠️ getAllDrafts requires a GSI for production use');
      return [];
    } catch (error) {
      console.error('❌ Error getting all drafts:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dynamoDBService = new DynamoDBService();
