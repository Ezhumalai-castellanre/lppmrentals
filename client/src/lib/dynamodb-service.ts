import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { fetchAuthSession } from 'aws-amplify/auth';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';

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
  private client: DynamoDBClient | null = null;
  private tableName: string;
  private region: string;

  constructor() {
    this.region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
    this.tableName = import.meta.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved';
    
    // Initialize client lazily when needed
    this.initializeClient();
  }

  // Initialize DynamoDB client with authenticated credentials
  private async initializeClient(): Promise<void> {
    try {
      const session = await fetchAuthSession();
      
      if (!session.tokens?.accessToken || !import.meta.env.VITE_AWS_IDENTITY_POOL_ID) {
        console.warn('⚠️ No valid authentication session or Identity Pool ID, DynamoDB operations will fail');
        return;
      }

      // Use Cognito Identity Pool to get temporary AWS credentials
      const credentials = await fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: this.region }),
        identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
        logins: {
          [`cognito-idp.${this.region}.amazonaws.com/${import.meta.env.VITE_AWS_USER_POOL_ID}`]: 
            session.tokens.idToken?.toString() || ''
        }
      });

      // Create client with temporary AWS credentials
      this.client = new DynamoDBClient({
        region: this.region,
        credentials: credentials,
      });

      console.log('✅ DynamoDB client initialized with temporary AWS credentials');
      
      // Check table status after client initialization
      this.checkTableStatus();
      
      // Test connection
      this.testConnection().then(success => {
        if (success) {
          console.log('✅ DynamoDB service initialized successfully');
        } else {
          console.warn('⚠️ DynamoDB service initialized with connection issues');
        }
      });
    } catch (error) {
      console.error('❌ Error initializing DynamoDB client:', error);
      this.client = null;
    }
  }

  // Get authenticated client, reinitialize if needed
  private async getClient(): Promise<DynamoDBClient> {
    if (!this.client) {
      await this.initializeClient();
    }
    
    if (!this.client) {
      throw new Error('Failed to initialize DynamoDB client - no valid authentication');
    }
    
    return this.client;
  }

  // Check DynamoDB table status
  private async checkTableStatus() {
    try {
      const { DescribeTableCommand, CreateTableCommand } = await import('@aws-sdk/client-dynamodb');
      const client = await this.getClient();
      
      try {
        await client.send(new DescribeTableCommand({
          TableName: this.tableName,
        }));
        console.log(`✅ DynamoDB table '${this.tableName}' exists and is accessible`);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log(`📋 DynamoDB table '${this.tableName}' does not exist, creating it...`);
          
          try {
            await client.send(new CreateTableCommand({
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
      const client = await this.getClient();
      
      console.log('💾 Saving draft to DynamoDB:', {
        table: this.tableName,
        application_id: draftData.applicantId,
        reference_id: draftData.reference_id,
        current_step: draftData.current_step
      });

      // Log raw data sizes to identify what's causing the size issue
      const rawSizes = {
        formData: JSON.stringify(draftData.form_data || {}).length,
        uploadedFiles: JSON.stringify(draftData.uploaded_files_metadata || {}).length,
        webhookResponses: JSON.stringify(draftData.webhook_responses || {}).length,
        signatures: JSON.stringify(draftData.signatures || {}).length,
        encryptedDocuments: JSON.stringify(draftData.encrypted_documents || {}).length
      };
      
      console.log('📊 Raw data sizes before cleaning:', {
        ...rawSizes,
        totalRawSize: Object.values(rawSizes).reduce((sum, size) => sum + size, 0)
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
      let cleanFormData = this.cleanDataForDynamoDB(draftData.form_data);
      let cleanUploadedFiles = this.cleanDataForDynamoDB(draftData.uploaded_files_metadata || {});
      let cleanWebhookResponses = this.cleanDataForDynamoDB(draftData.webhook_responses || {});
      let cleanSignatures = this.cleanDataForDynamoDB(draftData.signatures || {});
      let cleanEncryptedDocuments = this.cleanDataForDynamoDB(draftData.encrypted_documents || {});

      // Check sizes before saving to prevent DynamoDB size limit errors
      const sizes = {
        formData: JSON.stringify(cleanFormData).length,
        uploadedFiles: JSON.stringify(cleanUploadedFiles).length,
        webhookResponses: JSON.stringify(cleanWebhookResponses).length,
        signatures: JSON.stringify(cleanSignatures).length,
        encryptedDocuments: JSON.stringify(cleanEncryptedDocuments).length
      };
      
      const totalSize = Object.values(sizes).reduce((sum, size) => sum + size, 0);
      
      console.log('📏 Data sizes before saving:', {
        ...sizes,
        totalSize,
        maxAllowed: 400 * 1024, // 400KB in bytes
        isOverLimit: totalSize > 400 * 1024
      });
      
      // If data is too large, implement aggressive truncation
      if (totalSize > 400 * 1024) {
        console.warn('⚠️ Data exceeds 400KB limit, implementing aggressive truncation');
        
        // Truncate the largest fields first
        if (sizes.encryptedDocuments > 100 * 1024) {
          console.warn('⚠️ Truncating encrypted documents from', sizes.encryptedDocuments, 'to 100KB');
          cleanEncryptedDocuments = this.truncateLargeData(cleanEncryptedDocuments, 100 * 1024);
        }
        
        if (sizes.formData > 150 * 1024) {
          console.warn('⚠️ Truncating form data from', sizes.formData, 'to 150KB');
          cleanFormData = this.truncateLargeData(cleanFormData, 150 * 1024);
        }
        
        if (sizes.uploadedFiles > 50 * 1024) {
          console.warn('⚠️ Truncating uploaded files from', sizes.uploadedFiles, 'to 50KB');
          cleanUploadedFiles = this.truncateLargeData(cleanUploadedFiles, 50 * 1024);
        }
        
        if (sizes.webhookResponses > 50 * 1024) {
          console.warn('⚠️ Truncating webhook responses from', sizes.webhookResponses, 'to 50KB');
          cleanWebhookResponses = this.truncateLargeData(cleanWebhookResponses, 50 * 1024);
        }
        
        if (sizes.signatures > 50 * 1024) {
          console.warn('⚠️ Truncating signatures from', sizes.signatures, 'to 50KB');
          cleanSignatures = this.truncateLargeData(cleanSignatures, 50 * 1024);
        }
        
        // Recalculate sizes after truncation
        const newSizes = {
          formData: JSON.stringify(cleanFormData).length,
          uploadedFiles: JSON.stringify(cleanUploadedFiles).length,
          webhookResponses: JSON.stringify(cleanWebhookResponses).length,
          signatures: JSON.stringify(cleanSignatures).length,
          encryptedDocuments: JSON.stringify(cleanEncryptedDocuments).length
        };
        
        const newTotalSize = Object.values(newSizes).reduce((sum, size) => sum + size, 0);
        
        console.log('📏 Data sizes after truncation:', {
          ...newSizes,
          newTotalSize,
          reduction: totalSize - newTotalSize
        });
      }

      // Final size check before saving
      const finalSizes = {
        formData: JSON.stringify(cleanFormData).length,
        uploadedFiles: JSON.stringify(cleanUploadedFiles).length,
        webhookResponses: JSON.stringify(cleanWebhookResponses).length,
        signatures: JSON.stringify(cleanSignatures).length,
        encryptedDocuments: JSON.stringify(cleanEncryptedDocuments).length
      };
      
      const finalTotalSize = Object.values(finalSizes).reduce((sum, size) => sum + size, 0);
      
      if (finalTotalSize > 400 * 1024) {
        console.error('❌ Data still too large after truncation:', {
          finalTotalSize,
          maxAllowed: 400 * 1024,
          sizes: finalSizes
        });
        
        // Analyze the data structure to identify large fields
        console.log('🔍 Analyzing data structure to identify large fields...');
        const formDataAnalysis = this.analyzeDataStructure(cleanFormData, 'form_data');
        const encryptedDocsAnalysis = this.analyzeDataStructure(cleanEncryptedDocuments, 'encrypted_documents');
        
        // Sort by size to show largest fields first
        const allAnalysis = [...formDataAnalysis, ...encryptedDocsAnalysis]
          .sort((a, b) => b.size - a.size)
          .slice(0, 20); // Show top 20 largest fields
        
        console.log('🔍 Top 20 largest fields:', allAnalysis);
        
        // Try to save only essential data
        console.warn('⚠️ Attempting to save only essential data...');
        const essentialData = {
          applicantId: draftData.applicantId,
          reference_id: draftData.reference_id,
          current_step: draftData.current_step || 0,
          last_updated: draftData.last_updated || new Date().toISOString(),
          status: draftData.status || 'draft',
          form_data: { _truncated: true, _message: 'Data too large, only essential fields saved' }
        };
        
        const essentialCommand = new PutItemCommand({
          TableName: this.tableName,
          Item: {
            applicantId: { S: essentialData.applicantId },
            reference_id: { S: essentialData.reference_id },
            current_step: { N: essentialData.current_step.toString() },
            last_updated: { S: essentialData.last_updated },
            status: { S: essentialData.status },
            form_data: { S: JSON.stringify(essentialData.form_data) },
          },
        });
        
        await client.send(essentialCommand);
        console.log('✅ Essential data saved successfully (full data was too large)');
        return true;
      }

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

      await client.send(command);
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

  // Analyze data structure to identify large fields
  private analyzeDataStructure(data: any, path: string = ''): { path: string; size: number; type: string }[] {
    const results: { path: string; size: number; type: string }[] = [];
    
    try {
      if (data === null || data === undefined) {
        return results;
      }
      
      if (typeof data === 'string') {
        results.push({ path, size: data.length, type: 'string' });
        return results;
      }
      
      if (typeof data === 'number' || typeof data === 'boolean') {
        results.push({ path, size: 8, type: typeof data });
        return results;
      }
      
      if (Array.isArray(data)) {
        results.push({ path, size: data.length, type: 'array' });
        data.forEach((item, index) => {
          results.push(...this.analyzeDataStructure(item, `${path}[${index}]`));
        });
        return results;
      }
      
      if (typeof data === 'object') {
        const keys = Object.keys(data);
        results.push({ path, size: keys.length, type: 'object' });
        
        for (const [key, value] of Object.entries(data)) {
          results.push(...this.analyzeDataStructure(value, path ? `${path}.${key}` : key));
        }
        return results;
      }
      
      return results;
    } catch (error) {
      console.warn('⚠️ Error analyzing data structure:', error);
      return results;
    }
  }

  // Truncate large data to fit within DynamoDB size limits
  private truncateLargeData(data: any, maxSizeBytes: number): any {
    try {
      const jsonString = JSON.stringify(data);
      if (jsonString.length <= maxSizeBytes) {
        return data;
      }
      
      console.warn('⚠️ Truncating data from', jsonString.length, 'to', maxSizeBytes, 'bytes');
      
      // If it's an object, try to keep only essential fields
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const essentialFields = ['id', 'name', 'type', 'status', 'created', 'updated'];
        const truncated: any = {};
        
        for (const field of essentialFields) {
          if (data[field] !== undefined) {
            truncated[field] = data[field];
          }
        }
        
        // Add a note that data was truncated
        truncated._truncated = true;
        truncated._originalSize = jsonString.length;
        truncated._truncatedAt = new Date().toISOString();
        
        return truncated;
      }
      
      // If it's an array, keep only first few items
      if (Array.isArray(data)) {
        const truncated = data.slice(0, 10); // Keep only first 10 items
        truncated.push({
          _truncated: true,
          _originalSize: jsonString.length,
          _truncatedAt: new Date().toISOString(),
          _originalItemCount: data.length
        });
        return truncated;
      }
      
      // For other types, return a minimal representation
      return {
        _truncated: true,
        _originalSize: jsonString.length,
        _truncatedAt: new Date().toISOString(),
        _originalType: typeof data,
        _value: String(data).substring(0, 100) + '...'
      };
    } catch (error) {
      console.warn('⚠️ Error truncating data:', error);
      return { _truncated: true, _error: 'Failed to truncate data' };
    }
  }

  // Get the correct key structure - table has applicantId as partition key
  private getKeyStructure(applicationId: string): any {
    return { applicantId: { S: applicationId } };
  }

  // Retrieve draft data
  async getDraft(applicationId: string, referenceId: string): Promise<DraftData | null> {
    try {
      const client = await this.getClient();
      
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

      const response = await client.send(command);
      
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
      const client = await this.getClient();
      
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

      await client.send(command);
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
      const client = await this.getClient();
      
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

      await client.send(command);
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
      const client = await this.getClient();
      
      // Try to describe the table
      const { DescribeTableCommand } = await import('@aws-sdk/client-dynamodb');
      const describeResult = await client.send(new DescribeTableCommand({
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
