import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface DraftData {
  applicantId: string; // Use applicantId to match DynamoDB table schema
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
    
    // Check table existence and log status
    this.checkTableStatus();
    
    // Test connection and get actual table schema
    this.testConnection().then(success => {
      if (success) {
        console.log('✅ DynamoDB service initialized successfully');
      } else {
        console.warn('⚠️ DynamoDB service initialized with connection issues');
      }
    });
  }

  // Check DynamoDB table status
  private async checkTableStatus() {
    try {
      const { DescribeTableCommand, CreateTableCommand } = await import('@aws-sdk/client-dynamodb');
      
      try {
        await this.client.send(new DescribeTableCommand({
          TableName: this.tableName,
        }));
        console.log(`✅ DynamoDB table '${this.tableName}' exists and is accessible`);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log(`📋 DynamoDB table '${this.tableName}' does not exist, creating it...`);
          
          try {
            await this.client.send(new CreateTableCommand({
              TableName: this.tableName,
              AttributeDefinitions: [
                {
                  AttributeName: 'applicantId',
                  AttributeType: 'S'
                }
              ],
              KeySchema: [
                {
                  AttributeName: 'applicantId',
                  KeyType: 'HASH' // Partition key
                }
              ],
              BillingMode: 'PAY_PER_REQUEST'
            }));
            
            console.log(`✅ DynamoDB table '${this.tableName}' created successfully`);
          } catch (createError: any) {
            console.error(`❌ Failed to create DynamoDB table '${this.tableName}':`, createError);
            console.error(`📋 Please create the table manually with the following schema:`);
            console.error(`   - Partition Key: applicantId (String)`);
            console.error(`   - Billing Mode: PAY_PER_REQUEST`);
          }
        } else if (error.name === 'AccessDeniedException') {
          console.error(`❌ Access denied to DynamoDB table '${this.tableName}'`);
          console.error(`🔑 Check your AWS credentials and permissions`);
        } else {
          console.error(`❌ Error checking DynamoDB table '${this.tableName}':`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Error importing DynamoDB commands:`, error);
    }
  }

  // Save draft data
  async saveDraft(draftData: DraftData): Promise<boolean> {
    try {
      console.log('💾 Saving draft to DynamoDB:', {
        table: this.tableName,
        application_id: draftData.applicantId,
        reference_id: draftData.reference_id,
        current_step: draftData.current_step
      });

      // Validate required fields
      if (!draftData.applicantId) {
        console.error('❌ Missing required field: applicantId');
        return false;
      }

      if (!draftData.reference_id) {
        console.error('❌ Missing required field: reference_id');
        return false;
      }

      // Clean and validate the data before saving
      const cleanFormData = this.cleanDataForDynamoDB(draftData.form_data);
      const cleanUploadedFiles = this.cleanDataForDynamoDB(draftData.uploaded_files_metadata || {});
      const cleanWebhookResponses = this.cleanDataForDynamoDB(draftData.webhook_responses || {});
      const cleanSignatures = this.cleanDataForDynamoDB(draftData.signatures || {});
      const cleanEncryptedDocuments = this.cleanDataForDynamoDB(draftData.encrypted_documents || {});

      console.log('🧹 Cleaned data for DynamoDB:', {
        formDataKeys: Object.keys(cleanFormData),
        uploadedFilesKeys: Object.keys(cleanUploadedFiles),
        webhookResponsesKeys: Object.keys(cleanWebhookResponses),
        signaturesKeys: Object.keys(cleanSignatures),
        encryptedDocumentsKeys: Object.keys(cleanEncryptedDocuments)
      });

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: {
          applicantId: { S: draftData.applicantId },
          reference_id: { S: draftData.reference_id },
          form_data: { S: JSON.stringify(cleanFormData) },
          current_step: { N: (draftData.current_step || 0).toString() },
          last_updated: { S: draftData.last_updated || new Date().toISOString() },
          status: { S: draftData.status || 'draft' },
          uploaded_files_metadata: { S: JSON.stringify(cleanUploadedFiles) },
          webhook_responses: { S: JSON.stringify(cleanWebhookResponses) },
          signatures: { S: JSON.stringify(cleanSignatures) },
          encrypted_documents: { S: JSON.stringify(cleanEncryptedDocuments) },
        },
      });

      await this.client.send(command);
      console.log('✅ Draft saved successfully to DynamoDB');
      return true;
    } catch (error) {
      console.error('❌ Error saving draft to DynamoDB:', error);
      return false;
    }
  }

  // Clean data to ensure it's safe for DynamoDB
  private cleanDataForDynamoDB(data: any): any {
    try {
      if (data === null || data === undefined) {
        return {};
      }
      
      if (typeof data === 'string') {
        return data;
      }
      
      if (typeof data === 'number' || typeof data === 'boolean') {
        return data;
      }
      
      if (Array.isArray(data)) {
        return data
          .map(item => this.cleanDataForDynamoDB(item))
          .filter(item => item !== undefined && item !== null);
      }
      
      if (typeof data === 'object') {
        // Handle special cases like Date objects
        if (data instanceof Date) {
          return data.toISOString();
        }
        
        // Handle File objects (which can't be serialized)
        if (data instanceof File) {
          return { name: data.name, size: data.size, type: data.type };
        }
        
        if (data instanceof Blob) {
          return { size: data.size, type: data.type };
        }
        
        // Handle regular objects
        const cleaned: any = {};
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined && value !== null) {
            try {
              cleaned[key] = this.cleanDataForDynamoDB(value);
            } catch (error) {
              console.warn(`⚠️ Could not clean field ${key}:`, error);
              cleaned[key] = String(value);
            }
          }
        }
        return cleaned;
      }
      
      return String(data);
    } catch (error) {
      console.warn('⚠️ Error cleaning data for DynamoDB:', error);
      return {};
    }
  }

  // Get the correct key structure - table has applicantId as partition key
  private getKeyStructure(applicationId: string): any {
    return { applicantId: { S: applicationId } };
  }

  // Retrieve draft data
  async getDraft(applicationId: string, referenceId: string): Promise<DraftData | null> {
    try {
      console.log('📥 Retrieving draft from DynamoDB:', {
        table: this.tableName,
        application_id: applicationId,
        reference_id: referenceId
      });

      // Get the correct key structure - only use application_id since table has no sort key
      const key = this.getKeyStructure(applicationId);

      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (response.Item) {
        const draftData = unmarshall(response.Item) as DraftData;
        console.log('✅ Draft retrieved successfully from DynamoDB');
        return draftData;
      } else {
        console.log('📭 No draft found for the given application ID');
        return null;
      }
    } catch (error: any) {
      console.error('❌ Error retrieving draft from DynamoDB:', error);
      
      // Provide more specific error information
      if (error.name === 'ValidationException') {
        console.error('🔧 Validation error - check if the key structure matches the table schema');
        console.error('🔧 Expected key structure:', {
          applicantId: { S: 'string' }
        });
        
        // Try to get the actual table schema
        console.log('🔧 Attempting to inspect table schema...');
        try {
          await this.testConnection();
        } catch (schemaError) {
          console.error('🔧 Could not inspect table schema:', schemaError);
        }
      } else if (error.name === 'ResourceNotFoundException') {
        console.error(`🔧 Table '${this.tableName}' not found`);
      } else if (error.name === 'AccessDeniedException') {
        console.error('🔧 Access denied - check AWS credentials and permissions');
      }
      
      return null;
    }
  }

  // Update draft status to submitted
  async markAsSubmitted(applicationId: string, referenceId: string): Promise<boolean> {
    try {
      console.log('📝 Marking draft as submitted in DynamoDB:', {
        table: this.tableName,
        application_id: applicationId,
        reference_id: referenceId
      });

      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: {
          applicantId: { S: applicationId }
        },
        UpdateExpression: 'SET #status = :status, last_updated = :last_updated',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'submitted' },
          ':last_updated': { S: new Date().toISOString() },
        },
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
        application_id: applicationId,
        reference_id: referenceId
      });

      const command = new DeleteItemCommand({
        TableName: this.tableName,
        Key: {
          applicantId: { S: applicationId }
        },
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

  // Test DynamoDB connection and table access
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing DynamoDB connection...');
      
      // Try to describe the table
      const { DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
      const describeResult = await this.client.send(new DescribeTableCommand({
        TableName: this.tableName,
      }));
      
      console.log('✅ DynamoDB connection test successful');
      
      // Log the actual table schema
      const keySchema = describeResult.Table?.KeySchema || [];
      console.log('📋 Actual table key schema:', keySchema.map(k => ({
        name: k.AttributeName,
        type: k.KeyType
      })));
      
      // Check if our key structure matches
      const hasPartitionKey = keySchema.some(k => k.KeyType === 'HASH');
      const hasSortKey = keySchema.some(k => k.KeyType === 'RANGE');
      
      if (hasPartitionKey && hasSortKey) {
        console.log('✅ Table has partition key + sort key (composite key)');
      } else if (hasPartitionKey) {
        console.log('✅ Table has only partition key (simple key)');
      } else {
        console.log('❌ Table has no valid key schema');
      }
      
      return true;
    } catch (error: any) {
      console.error('❌ DynamoDB connection test failed:', error);
      
      if (error.name === 'ResourceNotFoundException') {
        console.error(`📋 Table '${this.tableName}' does not exist`);
      } else if (error.name === 'AccessDeniedException') {
        console.error('🔑 Access denied - check AWS credentials and permissions');
      } else if (error.name === 'UnrecognizedClientException') {
        console.error('🔧 Invalid AWS configuration - check region and credentials');
      }
      
      return false;
    }
  }
}

// Export singleton instance
export const dynamoDBService = new DynamoDBService();
