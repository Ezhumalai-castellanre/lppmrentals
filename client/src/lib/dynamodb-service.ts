import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand, DescribeTableCommand, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { environment } from '../config/environment';

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
  storage_mode?: 'direct' | 'hybrid'; // Indicates storage method used
  s3_references?: string[]; // S3 URLs for hybrid storage
  flow_type?: 'legacy' | 'separate_webhooks'; // Indicates the webhook flow type used
  webhook_flow_version?: string; // Version of the webhook flow system
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

  // Apply ultra-aggressive data reduction for extremely large data
  private applyUltraReduction(hybridData: any): any {
    try {
      console.log('🔧 Applying ultra-aggressive data reduction...');
      
      const ultraReduced = {
        formData: this.extractMinimalFormData(hybridData.formData),
        uploadedFiles: this.extractMinimalFileMetadata(hybridData.uploadedFiles),
        webhookResponses: this.extractMinimalWebhookData(hybridData.webhookResponses),
        signatures: this.extractMinimalSignatureData(hybridData.signatures),
        encryptedDocuments: this.extractMinimalDocumentData(hybridData.encryptedDocuments),
        s3References: hybridData.s3References || []
      };

      console.log('✅ Ultra-reduction completed');
      return ultraReduced;
    } catch (error) {
      console.error('❌ Error applying ultra reduction:', error);
      // Return minimal fallback data
      return {
        formData: { application_id: hybridData.formData?.application_id, applicantId: hybridData.formData?.applicantId },
        uploadedFiles: {},
        webhookResponses: {},
        signatures: {},
        encryptedDocuments: {},
        s3References: hybridData.s3References || []
      };
    }
  }

  // Extract minimal form data (only essential fields)
  private extractMinimalFormData(formData: any): any {
    if (!formData || typeof formData !== 'object') {
      return {};
    }

    // Keep only the most essential fields
    return {
      application_id: formData.application_id,
      applicantId: formData.applicantId,
      current_step: formData.current_step,
      status: formData.status,
      last_updated: formData.last_updated,
      // Add any other absolutely critical fields here
    };
  }

  // Extract minimal file metadata
  private extractMinimalFileMetadata(uploadedFiles: any): any {
    if (!uploadedFiles || typeof uploadedFiles !== 'object') {
      return {};
    }

    const minimal: Record<string, any> = {};
    for (const [key, value] of Object.entries(uploadedFiles)) {
      if (value && typeof value === 'object') {
        minimal[key] = {
          fileName: (value as any).fileName || key,
          // Keep only the most essential metadata
        };
      }
    }
    return minimal;
  }

  // Extract minimal webhook data
  private extractMinimalWebhookData(webhookResponses: any): any {
    if (!webhookResponses || typeof webhookResponses !== 'object') {
      return {};
    }

    const minimal: Record<string, any> = {};
    for (const [key, value] of Object.entries(webhookResponses)) {
      if (value && typeof value === 'object') {
        minimal[key] = {
          status: (value as any).status,
          // Keep only the most essential fields
        };
      }
    }
    return minimal;
  }

  // Extract minimal signature data
  private extractMinimalSignatureData(signatures: any): any {
    if (!signatures || typeof signatures !== 'object') {
      return {};
    }

    const minimal: Record<string, any> = {};
    for (const [key, value] of Object.entries(signatures)) {
      if (value && typeof value === 'object') {
        minimal[key] = {
          signed: (value as any).signed,
          // Keep only the most essential fields
        };
      }
    }
    return minimal;
  }

  // Extract minimal document data
  private extractMinimalDocumentData(encryptedDocuments: any): any {
    if (!encryptedDocuments || typeof encryptedDocuments !== 'object') {
      return {};
    }

    const minimal: Record<string, any> = {};
    for (const [key, value] of Object.entries(encryptedDocuments)) {
      if (value && typeof value === 'object') {
        minimal[key] = {
          documentType: (value as any).documentType,
          // Keep only the most essential fields
        };
      }
    }
    return minimal;
  }

  // Calculate final data size after hybrid storage processing
  private calculateFinalDataSize(hybridData: any): number {
    try {
      const sizes = {
        formData: JSON.stringify(hybridData.formData || {}).length,
        uploadedFiles: JSON.stringify(hybridData.uploadedFiles || {}).length,
        webhookResponses: JSON.stringify(hybridData.webhookResponses || {}).length,
        signatures: JSON.stringify(hybridData.signatures || {}).length,
        encryptedDocuments: JSON.stringify(hybridData.encryptedDocuments || {}).length,
        s3References: JSON.stringify(hybridData.s3References || []).length
      };

      const totalSize = Object.values(sizes).reduce((sum, size) => sum + size, 0);
      
      console.log('📏 Final data sizes after hybrid storage processing:', {
        ...sizes,
        totalSize,
        maxAllowed: 400 * 1024, // 400KB in bytes
        isOverLimit: totalSize > 400 * 1024,
        remainingSpace: (400 * 1024) - totalSize
      });

      return totalSize;
    } catch (error) {
      console.error('❌ Error calculating final data size:', error);
      return 0;
    }
  }

  // Save draft data to DynamoDB with hybrid storage for large data
  async saveDraft(draftData: DraftData, applicantId: string): Promise<boolean> {
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;
      console.log(`📝 Attempt ${attempts} to save draft to DynamoDB`);

      try {
        // Clean and prepare data
        const cleanFormData = this.cleanFormDataForConsistency(draftData.form_data || {});
        const cleanUploadedFiles = draftData.uploaded_files_metadata || {};
        const cleanWebhookResponses = draftData.webhook_responses || {};
        const cleanSignatures = draftData.signatures || {};
        const cleanEncryptedDocuments = draftData.encrypted_documents || {};

        // Calculate sizes
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

        // If data is too large, implement hybrid storage approach
        if (totalSize > 400 * 1024) {
          console.warn('⚠️ Data exceeds 400KB limit, implementing hybrid storage approach');
          
          // Store large data in S3 and keep only references in DynamoDB
          const hybridData = await this.implementHybridStorage({
            formData: cleanFormData,
            uploadedFiles: cleanUploadedFiles,
            webhookResponses: cleanWebhookResponses,
            signatures: cleanSignatures,
            encryptedDocuments: cleanEncryptedDocuments,
            reference_id: draftData.reference_id
          }, applicantId);

          // Calculate final size after hybrid storage processing
          const finalSize = this.calculateFinalDataSize(hybridData);
          
          // Double-check that the final data will fit in DynamoDB
          if (finalSize > 400 * 1024) {
            console.error(`❌ Data still too large after hybrid storage: ${finalSize} bytes (max: 400KB)`);
            console.warn('⚠️ Attempting to further reduce data size...');
            
            // Apply more aggressive data reduction
            const ultraReducedData = this.applyUltraReduction(hybridData);
            const ultraReducedSize = this.calculateFinalDataSize(ultraReducedData);
            
            if (ultraReducedSize > 400 * 1024) {
              console.error(`❌ Data still too large after ultra reduction: ${ultraReducedSize} bytes`);
              throw new Error(`Data exceeds DynamoDB size limit even after aggressive reduction: ${ultraReducedSize} bytes`);
            }
            
            // Use the ultra-reduced data
            Object.assign(hybridData, ultraReducedData);
            console.log('✅ Ultra-reduced data fits in DynamoDB');
          } else {
            console.log('✅ Hybrid storage data fits in DynamoDB');
          }

          // Get DynamoDB client
          const client = await this.getClient();

          // Save the hybrid data structure to DynamoDB
          const command = new PutItemCommand({
            TableName: this.tableName,
            Item: {
              applicantId: { S: applicantId },
              reference_id: { S: draftData.reference_id },
              form_data: { S: JSON.stringify(hybridData.formData) },
              current_step: { N: (draftData.current_step || 0).toString() },
              last_updated: { S: draftData.last_updated || new Date().toISOString() },
              status: { S: draftData.status || 'draft' },
              uploaded_files_metadata: { S: JSON.stringify(hybridData.uploadedFiles) },
              webhook_responses: { S: JSON.stringify(hybridData.webhookResponses) },
              signatures: { S: JSON.stringify(hybridData.signatures) },
              encrypted_documents: { S: JSON.stringify(hybridData.encryptedDocuments) },
              storage_mode: { S: 'hybrid' }, // Indicate this uses hybrid storage
              s3_references: { S: JSON.stringify(hybridData.s3References) },
              flow_type: { S: draftData.flow_type || 'legacy' }, // Flow type for webhook system
              webhook_flow_version: { S: draftData.webhook_flow_version || '1.0' } // Webhook flow version
            },
          });

          await client.send(command);
          console.log('✅ Draft saved successfully using hybrid storage approach');
          return true;
        }

        // Get DynamoDB client
        const client = await this.getClient();

        // If data fits, save normally
        const command = new PutItemCommand({
          TableName: this.tableName,
          Item: {
            applicantId: { S: applicantId },
            reference_id: { S: draftData.reference_id },
            form_data: { S: JSON.stringify(cleanFormData) },
            current_step: { N: (draftData.current_step || 0).toString() },
            last_updated: { S: draftData.last_updated || new Date().toISOString() },
            status: { S: draftData.status || 'draft' },
            uploaded_files_metadata: { S: JSON.stringify(cleanUploadedFiles) },
            webhook_responses: { S: JSON.stringify(cleanWebhookResponses) },
            signatures: { S: JSON.stringify(cleanSignatures) },
            encrypted_documents: { S: JSON.stringify(cleanEncryptedDocuments) },
            storage_mode: { S: 'direct' }, // Indicate this is stored directly
            flow_type: { S: draftData.flow_type || 'legacy' }, // Flow type for webhook system
            webhook_flow_version: { S: draftData.webhook_flow_version || '1.0' } // Webhook flow version
          },
        });

        await client.send(command);
        console.log('✅ Draft saved successfully to DynamoDB with validated applicantId');
        return true;
      } catch (error: any) {
        if (await this.handleSaveDraftError(error, attempts, maxRetries)) {
          continue; // Retry the current attempt with new credentials
        }
        return false;
      }
    }
    console.error(`❌ Failed to save draft after ${maxRetries} attempts.`);
    return false;
  }

  // Migrate existing large data to hybrid storage
  async migrateToHybridStorage(applicantId: string, referenceId: string): Promise<boolean> {
    try {
      console.log('🔄 Migrating existing data to hybrid storage...');
      
      // First, retrieve the existing data
      const existingDraft = await this.getDraft(applicantId, referenceId);
      if (!existingDraft) {
        console.log('📭 No existing draft found to migrate');
        return false;
      }

      // Check if data is already using hybrid storage
      if (existingDraft.storage_mode === 'hybrid') {
        console.log('✅ Data is already using hybrid storage');
        return true;
      }

      // Create new draft data with hybrid storage
      const newDraftData: DraftData = {
        ...existingDraft,
        last_updated: new Date().toISOString(),
      };

      // Save using hybrid storage approach
      const success = await this.saveDraft(newDraftData, applicantId);
      if (success) {
        console.log('✅ Successfully migrated data to hybrid storage');
        return true;
      } else {
        console.error('❌ Failed to migrate data to hybrid storage');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error during migration to hybrid storage:', error);
      return false;
    }
  }

  // Enhanced error handling for saveDraft
  private async handleSaveDraftError(error: any, attempts: number, maxRetries: number): Promise<boolean> {
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
        return true; // Indicate retry should continue
      } catch (refreshError) {
        console.error('❌ Failed to refresh credentials:', refreshError);
        return false;
      }
    }

    // Check for DynamoDB-specific errors
    if (error.name === 'ValidationException') {
      if (error.message?.includes('Item size has exceeded the maximum allowed size')) {
        console.warn('⚠️ Item size exceeded limit, attempting to use hybrid storage...');
        // This should be handled by the hybrid storage logic above
        return false; // Don't retry, hybrid storage should handle it
      }
      console.error('🔧 Validation error - check data structure and table schema');
    } else if (error.name === 'ResourceNotFoundException') {
      console.error(`🔧 Table '${this.tableName}' not found`);
    } else if (error.name === 'AccessDeniedException') {
      console.error('🔧 Access denied - check AWS credentials and permissions');
    } else if (error.name === 'ProvisionedThroughputExceededException') {
      console.warn('⚠️ Provisioned throughput exceeded, waiting before retry...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true; // Indicate retry should continue
    }
    
    // For other errors, don't retry
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

  // Implement hybrid storage for large data
  private async implementHybridStorage(data: any, applicantId: string): Promise<{
    formData: any;
    uploadedFiles: any;
    webhookResponses: any;
    signatures: any;
    encryptedDocuments: any;
    s3References: string[];
  }> {
    try {
      console.log('🔄 Implementing hybrid storage for large data...');
      const s3References: string[] = [];
      const referenceId = data.reference_id || `draft_${Date.now()}`;

      // Create a simplified version of form data (remove large fields)
      const simplifiedFormData = this.simplifyFormDataForDynamoDB(data.formData);
      
      // Initialize with minimal data structures
      let finalUploadedFiles = {};
      let finalWebhookResponses = {};
      let finalSignatures = {};
      let finalEncryptedDocuments = {};
      
      // Store large data in S3 and keep only references in DynamoDB
      if (data.uploadedFiles && typeof data.uploadedFiles === 'object' && Object.keys(data.uploadedFiles).length > 0) {
        try {
          const uploadedFilesS3Key = `uploaded_files/${applicantId}/${referenceId}.json`;
          const uploadedFilesS3Url = await this.uploadToS3(JSON.stringify(data.uploadedFiles), uploadedFilesS3Key);
          s3References.push(uploadedFilesS3Url);
          // Keep only essential metadata in DynamoDB
          finalUploadedFiles = this.extractEssentialFileMetadata(data.uploadedFiles);
          console.log('✅ Uploaded files metadata stored in S3');
        } catch (error) {
          console.warn('⚠️ Failed to store uploaded files in S3, keeping minimal data:', error);
          // Keep only essential metadata in DynamoDB
          finalUploadedFiles = this.extractEssentialFileMetadata(data.uploadedFiles);
        }
      }

      if (data.webhookResponses && typeof data.webhookResponses === 'object' && Object.keys(data.webhookResponses).length > 0) {
        try {
          const webhookResponsesS3Key = `webhook_responses/${applicantId}/${referenceId}.json`;
          const webhookResponsesS3Url = await this.uploadToS3(JSON.stringify(data.webhookResponses), webhookResponsesS3Key);
          s3References.push(webhookResponsesS3Url);
          // Keep only essential metadata in DynamoDB
          finalWebhookResponses = this.extractEssentialWebhookData(data.webhookResponses);
          console.log('✅ Webhook responses stored in S3');
        } catch (error) {
          console.warn('⚠️ Failed to store webhook responses in S3, keeping minimal data:', error);
          finalWebhookResponses = this.extractEssentialWebhookData(data.webhookResponses);
        }
      }

      if (data.signatures && typeof data.signatures === 'object' && Object.keys(data.signatures).length > 0) {
        try {
          const signaturesS3Key = `signatures/${applicantId}/${referenceId}.json`;
          const signaturesS3Url = await this.uploadToS3(JSON.stringify(data.signatures), signaturesS3Key);
          s3References.push(signaturesS3Url);
          // Keep only essential metadata in DynamoDB
          finalSignatures = this.extractEssentialSignatureData(data.signatures);
          console.log('✅ Signatures stored in S3');
        } catch (error) {
          console.warn('⚠️ Failed to store signatures in S3, keeping minimal data:', error);
          finalSignatures = this.extractEssentialSignatureData(data.signatures);
        }
      }

      if (data.encryptedDocuments && typeof data.encryptedDocuments === 'object' && Object.keys(data.encryptedDocuments).length > 0) {
        try {
          const encryptedDocumentsS3Key = `encrypted_documents/${applicantId}/${referenceId}.json`;
          const encryptedDocumentsS3Url = await this.uploadToS3(JSON.stringify(data.encryptedDocuments), encryptedDocumentsS3Key);
          s3References.push(encryptedDocumentsS3Url);
          // Keep only essential metadata in DynamoDB
          finalEncryptedDocuments = this.extractEssentialDocumentData(data.encryptedDocuments);
          console.log('✅ Encrypted documents stored in S3');
        } catch (error) {
          console.warn('⚠️ Failed to store encrypted documents in S3, keeping minimal data:', error);
          finalEncryptedDocuments = this.extractEssentialDocumentData(data.encryptedDocuments);
        }
      }

      console.log(`✅ Hybrid storage completed. ${s3References.length} items stored in S3`);

      // Return the cleaned data and S3 references - ensure all data is minimal
      return {
        formData: simplifiedFormData,
        uploadedFiles: finalUploadedFiles,
        webhookResponses: finalWebhookResponses,
        signatures: finalSignatures,
        encryptedDocuments: finalEncryptedDocuments,
        s3References: s3References
      };
    } catch (error) {
      console.error('❌ Error implementing hybrid storage:', error);
      // Fallback to simplified data if hybrid storage fails
      return {
        formData: this.simplifyFormDataForDynamoDB(data.formData),
        uploadedFiles: this.extractEssentialFileMetadata(data.uploadedFiles),
        webhookResponses: this.extractEssentialWebhookData(data.webhookResponses),
        signatures: this.extractEssentialSignatureData(data.signatures),
        encryptedDocuments: this.extractEssentialDocumentData(data.encryptedDocuments),
        s3References: []
      };
    }
  }

  // Simplify form data to fit in DynamoDB
  private simplifyFormDataForDynamoDB(formData: any): any {
    if (!formData || typeof formData !== 'object') {
      return {};
    }

    try {
      // Create a simplified version that keeps essential fields but removes large data
      const simplified = { ...formData };
      
      // Remove or simplify large fields that might cause size issues
      if (simplified.uploadedFiles) {
        simplified.uploadedFiles = this.extractEssentialFileMetadata(simplified.uploadedFiles);
      }
      
      if (simplified.webhookResponses) {
        simplified.webhookResponses = this.extractEssentialWebhookData(simplified.webhookResponses);
      }
      
      if (simplified.signatures) {
        simplified.signatures = this.extractEssentialSignatureData(simplified.signatures);
      }
      
      if (simplified.encryptedDocuments) {
        simplified.encryptedDocuments = this.extractEssentialDocumentData(simplified.encryptedDocuments);
      }

      return simplified;
    } catch (error) {
      console.warn('⚠️ Error simplifying form data:', error);
      return { application_id: formData.application_id, applicantId: formData.applicantId };
    }
  }

  // Extract essential file metadata (remove large content)
  private extractEssentialFileMetadata(uploadedFiles: any): any {
    if (!uploadedFiles || typeof uploadedFiles !== 'object') {
      return {};
    }

    const essential: Record<string, any> = {};
    for (const [key, value] of Object.entries(uploadedFiles)) {
      if (value && typeof value === 'object') {
        // Keep only essential metadata, remove file content
        essential[key] = {
          fileName: (value as any).fileName || key,
          fileSize: (value as any).fileSize,
          fileType: (value as any).fileType,
          uploadDate: (value as any).uploadDate,
          s3Key: (value as any).s3Key,
          // Remove large fields like content, data, etc.
        };
      }
    }
    return essential;
  }

  // Extract essential webhook data
  private extractEssentialWebhookData(webhookResponses: any): any {
    if (!webhookResponses || typeof webhookResponses !== 'object') {
      return {};
    }

    const essential: Record<string, any> = {};
    for (const [key, value] of Object.entries(webhookResponses)) {
      if (value && typeof value === 'object') {
        essential[key] = {
          status: (value as any).status,
          timestamp: (value as any).timestamp,
          success: (value as any).success,
          // Keep only essential fields, remove large response data
        };
      }
    }
    return essential;
  }

  // Extract essential signature data
  private extractEssentialSignatureData(signatures: any): any {
    if (!signatures || typeof signatures !== 'object') {
      return {};
    }

    const essential: Record<string, any> = {};
    for (const [key, value] of Object.entries(signatures)) {
      if (value && typeof value === 'object') {
        essential[key] = {
          signed: (value as any).signed,
          timestamp: (value as any).timestamp,
          signerName: (value as any).signerName,
          // Remove large signature data
        };
      }
    }
    return essential;
  }

  // Extract essential document data
  private extractEssentialDocumentData(encryptedDocuments: any): any {
    if (!encryptedDocuments || typeof encryptedDocuments !== 'object') {
      return {};
    }

    const essential: Record<string, any> = {};
    for (const [key, value] of Object.entries(encryptedDocuments)) {
      if (value && typeof value === 'object') {
        essential[key] = {
          documentType: (value as any).documentType,
          encrypted: (value as any).encrypted,
          timestamp: (value as any).timestamp,
          // Remove large encrypted content
        };
      }
    }
    return essential;
  }

  // Check if S3 bucket is accessible
  private async checkS3BucketAccess(): Promise<boolean> {
    try {
      const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3');
      
      // Get AWS credentials using enhanced provider
      const { getAwsCredentialsForS3 } = await import('./aws-config');
      const credentials = await getAwsCredentialsForS3();
      
      if (!credentials) {
        console.warn('⚠️ No AWS credentials available for S3 bucket check');
        return false;
      }

      const s3Client = new S3Client({ 
        region: this.region,
        credentials: credentials
      });

      const command = new HeadBucketCommand({
        Bucket: environment.s3.bucketName,
      });

      await s3Client.send(command);
      console.log(`✅ S3 bucket '${environment.s3.bucketName}' is accessible`);
      return true;
    } catch (error: any) {
      console.warn(`⚠️ S3 bucket '${environment.s3.bucketName}' is not accessible:`, error.message);
      return false;
    }
  }

  // Upload data to S3 with better error handling
  private async uploadToS3(data: string, key: string): Promise<string> {
    try {
      // First check if S3 bucket is accessible
      const bucketAccessible = await this.checkS3BucketAccess();
      if (!bucketAccessible) {
        throw new Error(`S3 bucket '${environment.s3.bucketName}' is not accessible`);
      }

      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      
      // Get AWS credentials using enhanced provider
      const { getAwsCredentialsForS3 } = await import('./aws-config');
      const credentials = await getAwsCredentialsForS3();
      
      if (!credentials) {
        throw new Error('Failed to get AWS credentials for S3 operations');
      }

      console.log('🔑 Using AWS credentials for S3 upload:', {
        hasAccessKey: !!credentials.accessKeyId,
        hasSecretKey: !!credentials.secretAccessKey,
        hasSessionToken: !!credentials.sessionToken
      });

      const s3Client = new S3Client({ 
        region: this.region,
        credentials: credentials
      });

      const command = new PutObjectCommand({
        Bucket: environment.s3.bucketName,
        Key: key,
        Body: data,
        ContentType: 'application/json',
      });

      await s3Client.send(command);
      const s3Url = `https://${environment.s3.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      console.log(`✅ Data uploaded to S3: ${s3Url}`);
      return s3Url;
    } catch (error: any) {
      console.error(`❌ Error uploading data to S3:`, error);
      throw new Error(`Failed to upload data to S3: ${error.message}`);
    }
  }

  // Download data from S3
  private async downloadFromS3(s3Url: string): Promise<any> {
    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      
      // Get AWS credentials using enhanced provider
      const { getAwsCredentialsForS3 } = await import('./aws-config');
      const credentials = await getAwsCredentialsForS3();
      
      if (!credentials) {
        throw new Error('Failed to get AWS credentials for S3 operations');
      }

      console.log('🔑 Using AWS credentials for S3 download:', {
        hasAccessKey: !!credentials.accessKeyId,
        hasSecretKey: !!credentials.secretAccessKey,
        hasSessionToken: !!credentials.sessionToken
      });

      const s3Client = new S3Client({ 
        region: this.region,
        credentials: credentials
      });

      const key = s3Url.replace(`https://${environment.s3.bucketName}.s3.${this.region}.amazonaws.com/`, '');
      const command = new GetObjectCommand({
        Bucket: environment.s3.bucketName,
        Key: key,
      });

      const response = await s3Client.send(command);
      const data = await response.Body?.transformToString();
      return data ? JSON.parse(data) : null;
    } catch (error: any) {
      console.error(`❌ Error downloading data from S3:`, error);
      throw new Error(`Failed to download data from S3: ${error.message}`);
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

      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: this.getKeyStructure(applicationId),
      });

      const response = await client.send(command);
      
      if (!response.Item) {
        console.log('📭 No draft found for applicantId:', applicationId);
        return null;
      }

      const item = unmarshall(response.Item);
      console.log('📋 Retrieved draft item:', item);

      // Check if this is using hybrid storage
      if (item.storage_mode === 'hybrid' && item.s3_references) {
        console.log('🔄 Draft uses hybrid storage, retrieving full data from S3...');
        return await this.retrieveHybridStorageDraft(item);
      }

      // Regular direct storage
      const draftData: DraftData = {
        zoneinfo: item.zoneinfo || applicationId,
        applicantId: item.applicantId || applicationId,
        reference_id: item.reference_id,
        form_data: item.form_data ? JSON.parse(item.form_data) : {},
        current_step: item.current_step || 0,
        last_updated: item.last_updated,
        status: item.status || 'draft',
        uploaded_files_metadata: item.uploaded_files_metadata ? JSON.parse(item.uploaded_files_metadata) : {},
        webhook_responses: item.webhook_responses ? JSON.parse(item.webhook_responses) : {},
        signatures: item.signatures ? JSON.parse(item.signatures) : {},
        encrypted_documents: item.encrypted_documents ? JSON.parse(item.encrypted_documents) : {},
      };

      console.log('✅ Draft retrieved successfully from DynamoDB');
      return draftData;
    } catch (error: any) {
      console.error('❌ Error retrieving draft:', error);
      return null;
    }
  }

  // Retrieve full draft data from hybrid storage (S3 + DynamoDB)
  private async retrieveHybridStorageDraft(item: any): Promise<DraftData | null> {
    try {
      console.log('🔄 Retrieving full data from hybrid storage...');
      
      const s3References = item.s3_references ? JSON.parse(item.s3_references) : [];
      console.log(`📋 Found ${s3References.length} S3 references:`, s3References);

      // Parse the base data from DynamoDB
      const baseFormData = item.form_data ? JSON.parse(item.form_data) : {};
      const baseUploadedFiles = item.uploaded_files_metadata ? JSON.parse(item.uploaded_files_metadata) : {};
      const baseWebhookResponses = item.webhook_responses ? JSON.parse(item.webhook_responses) : {};
      const baseSignatures = item.signatures ? JSON.parse(item.signatures) : {};
      const baseEncryptedDocuments = item.encrypted_documents ? JSON.parse(item.encrypted_documents) : {};

      // Try to retrieve full data from S3 for each reference
      let fullUploadedFiles = baseUploadedFiles;
      let fullWebhookResponses = baseWebhookResponses;
      let fullSignatures = baseSignatures;
      let fullEncryptedDocuments = baseEncryptedDocuments;

      // Ensure s3References is an array before processing
      if (Array.isArray(s3References)) {
        for (const s3Url of s3References) {
          try {
            const data = await this.downloadFromS3(s3Url as string);
            if (data) {
              // Determine the type of data based on the S3 key
              if (s3Url.includes('/uploaded_files/')) {
                fullUploadedFiles = { ...fullUploadedFiles, ...data };
              } else if (s3Url.includes('/webhook_responses/')) {
                fullWebhookResponses = { ...fullWebhookResponses, ...data };
              } else if (s3Url.includes('/signatures/')) {
                fullSignatures = { ...fullSignatures, ...data };
              } else if (s3Url.includes('/encrypted_documents/')) {
                fullEncryptedDocuments = { ...fullEncryptedDocuments, ...data };
              }
            }
          } catch (error) {
            console.warn(`⚠️ Failed to retrieve data from S3: ${s3Url}`, error);
            // Continue with other references
          }
        }
      } else {
        console.warn('⚠️ s3_references is not an array:', typeof s3References);
      }

      const draftData: DraftData = {
        zoneinfo: item.zoneinfo || item.applicantId,
        applicantId: item.applicantId,
        reference_id: item.reference_id,
        form_data: baseFormData,
        current_step: item.current_step || 0,
        last_updated: item.last_updated,
        status: item.status || 'draft',
        uploaded_files_metadata: fullUploadedFiles,
        webhook_responses: fullWebhookResponses,
        signatures: fullSignatures,
        encrypted_documents: fullEncryptedDocuments,
      };

      console.log('✅ Full draft data retrieved from hybrid storage');
      return draftData;
    } catch (error: any) {
      console.error('❌ Error retrieving hybrid storage draft:', error);
      // Fallback to base data if S3 retrieval fails
      return {
        zoneinfo: item.zoneinfo || item.applicantId,
        applicantId: item.applicantId,
        reference_id: item.reference_id,
        form_data: item.form_data ? JSON.parse(item.form_data) : {},
        current_step: item.current_step || 0,
        last_updated: item.last_updated,
        status: item.status || 'draft',
        uploaded_files_metadata: item.uploaded_files_metadata ? JSON.parse(item.uploaded_files_metadata) : {},
        webhook_responses: item.webhook_responses ? JSON.parse(item.webhook_responses) : {},
        signatures: item.signatures ? JSON.parse(item.signatures) : {},
        encrypted_documents: item.encrypted_documents ? JSON.parse(item.encrypted_documents) : {},
      };
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

  // Retrieve full data from hybrid storage (combines DynamoDB metadata with S3 content)
  async getFullDraftData(applicantId: string, referenceId: string): Promise<DraftData | null> {
    try {
      console.log('📥 Retrieving full draft data from hybrid storage...');
      
      // First get the base data from DynamoDB
      const baseDraft = await this.getDraft(applicantId, referenceId);
      if (!baseDraft) {
        console.log('📭 No base draft found in DynamoDB');
        return null;
      }

      // Check if this is using hybrid storage
      if (baseDraft.storage_mode === 'hybrid' && baseDraft.s3_references) {
        console.log('🔄 Detected hybrid storage, retrieving full data from S3...');
        
        try {
          const s3References = JSON.parse(baseDraft.s3_references);
          const fullData: DraftData = { ...baseDraft };

          // Ensure s3References is an array
          if (Array.isArray(s3References)) {
            // Retrieve data from S3 based on references
            for (const s3Url of s3References) {
              try {
                const s3Data = await this.downloadFromS3(s3Url as string);
                if (s3Data) {
                  // Determine what type of data this is based on the S3 key
                  if (s3Url.includes('uploaded_files')) {
                    fullData.uploaded_files_metadata = s3Data;
                  } else if (s3Url.includes('webhook_responses')) {
                    fullData.webhook_responses = s3Data;
                  } else if (s3Url.includes('signatures')) {
                    fullData.signatures = s3Data;
                  } else if (s3Url.includes('encrypted_documents')) {
                    fullData.encrypted_documents = s3Data;
                  }
                }
              } catch (s3Error) {
                console.warn(`⚠️ Failed to retrieve data from S3 URL: ${s3Url}`, s3Error);
              }
            }
          } else {
            console.warn('⚠️ s3_references is not an array:', typeof s3References);
          }

          console.log('✅ Full draft data retrieved from hybrid storage');
          return fullData;
        } catch (error) {
          console.error('❌ Error retrieving data from S3:', error);
          // Return base data if S3 retrieval fails
          return baseDraft;
        }
      } else {
        console.log('📋 Draft uses direct storage, returning base data');
        return baseDraft;
      }
    } catch (error) {
      console.error('❌ Error retrieving full draft data:', error);
      return null;
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
    
    return dynamoDBService.saveDraft(draftData, draftData.applicantId);
  },

  // Get draft using current user's zoneinfo
  async getDraftForCurrentUser(referenceId: string): Promise<DraftData | null> {
    const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
    if (!zoneinfo) {
      console.error('❌ Cannot get draft - no zoneinfo available for current user');
      return null;
    }
    
    return dynamoDBService.getDraft(zoneinfo, referenceId);
  },

  // Mark draft as submitted using current user's zoneinfo
  async markDraftAsSubmittedForCurrentUser(referenceId: string): Promise<boolean> {
    const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
    if (!zoneinfo) {
      console.error('❌ Cannot mark draft as submitted - no zoneinfo available for current user');
      return false;
    }
    
    return dynamoDBService.markAsSubmitted(zoneinfo, referenceId);
  },

  // Delete draft using current user's zoneinfo
  async deleteDraftForCurrentUser(referenceId: string): Promise<boolean> {
    const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
    if (!zoneinfo) {
      console.error('❌ Cannot delete draft - no zoneinfo available for current user');
      return false;
    }
    
    return dynamoDBService.deleteDraft(zoneinfo, referenceId);
  },

  // Get all drafts for current user
  async getAllDraftsForCurrentUser(): Promise<DraftData[]> {
    const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
    if (!zoneinfo) {
      console.error('❌ Cannot get drafts - no zoneinfo available for current user');
      return [];
    }
    
    return dynamoDBService.getAllDrafts(zoneinfo);
  },

  // Migrate existing data to hybrid storage
  async migrateToHybridStorage(referenceId: string): Promise<boolean> {
    const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
    if (!zoneinfo) {
      console.error('❌ Cannot migrate data - no zoneinfo available for current user');
      return false;
    }
    
    return dynamoDBService.migrateToHybridStorage(zoneinfo, referenceId);
  },

  // Test hybrid storage functionality
  async testHybridStorage(): Promise<boolean> {
    try {
      console.log('🧪 Testing hybrid storage functionality...');
      
      // Test S3 bucket access
      const s3Accessible = await dynamoDBService['checkS3BucketAccess']();
      if (!s3Accessible) {
        console.warn('⚠️ S3 bucket not accessible, hybrid storage may not work');
        return false;
      }
      
      console.log('✅ S3 bucket is accessible');
      
      // Test with sample data
      const testData = {
        zoneinfo: 'test-zoneinfo',
        applicantId: 'test-zoneinfo',
        reference_id: `test_${Date.now()}`,
        form_data: { test: 'data' },
        current_step: 1,
        last_updated: new Date().toISOString(),
        status: 'draft' as const,
        uploaded_files_metadata: { testFile: { fileName: 'test.txt', fileSize: 1024 } },
        webhook_responses: { testWebhook: { status: 'success', timestamp: new Date().toISOString() } },
        signatures: { testSignature: { signed: true, timestamp: new Date().toISOString() } },
        encrypted_documents: { testDoc: { documentType: 'test', encrypted: true, timestamp: new Date().toISOString() } }
      };
      
      // Test save with hybrid storage
      const saveResult = await dynamoDBService.saveDraft(testData, testData.applicantId);
      if (!saveResult) {
        console.error('❌ Failed to save test data with hybrid storage');
        return false;
      }
      
      console.log('✅ Test data saved successfully with hybrid storage');
      
      // Test retrieval
      const retrievedData = await dynamoDBService.getDraft(testData.applicantId, testData.reference_id);
      if (!retrievedData) {
        console.error('❌ Failed to retrieve test data');
        return false;
      }
      
      console.log('✅ Test data retrieved successfully');
      
      // Clean up test data
      await dynamoDBService.deleteDraft(testData.applicantId, testData.reference_id);
      console.log('✅ Test data cleaned up');
      
      return true;
    } catch (error) {
      console.error('❌ Error testing hybrid storage:', error);
      return false;
    }
  }
};
