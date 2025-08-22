import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { fetchAuthSession } from 'aws-amplify/auth';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { environment } from '@/config/environment';

export interface DraftData {
  zoneinfo: string; // Source of truth - user's zoneinfo value
  applicantId: string; // Generated from zoneinfo for DynamoDB partition key
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

// Interface for form data that uses application_id
export interface FormDataWithApplicationId {
  zoneinfo: string; // Source of truth - user's zoneinfo value
  application_id: string; // Form data uses application_id (should match zoneinfo)
  applicantId: string; // Generated from zoneinfo for DynamoDB partition key
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
    this.region = environment.aws.region;
    this.tableName = environment.dynamodb.tableName;
    
    console.log('🔧 DynamoDB Service initialized with:', {
      region: this.region,
      tableName: this.tableName,
      identityPoolId: environment.aws.identityPoolId ? '***configured***' : 'missing'
    });
    
    // Initialize client lazily when needed
    this.initializeClientWithRetry();
  }

  // Initialize DynamoDB client with authenticated credentials
  private async initializeClient(): Promise<void> {
    try {
      console.log('🔐 Initializing DynamoDB client...');
      const session = await fetchAuthSession();
      
      // Require ID token (used for Cognito Identity Pool logins mapping)
      if (!session.tokens?.idToken) {
        console.warn('⚠️ No ID token available yet. User may not be signed in. Skipping DynamoDB client initialization for now.');
        return;
      }
      
      if (!environment.aws.identityPoolId) {
        console.error('❌ Missing VITE_AWS_IDENTITY_POOL_ID environment variable. Configure a valid Cognito Identity Pool ID.');
        return;
      }

      console.log('🔑 Using Cognito Identity Pool for AWS credentials...');
      
      // Use Cognito Identity Pool to get temporary AWS credentials
      const credentials = await fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: this.region }),
        identityPoolId: environment.aws.identityPoolId,
        logins: {
          [`cognito-idp.${this.region}.amazonaws.com/${environment.aws.userPoolId}`]: 
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
        }
      });
    } catch (error) {
      console.error('❌ Error initializing DynamoDB client:', error);
      this.client = null;
    }
  }

  // Check if user needs to re-authenticate
  private async checkAuthenticationStatus(): Promise<boolean> {
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      
      if (!session.tokens?.idToken) {
        console.warn('⚠️ No ID token available');
        return false;
      }
      
      // Check if token is expired (with some buffer time)
      const tokenExp = session.tokens.idToken.payload?.exp;
      if (tokenExp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const bufferTime = 300; // 5 minutes buffer
        
        if (currentTime >= (tokenExp - bufferTime)) {
          console.warn('⚠️ Token is expired or will expire soon');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking authentication status:', error);
      return false;
    }
  }

  // Handle token expiration and credential refresh
  private async handleTokenExpiration(): Promise<void> {
    try {
      console.log('🔄 Handling token expiration, refreshing credentials...');
      
      // Clear the current client to force re-initialization
      this.client = null;
      
      // Wait a moment for any ongoing operations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Re-initialize the client with fresh credentials
      await this.initializeClientWithRetry();
      
      console.log('✅ Credentials refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh credentials:', error);
      throw error;
    }
  }

  // Enhanced client initialization with token refresh and retry logic
  private async initializeClientWithRetry(): Promise<void> {
    try {
      console.log('🔐 Initializing DynamoDB client with retry logic...');
      
      // Try to refresh the auth session first
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession();
        
        if (!session.tokens?.idToken) {
          console.warn('⚠️ No ID token available, attempting to refresh...');
          // Force a session refresh
          await new Promise(resolve => setTimeout(resolve, 1000));
          const refreshedSession = await fetchAuthSession();
          
          if (!refreshedSession.tokens?.idToken) {
            console.error('❌ Still no ID token after refresh attempt');
            throw new Error('No valid ID token available');
          }
        }
      } catch (refreshError) {
        console.warn('⚠️ Session refresh failed, proceeding with current session:', refreshError);
      }
      
      await this.initializeClient();
    } catch (error) {
      console.error('❌ Error in initializeClientWithRetry:', error);
      this.client = null;
    }
  }

  // Get authenticated client, reinitialize if needed
  private async getClient(): Promise<DynamoDBClient> {
    if (!this.client) {
      await this.initializeClientWithRetry();
    }

    // Brief retries in case tokens are not yet available immediately after sign-in
    let attempts = 0;
    while (!this.client && attempts < 2) {
      attempts += 1;
      await new Promise(resolve => setTimeout(resolve, 400));
      await this.initializeClientWithRetry();
    }

    if (!this.client) {
      throw new Error('Failed to initialize DynamoDB client - no valid authentication');
    }

    return this.client;
  }

  // Get the current user's zoneinfo attribute (source of truth)
  async getCurrentUserZoneinfo(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) {
        console.error('❌ No valid authentication session to get zoneinfo');
        return null;
      }

      // Get user attributes to check zoneinfo
      const { fetchUserAttributes } = await import('aws-amplify/auth');
      const userAttributes = await fetchUserAttributes();
      
      const zoneinfoValue = userAttributes.zoneinfo || userAttributes['custom:zoneinfo'];
      
      if (!zoneinfoValue) {
        console.error('❌ User has no zoneinfo attribute - cannot determine zoneinfo');
        return null;
      }
      
      console.log(`✅ Retrieved zoneinfo from user attributes: ${zoneinfoValue}`);
      return zoneinfoValue;
    } catch (error) {
      console.error('❌ Error getting current user zoneinfo:', error);
      return null;
    }
  }

  // Generate applicantId from zoneinfo (for DynamoDB partition key)
  generateApplicantIdFromZoneinfo(zoneinfo: string): string {
    return zoneinfo; // For now, they're the same, but this allows for future transformation logic
  }

  // Ensure draft data uses current user's zoneinfo (useful for form components)
  async ensureDraftDataUsesCurrentZoneinfo(draftData: DraftData): Promise<DraftData> {
    try {
      const currentUserZoneinfo = await this.getCurrentUserZoneinfo();
      if (!currentUserZoneinfo) {
        console.warn('⚠️ Cannot ensure zoneinfo consistency - no current user zoneinfo available');
        return draftData;
      }

      console.log(`🔄 Ensuring draft data uses current user's zoneinfo: ${currentUserZoneinfo}`);
      
      // Update the draft data zoneinfo and applicantId
      if (draftData.zoneinfo !== currentUserZoneinfo) {
        console.log(`🔄 Updating draft zoneinfo from '${draftData.zoneinfo}' to '${currentUserZoneinfo}'`);
        draftData.zoneinfo = currentUserZoneinfo;
      }
      
      const generatedApplicantId = this.generateApplicantIdFromZoneinfo(currentUserZoneinfo);
      if (draftData.applicantId !== generatedApplicantId) {
        console.log(`🔄 Updating draft applicantId from '${draftData.applicantId}' to '${generatedApplicantId}'`);
        draftData.applicantId = generatedApplicantId;
      }
      
      // Clean the form data if it exists (ensures all nested fields are consistent)
      if (draftData.form_data && typeof draftData.form_data === 'object') {
        console.log('🧹 Cleaning form data to ensure zoneinfo consistency');
        draftData.form_data = this.cleanFormDataForConsistency(draftData.form_data);
        
        // Ensure the cleaned form data also uses current zoneinfo
        if (draftData.form_data.application_id !== currentUserZoneinfo) {
          console.log(`🔄 Updating form_data.application_id to current zoneinfo '${currentUserZoneinfo}'`);
          draftData.form_data.application_id = currentUserZoneinfo;
        }
        
        if (draftData.form_data.applicantId !== generatedApplicantId) {
          console.log(`🔄 Updating form_data.applicantId to generated applicantId '${generatedApplicantId}'`);
          draftData.form_data.applicantId = generatedApplicantId;
        }
        
        if (draftData.form_data.zoneinfo !== currentUserZoneinfo) {
          console.log(`🔄 Updating form_data.zoneinfo to current zoneinfo '${currentUserZoneinfo}'`);
          draftData.form_data.zoneinfo = currentUserZoneinfo;
        }
      }
      
      // 4. Log the final state for verification
      console.log('✅ Draft data now uses current user\'s zoneinfo. Final state:', {
        zoneinfo: draftData.zoneinfo,
        applicantId: draftData.applicantId,
        form_data_zoneinfo: draftData.form_data?.zoneinfo,
        form_data_application_id: draftData.form_data?.application_id,
        form_data_applicantId: draftData.form_data?.applicantId
      });
      
      return draftData;
    } catch (error) {
      console.error('❌ Error ensuring draft data uses current zoneinfo:', error);
      return draftData;
    }
  }

  // Map application_id from form data to applicantId for DynamoDB
  private mapApplicationIdToApplicantId(formData: any): string | null {
    // Check if form data has application_id (prioritize this as it's the current form field)
    if (formData.application_id) {
      console.log(`🔄 Mapping application_id '${formData.application_id}' to applicantId for DynamoDB`);
      return formData.application_id;
    }
    
    // Check if form data has applicantId (fallback for legacy data)
    if (formData.applicantId) {
      console.log(`🔄 Using existing applicantId '${formData.applicantId}' from form data (legacy field)`);
      return formData.applicantId;
    }
    
    console.error('❌ No application_id or applicantId found in form data');
    return null;
  }

  // Clean form data to ensure application_id and applicantId are consistent
  private cleanFormDataForConsistency(formData: any): any {
    try {
      console.log('🧹 Starting comprehensive form data cleaning for zoneinfo consistency...');
      
      // For now, we'll use the formData.zoneinfo if available, or clean based on application_id
      // The actual zoneinfo mapping will happen in the calling methods
      
      // 1. Handle application_id field (form data)
      if (formData.application_id) {
        // If we have application_id, ensure applicantId matches it
        if (formData.applicantId !== formData.application_id) {
          console.log(`🔄 Updating applicantId from '${formData.applicantId}' to match application_id '${formData.application_id}'`);
          formData.applicantId = formData.application_id;
        }
        
        // Ensure zoneinfo is set to application_id if not present
        if (!formData.zoneinfo) {
          formData.zoneinfo = formData.application_id;
          console.log(`✅ Set zoneinfo to application_id '${formData.application_id}'`);
        }
        
        console.log(`✅ Form data cleaned: applicantId and zoneinfo set to '${formData.application_id}'`);
      }
      
      // 2. Handle applicantId field (DynamoDB partition key)
      if (formData.applicantId && !formData.application_id) {
        // If we only have applicantId, set application_id to match
        formData.application_id = formData.applicantId;
        console.log(`✅ Set application_id to match applicantId '${formData.applicantId}'`);
      }
      
      // 3. Clean nested form_data if it exists
      if (formData.form_data && typeof formData.form_data === 'object') {
        console.log('🧹 Cleaning nested form_data for consistency...');
        formData.form_data = this.cleanFormDataForConsistency(formData.form_data);
      }
      
      // 4. Log the final cleaned state
      console.log('✅ Form data cleaning completed. Final state:', {
        zoneinfo: formData.zoneinfo,
        application_id: formData.application_id,
        applicantId: formData.applicantId
      });
      
      return formData;
    } catch (error) {
      console.warn('⚠️ Error cleaning form data for consistency:', error);
      return formData;
    }
  }

  // Validate that the provided application_id/applicantId matches the authenticated user's zoneinfo
  private async validateApplicationId(applicationId: string): Promise<boolean> {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) {
        console.error('❌ No valid authentication session to validate application_id');
        return false;
      }

      // Get user attributes to check zoneinfo
      const { fetchUserAttributes } = await import('aws-amplify/auth');
      const userAttributes = await fetchUserAttributes();
      
      const zoneinfoValue = userAttributes.zoneinfo || userAttributes['custom:zoneinfo'];
      
      if (!zoneinfoValue) {
        console.error('❌ User has no zoneinfo attribute - cannot validate application_id');
        return false;
      }
      
      if (applicationId !== zoneinfoValue) {
        console.error(`❌ Application ID mismatch: provided '${applicationId}' does not match user's zoneinfo '${zoneinfoValue}'`);
        return false;
      }
      
      console.log(`✅ Application ID validation successful: '${applicationId}' matches user's zoneinfo`);
      return true;
    } catch (error) {
      console.error('❌ Error validating application_id:', error);
      return false;
    }
  }

  // Check DynamoDB table status and ensure proper schema
  private async checkTableStatus() {
    try {
      const { DescribeTableCommand, CreateTableCommand } = await import('@aws-sdk/client-dynamodb');
      const client = await this.getClient();
      
      try {
        const describeResult = await client.send(new DescribeTableCommand({
          TableName: this.tableName,
        }));
        
        console.log(`✅ DynamoDB table '${this.tableName}' exists and is accessible`);
        
        // Verify the table has the correct schema
        const keySchema = describeResult.Table?.KeySchema || [];
        const hasApplicantIdPartitionKey = keySchema.some(k => 
          k.AttributeName === 'applicantId' && k.KeyType === 'HASH'
        );
        
        if (!hasApplicantIdPartitionKey) {
          console.error(`❌ Table '${this.tableName}' does not have 'applicantId' as partition key`);
          console.error(`📋 Current key schema:`, keySchema);
          console.error(`📋 Expected: applicantId as HASH (partition key)`);
        } else {
          console.log(`✅ Table '${this.tableName}' has correct schema with 'applicantId' as partition key`);
        }
        
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
            
            console.log(`✅ DynamoDB table '${this.tableName}' created successfully with 'applicantId' as partition key`);
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

  // Validate that applicantId matches the authenticated user's zoneinfo
  private async validateApplicantId(applicantId: string): Promise<boolean> {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) {
        console.error('❌ No valid authentication session to validate applicantId');
        return false;
      }

      // Get user attributes to check zoneinfo
      const { fetchUserAttributes } = await import('aws-amplify/auth');
      const userAttributes = await fetchUserAttributes();
      
      const zoneinfoValue = userAttributes.zoneinfo || userAttributes['custom:zoneinfo'];
      
      if (!zoneinfoValue) {
        console.error('❌ User has no zoneinfo attribute - cannot validate applicantId');
        return false;
      }
      
      if (applicantId !== zoneinfoValue) {
        console.error(`❌ ApplicantId mismatch: provided '${applicantId}' does not match user's zoneinfo '${zoneinfoValue}'`);
        return false;
      }
      
      console.log(`✅ ApplicantId validation successful: '${applicantId}' matches user's zoneinfo`);
      return true;
    } catch (error) {
      console.error('❌ Error validating applicantId:', error);
      return false;
    }
  }

  // Save draft data with application_id/applicantId validation and mapping
  async saveDraft(draftData: DraftData | FormDataWithApplicationId): Promise<boolean> {
    const maxRetries = 3;
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        attempts++;
        console.log(`🔄 Attempt ${attempts} of ${maxRetries} to save draft...`);
        
        // Check authentication status before proceeding
        const isAuthenticated = await this.checkAuthenticationStatus();
        if (!isAuthenticated) {
          console.warn('⚠️ User not authenticated, attempting to refresh credentials...');
          await this.handleTokenExpiration();
          continue;
        }
        
        const client = await this.getClient();
        
        // Clean form data to ensure consistency between application_id and applicantId
        const cleanedFormData = this.cleanFormDataForConsistency(draftData);
        
        // Map application_id to applicantId for DynamoDB
        const applicantId = this.mapApplicationIdToApplicantId(cleanedFormData);
        if (!applicantId) {
          console.error('❌ No application_id or applicantId found in draft data');
          return false;
        }
        
        // Get the application_id for logging (could be from either interface)
        const applicationIdForLogging = 'application_id' in cleanedFormData ? cleanedFormData.application_id : cleanedFormData.applicantId;
        
        console.log('💾 Saving draft to DynamoDB:', {
          table: this.tableName,
          application_id: applicationIdForLogging,
          applicantId: applicantId, // DynamoDB partition key
          reference_id: draftData.reference_id,
          current_step: draftData.current_step
        });

        // Validate that application_id/applicantId matches the authenticated user's zoneinfo
        const isValidApplicationId = await this.validateApplicationId(applicantId);
        if (!isValidApplicationId) {
          console.error('❌ Invalid application_id - must match authenticated user\'s zoneinfo value');
          return false;
        }

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
        if (!applicantId) {
          console.error('❌ Missing required field: applicantId (mapped from application_id)');
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
            applicantId: applicantId, // Use the mapped applicantId
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
            applicantId: { S: applicantId }, // Use the mapped applicantId
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
        console.log('✅ Draft saved successfully to DynamoDB with validated applicantId');
        return true;
             } catch (error: any) {
         console.error(`❌ Error saving draft on attempt ${attempts}:`, error);
         
         // Check for authentication-related errors that can be resolved by refreshing credentials
         if (attempts < maxRetries && (
           error.name === 'NotAuthorizedException' || 
           error.name === 'AccessDeniedException' ||
           error.name === 'ExpiredTokenException' ||
           error.message?.includes('Token expired') ||
           error.message?.includes('Invalid login token')
         )) {
           console.warn(`⚠️ Authentication error detected on attempt ${attempts}. Attempting to refresh credentials and retry...`);
           try {
             await this.handleTokenExpiration();
             continue; // Retry the current attempt with new credentials
           } catch (refreshError) {
             console.error('❌ Failed to refresh credentials:', refreshError);
             return false;
           }
         }
         
         // For other errors, don't retry
         return false;
       }
    }
    console.error(`❌ Failed to save draft after ${maxRetries} attempts.`);
    return false;
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

  // Retrieve draft data by applicantId (for backward compatibility)
  async getDraft(applicationId: string, referenceId: string): Promise<DraftData | null> {
    try {
      const client = await this.getClient();
      
      console.log('📥 Retrieving draft from DynamoDB by applicantId:', {
        table: this.tableName,
        applicantId: applicationId,
        reference_id: referenceId
      });

      // Get the correct key structure - only use applicantId since table has no sort key
      const key = this.getKeyStructure(applicationId);

      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: key,
      });

      const response = await client.send(command);
      
      if (response.Item) {
        const draftData = unmarshall(response.Item) as DraftData;
        console.log('✅ Draft retrieved successfully from DynamoDB');
        
        // Ensure the returned draft data uses the current user's zoneinfo
        const currentUserZoneinfo = await this.getCurrentUserZoneinfo();
        if (currentUserZoneinfo) {
          console.log(`🔄 Mapping retrieved draft to use current user's zoneinfo '${currentUserZoneinfo}'`);
          
          // Update the draft data to use current user's zoneinfo
          draftData.zoneinfo = currentUserZoneinfo;
          draftData.applicantId = this.generateApplicantIdFromZoneinfo(currentUserZoneinfo);
          
          // Clean the form data to ensure consistency
          if (draftData.form_data && typeof draftData.form_data === 'object') {
            console.log('🧹 Cleaning form data in retrieved draft to ensure zoneinfo consistency');
            draftData.form_data = this.cleanFormDataForConsistency(draftData.form_data);
            
            // Ensure all form data fields use current zoneinfo
            if (draftData.form_data.application_id !== currentUserZoneinfo) {
              console.log(`🔄 Updating form_data.application_id to current zoneinfo '${currentUserZoneinfo}'`);
              draftData.form_data.application_id = currentUserZoneinfo;
            }
            
            if (draftData.form_data.applicantId !== draftData.applicantId) {
              console.log(`🔄 Updating form_data.applicantId to match draft applicantId '${draftData.applicantId}'`);
              draftData.form_data.applicantId = draftData.applicantId;
            }
            
            if (draftData.form_data.zoneinfo !== currentUserZoneinfo) {
              console.log(`🔄 Updating form_data.zoneinfo to current zoneinfo '${currentUserZoneinfo}'`);
              draftData.form_data.zoneinfo = currentUserZoneinfo;
            }
          }
          
          console.log('✅ Draft data updated to use current user\'s zoneinfo. Final state:', {
            zoneinfo: draftData.zoneinfo,
            applicantId: draftData.applicantId,
            form_data_zoneinfo: draftData.form_data?.zoneinfo,
            form_data_application_id: draftData.form_data?.application_id,
            form_data_applicantId: draftData.form_data?.applicantId
          });
        }
        
        return draftData;
      } else {
        console.log('📭 No draft found for the given applicantId');
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

  // Retrieve draft data by reference_id (preferred method for form components)
  async getDraftByReferenceId(referenceId: string): Promise<DraftData | null> {
    try {
      const client = await this.getClient();
      const currentUserZoneinfo = await this.getCurrentUserZoneinfo();
      
      if (!currentUserZoneinfo) {
        console.error('❌ Cannot get draft - no zoneinfo available for current user');
        return null;
      }
      
      console.log('🔍 Searching for draft by reference_id:', {
        table: this.tableName,
        reference_id: referenceId,
        currentUserZoneinfo: currentUserZoneinfo
      });

      // Since we can't query by reference_id directly (it's not a key), we need to scan
      // This is not ideal for production, but necessary for the current table structure
      const scanCommand = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'reference_id = :reference_id',
        ExpressionAttributeValues: {
          ':reference_id': { S: referenceId }
        }
      });

      const response = await client.send(scanCommand);
      
      if (response.Items && response.Items.length > 0) {
        // Find the most recent draft with this reference_id
        const drafts = response.Items.map((item: any) => unmarshall(item) as DraftData);
        const mostRecentDraft = drafts.sort((a: DraftData, b: DraftData) => 
          new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        )[0];
        
        console.log(`✅ Found draft with reference_id '${referenceId}' (stored with applicantId: '${mostRecentDraft.applicantId}')`);
        
        // Always map to current user's zoneinfo
        console.log(`🔄 Mapping draft to use current user's zoneinfo '${currentUserZoneinfo}'`);
        mostRecentDraft.zoneinfo = currentUserZoneinfo;
        mostRecentDraft.applicantId = this.generateApplicantIdFromZoneinfo(currentUserZoneinfo);
        
        // Clean the form data to ensure consistency
        if (mostRecentDraft.form_data && typeof mostRecentDraft.form_data === 'object') {
          console.log('🧹 Cleaning form data in retrieved draft to ensure zoneinfo consistency');
          mostRecentDraft.form_data = this.cleanFormDataForConsistency(mostRecentDraft.form_data);
          
          // Ensure all form data fields use current zoneinfo
          if (mostRecentDraft.form_data.application_id !== currentUserZoneinfo) {
            console.log(`🔄 Updating form_data.application_id to current zoneinfo '${currentUserZoneinfo}'`);
            mostRecentDraft.form_data.application_id = currentUserZoneinfo;
          }
          
          if (mostRecentDraft.form_data.applicantId !== mostRecentDraft.applicantId) {
            console.log(`🔄 Updating form_data.applicantId to match draft applicantId '${mostRecentDraft.applicantId}'`);
            mostRecentDraft.form_data.applicantId = mostRecentDraft.applicantId;
          }
          
          if (mostRecentDraft.form_data.zoneinfo !== currentUserZoneinfo) {
            console.log(`🔄 Updating form_data.zoneinfo to current zoneinfo '${currentUserZoneinfo}'`);
            mostRecentDraft.form_data.zoneinfo = currentUserZoneinfo;
          }
        }
        
        console.log('✅ Draft data updated to use current user\'s zoneinfo. Final state:', {
          zoneinfo: mostRecentDraft.zoneinfo,
          applicantId: mostRecentDraft.applicantId,
          form_data_zoneinfo: mostRecentDraft.form_data?.zoneinfo,
          form_data_application_id: mostRecentDraft.form_data?.application_id,
          form_data_applicantId: mostRecentDraft.form_data?.applicantId
        });
        
        return mostRecentDraft;
      } else {
        console.log(`📭 No draft found with reference_id '${referenceId}'`);
        return null;
      }
    } catch (error: any) {
      console.error('❌ Error retrieving draft by reference_id from DynamoDB:', error);
      return null;
    }
  }

  // Update draft status to submitted
  async markAsSubmitted(applicationId: string, referenceId: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      
      console.log('📝 Marking draft as submitted in DynamoDB:', {
        table: this.tableName,
        applicantId: applicationId,
        reference_id: referenceId
      });

      // Validate that applicantId matches the authenticated user's zoneinfo
      const isValidApplicantId = await this.validateApplicantId(applicationId);
      if (!isValidApplicantId) {
        console.error('❌ Invalid applicantId - must match authenticated user\'s zoneinfo value');
        return false;
      }

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
        applicantId: applicationId,
        reference_id: referenceId
      });

      // Validate that applicantId matches the authenticated user's zoneinfo
      const isValidApplicantId = await this.validateApplicantId(applicationId);
      if (!isValidApplicantId) {
        console.error('❌ Invalid applicantId - must match authenticated user\'s zoneinfo value');
        return false;
      }

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

  // Get all drafts for an applicantId
  async getAllDrafts(applicantId: string): Promise<DraftData[]> {
    try {
      console.log('📋 Getting all drafts for applicantId:', applicantId);

      // Validate that applicantId matches the authenticated user's zoneinfo
      const isValidApplicantId = await this.validateApplicantId(applicantId);
      if (!isValidApplicantId) {
        console.error('❌ Invalid applicantId - must match authenticated user\'s zoneinfo value');
        return [];
      }

      const client = await this.getClient();
      
      // Scan the table to find all drafts for this applicantId
      // Note: In production, consider creating a GSI for better performance
      const { ScanCommand } = await import('@aws-sdk/client-dynamodb');
      
      // First, let's do a debug scan to see what's in the table
      const debugScanCommand = new ScanCommand({
        TableName: this.tableName,
      });
      
      const debugResponse = await client.send(debugScanCommand);
      console.log('🔍 Debug scan - all items in table:', {
        totalItems: debugResponse.Items?.length || 0,
        items: debugResponse.Items?.map(item => unmarshall(item)) || []
      });
      
      const scanCommand = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'applicantId = :applicantId',
        ExpressionAttributeValues: {
          ':applicantId': { S: applicantId }
        }
      });

      const response = await client.send(scanCommand);
      
      console.log('🔍 Scan response:', {
        itemsCount: response.Items?.length || 0,
        scannedCount: response.ScannedCount,
        count: response.Count
      });
      
      if (response.Items && response.Items.length > 0) {
        console.log('🔍 Raw items from scan:', response.Items);
        
        const drafts = response.Items.map((item: any) => {
          const unmarshalled = unmarshall(item) as DraftData;
          console.log('🔍 Unmarshalled item:', unmarshalled);
          return unmarshalled;
        });
        
        // Sort by last_updated (most recent first)
        const sortedDrafts = drafts.sort((a: DraftData, b: DraftData) => 
          new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
        );
        
        console.log(`✅ Found ${drafts.length} drafts for applicantId: ${applicantId}`);
        console.log('🔍 Final sorted drafts:', sortedDrafts);
        return sortedDrafts;
      } else {
        console.log(`📭 No drafts found for applicantId: ${applicantId}`);
        console.log('🔍 Scan response details:', response);
        return [];
      }
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
      
      // Check if our key structure matches the expected schema
      const hasApplicantIdPartitionKey = keySchema.some(k => 
        k.AttributeName === 'applicantId' && k.KeyType === 'HASH'
      );
      const hasSortKey = keySchema.some(k => k.KeyType === 'RANGE');
      
      if (hasApplicantIdPartitionKey && hasSortKey) {
        console.log('✅ Table has applicantId as partition key + sort key (composite key)');
      } else if (hasApplicantIdPartitionKey) {
        console.log('✅ Table has applicantId as partition key (simple key) - this is correct');
      } else {
        console.log('❌ Table does not have applicantId as partition key');
        console.error('📋 Expected schema: applicantId as HASH (partition key)');
        console.error('📋 Current schema:', keySchema);
      }
      
      // Log table details
      if (describeResult.Table) {
        console.log('📋 Table details:', {
          name: describeResult.Table.TableName,
          status: describeResult.Table.TableStatus,
          itemCount: describeResult.Table.ItemCount,
          tableSizeBytes: describeResult.Table.TableSizeBytes,
          billingMode: describeResult.Table.BillingModeSummary?.BillingMode
        });
      }
      
      return hasApplicantIdPartitionKey;
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

// Utility functions that automatically use the current user's zoneinfo
export const dynamoDBUtils = {
  // Save draft using current user's zoneinfo
  async saveDraftForCurrentUser(draftData: any): Promise<boolean> {
    const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
    if (!zoneinfo) {
      console.error('❌ Cannot save draft - no zoneinfo available for current user');
      return false;
    }
    
    // Ensure the draft data uses the current user's zoneinfo
    draftData.zoneinfo = zoneinfo;
    
    // If the draft data has application_id, use it; otherwise use the current user's zoneinfo
    if (draftData.application_id) {
      console.log(`🔄 Using application_id '${draftData.application_id}' from form data`);
      draftData.applicantId = draftData.application_id;
    } else {
      console.log(`🔄 Using current user's zoneinfo '${zoneinfo}' for DynamoDB`);
      draftData.applicantId = zoneinfo;
    }
    
    return dynamoDBService.saveDraft(draftData);
  },

  // Get draft using current user's zoneinfo
  async getDraftForCurrentUser(referenceId: string): Promise<DraftData | null> {
    const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
    if (!zoneinfo) {
      console.error('❌ Cannot get draft - no zoneinfo available for current user');
      return null;
    }
    
    console.log(`🔄 Getting draft for current user with zoneinfo: ${zoneinfo}`);
    
    // Use the new getDraftByReferenceId method which handles zoneinfo mapping automatically
    return dynamoDBService.getDraftByReferenceId(referenceId);
  },

  // Mark draft as submitted using current user's zoneinfo
  async markDraftAsSubmittedForCurrentUser(referenceId: string): Promise<boolean> {
    const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
    if (!zoneinfo) {
      console.error('❌ Cannot mark draft as submitted - no zoneinfo available for current user');
      return false;
    }
    
    const applicantId = dynamoDBService.generateApplicantIdFromZoneinfo(zoneinfo);
    return dynamoDBService.markAsSubmitted(applicantId, referenceId);
  },

  // Delete draft using current user's zoneinfo
  async deleteDraftForCurrentUser(referenceId: string): Promise<boolean> {
    const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
    if (!zoneinfo) {
      console.error('❌ Cannot delete draft - no zoneinfo available for current user');
      return false;
    }
    
    const applicantId = dynamoDBService.generateApplicantIdFromZoneinfo(zoneinfo);
    return dynamoDBService.deleteDraft(applicantId, referenceId);
  },

  // Get all drafts for current user
  async getAllDraftsForCurrentUser(): Promise<DraftData[]> {
    const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
    if (!zoneinfo) {
      console.error('❌ Cannot get drafts - no zoneinfo available for current user');
      return [];
    }
    
    const applicantId = dynamoDBService.generateApplicantIdFromZoneinfo(zoneinfo);
    return dynamoDBService.getAllDrafts(applicantId);
  },

  // Ensure any draft data uses current user's zoneinfo
  async ensureDraftDataUsesCurrentZoneinfo(draftData: DraftData): Promise<DraftData> {
    return dynamoDBService.ensureDraftDataUsesCurrentZoneinfo(draftData);
  }
};
