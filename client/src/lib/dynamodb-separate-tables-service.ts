import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand, DescribeTableCommand, CreateTableCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { environment } from '../config/environment';

// Application Information Interface
export interface ApplicationData {
  userId: string; // User's ID (sub from ID token) - Partition key
  role: string; // User's role (applicant, coapplicant, guarantor, etc.)
  appid: string; // Generated application ID
  zoneinfo: string; // User's zoneinfo
  application_info: any; // Application form data
  current_step: number;
  last_updated: string;
  status: 'draft' | 'submitted';
  uploaded_files_metadata?: any;
  webhook_responses?: any;
  signatures?: any;
  encrypted_documents?: any;
  storage_mode?: 'direct' | 'hybrid';
  s3_references?: string[];
  flow_type?: 'legacy' | 'separate_webhooks';
  webhook_flow_version?: string;
}

// Primary Applicant Interface (consolidated with co-applicants and guarantors)
export interface ApplicantData {
  userId: string; // User's ID
  role: string; // User's role (applicant, coapplicant, guarantor, etc.)
  zoneinfo: string; // User's zoneinfo
  appid?: string; // Link to main application
  applicant_info: any; // Primary applicant form data
  occupants: any; // Occupants data
  webhookSummary: any; // Webhook summary
  signature: any; // Applicant signature
  co_applicants?: any[]; // Array of co-applicant data
  guarantors?: any[]; // Array of guarantor data
  additionalPeople?: any; // Optional invites/links for co-applicants/guarantors
  timestamp: string; // Creation timestamp
  last_updated: string;
  status: 'draft' | 'submitted';
}

// Co-Applicant Interface
export interface CoApplicantData {
  userId: string; // User's ID
  role: string; // User's role (applicant, coapplicant, guarantor, etc.)
  zoneinfo: string; // User's zoneinfo
  appid: string; // Application ID to link to main application
  coapplicant_info: any; // Co-applicant form data
  webhookSummary: any; // Webhook summary
  signature: any; // Co-applicant signature
  current_step: number; // Current step in the form
  timestamp: string; // Creation timestamp (sort key)
  last_updated: string;
  status: 'draft' | 'submitted';
}

// Guarantor Interface
export interface GuarantorData {
  userId: string; // User's ID
  role: string; // User's role (applicant, coapplicant, guarantor, etc.)
  zoneinfo: string; // User's zoneinfo
  appid: string; // Application ID to link to main application
  guarantor_info: any; // Guarantor form data
  webhookSummary: any; // Webhook summary
  signature: any; // Guarantor signature
  current_step: number; // Current step in the form
  timestamp: string; // Creation timestamp (sort key)
  last_updated: string;
  status: 'draft' | 'submitted';
}

export class DynamoDBSeparateTablesService {
  private client: DynamoDBClient | null = null;
  private region: string;
  private tables: {
    app_nyc: string;
    applicant_nyc: string;
    coapplicants: string;
    guarantors: string;
  };

  constructor() {
    this.region = environment.aws.region;
    this.tables = {
      app_nyc: 'app_nyc',
      applicant_nyc: 'applicant_nyc',
      coapplicants: 'Co-Applicants',
      guarantors: 'Guarantors_nyc'
    };
    
    console.log('🔧 DynamoDB Separate Tables Service initialized with:', {
      region: this.region,
      tables: this.tables,
      identityPoolId: environment.aws.identityPoolId ? '***configured***' : 'missing'
    });
    
    // Initialize client lazily when needed
    this.initializeClientWithRetry();
  }

  // Normalize person info for storage: enforce 10-digit phone, 5-digit ZIP
  private normalizePersonInfo(raw: any): any {
    if (!raw || typeof raw !== 'object') return raw;
    const normalized: any = { ...raw };
    try {
      if (normalized.phone) {
        const digits = String(normalized.phone).replace(/\D/g, '');
        normalized.phone = digits.slice(-10);
      }
      if (normalized.landlordPhone) {
        const digits = String(normalized.landlordPhone).replace(/\D/g, '');
        normalized.landlordPhone = digits.slice(-10);
      }
      if (normalized.zip) {
        const digits = String(normalized.zip).replace(/\D/g, '');
        normalized.zip = digits.slice(0, 5);
      }
      if (normalized.landlordZipCode) {
        const digits = String(normalized.landlordZipCode).replace(/\D/g, '');
        normalized.landlordZipCode = digits.slice(0, 5);
      }
      
      // Explicitly preserve important nested structures like bankRecords
      // to ensure they are not lost during normalization
      if (raw.bankRecords && Array.isArray(raw.bankRecords)) {
        normalized.bankRecords = raw.bankRecords;
      }
      if (raw.bank_records && Array.isArray(raw.bank_records)) {
        normalized.bankRecords = raw.bank_records;
      }
    } catch {}
    return normalized;
  }

  // Recursively sanitize values so DynamoDB marshaller accepts them
  private sanitizeForDynamo<T = any>(input: T): T {
    const seen = new WeakSet();

    const sanitize = (value: any): any => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      const t = typeof value;
      if (t === 'string' || t === 'number' || t === 'boolean') return value;

      // Dates -> ISO strings
      if (value instanceof Date) return value.toISOString();

      // ArrayBuffer -> Uint8Array (Binary)
      if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
        return new Uint8Array(value);
      }

      // Uint8Array -> keep (Binary)
      if (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array) {
        return value;
      }

      // Browser File/Blob -> drop (store metadata only if needed)
      const isBlob = typeof Blob !== 'undefined' && value instanceof Blob;
      const isFile = typeof File !== 'undefined' && value instanceof File;
      if (isBlob || isFile) {
        return undefined; // rely on S3 references elsewhere
      }

      // Functions/symbols -> drop
      if (t === 'function' || t === 'symbol') return undefined;

      // Arrays
      if (Array.isArray(value)) {
        const arr = value.map(sanitize).filter((v) => v !== undefined);
        return arr;
      }

      // Objects
      if (t === 'object') {
        if (seen.has(value)) return undefined; // avoid circular
        seen.add(value);
        const out: any = {};
        for (const [k, v] of Object.entries(value)) {
          const sv = sanitize(v);
          if (sv !== undefined) out[k] = sv;
        }
        return out;
      }

      // Fallback: stringify
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    };

    return sanitize(input);
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
      this.checkAllTablesStatus();
      
      // Test connection
      this.testConnection().then(success => {
        if (success) {
          console.log('✅ DynamoDB separate tables service initialized successfully');
        }
      });
    } catch (error) {
      console.error('❌ Error initializing DynamoDB client:', error);
      this.client = null;
    }
  }

  // Initialize client with retry mechanism
  private async initializeClientWithRetry(): Promise<void> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        await this.initializeClient();
        if (this.client) {
          return; // Success
        }
      } catch (error) {
        console.warn(`⚠️ Attempt ${retries + 1} failed:`, error);
      }
      
      retries++;
      if (retries < maxRetries) {
        console.log(`🔄 Retrying in ${retries * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retries * 2000));
      }
    }
    
    console.error('❌ Failed to initialize DynamoDB client after all retries');
  }

  // Ensure DynamoDB client is ready before proceeding with operations
  private async ensureClientReady(): Promise<boolean> {
    // If client exists, verify token freshness; otherwise initialize
    if (!this.client) {
      await this.initializeClientWithRetry();
      return !!this.client;
    }

    // Proactively refresh if token near expiry (<=5 min)
    const isAuthOk = await this.checkAuthenticationStatus();
    if (!isAuthOk) {
      await this.initializeClientWithRetry();
    }
    return !!this.client;
  }

  // Safely pick unified additionalPeople from multiple possible inputs
  private pickAdditionalPeople(input: any): any | undefined {
    if (!input || typeof input !== 'object') return undefined;
    // Prefer camelCase, fall back to space variant used in some payloads
    return input.additionalPeople ?? input["Additional People"] ?? undefined;
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

  // Get current user's userId (sub from ID token)
  async getCurrentUserId(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      
      if (!session.tokens?.idToken) {
        console.warn('⚠️ No ID token available');
        return null;
      }
      
      const userId = session.tokens.idToken.payload?.sub;
      
      if (!userId) {
        console.warn('⚠️ No sub found in ID token');
        return null;
      }
      
      console.log('✅ Retrieved userId (sub):', userId);
      return userId;
    } catch (error) {
      console.error('❌ Error getting user ID:', error);
      return null;
    }
  }

  // Get current user's role
  async getCurrentUserRole(): Promise<string | null> {
    try {
      const userAttributes = await fetchUserAttributes();
      const role = userAttributes['custom:role'];
      
      if (!role) {
        console.warn('⚠️ No role found in user attributes');
        return null;
      }
      
      console.log('✅ Retrieved user role:', role);
      return role;
    } catch (error) {
      console.error('❌ Error getting user role:', error);
      return null;
    }
  }

  // Get current user's zoneinfo (fallback to sub only if zoneinfo is missing)
  async getCurrentUserZoneinfo(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.idToken) {
        console.error('❌ No valid authentication session to get user zoneinfo');
        return null;
      }

      const payload: any = session.tokens.idToken.payload || {};
      const zoneinfo: string | undefined = payload.zoneinfo || payload['custom:zoneinfo'];
      if (zoneinfo && typeof zoneinfo === 'string' && zoneinfo.trim()) {
        console.log(`✅ Retrieved user zoneinfo: ${zoneinfo}`);
        return zoneinfo;
      }

      // Fallback to sub only if zoneinfo not present
      const userSub = payload?.sub;
      if (userSub) {
        console.warn('⚠️ No zoneinfo in token; falling back to sub for zone mapping');
        return userSub;
      }

      console.error('❌ Neither zoneinfo nor sub available in ID token');
      return null;
    } catch (error) {
      console.error('❌ Error getting current user zoneinfo:', error);
      return null;
    }
  }

  // Generate application ID
  generateApplicationId(): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `APP-${timestamp}-${random}`;
  }

  // Test connection to all tables
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return false;
    }

    try {
      console.log('🧪 Testing connection to all tables...');
      
      for (const [tableKey, tableName] of Object.entries(this.tables)) {
        try {
          const command = new DescribeTableCommand({ TableName: tableName });
          const result = await this.client.send(command);
          console.log(`✅ Table ${tableKey} (${tableName}): ${result.Table?.TableStatus}`);
        } catch (error) {
          console.error(`❌ Table ${tableKey} (${tableName}) error:`, error instanceof Error ? error.message : String(error));
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error testing connection:', error);
      return false;
    }
  }

  // Check status of all tables
  private async checkAllTablesStatus(): Promise<void> {
    if (!this.client) return;

    try {
      console.log('📊 Checking status of all tables...');
      
      for (const [tableKey, tableName] of Object.entries(this.tables)) {
        try {
          const command = new DescribeTableCommand({ TableName: tableName });
          const result = await this.client.send(command);
          console.log(`📋 ${tableKey}: ${result.Table?.TableStatus} (${result.Table?.ItemCount || 0} items)`);
        } catch (error) {
          console.warn(`⚠️ Could not check table ${tableKey}:`, error instanceof Error ? error.message : String(error));
        }
      }
    } catch (error) {
      console.error('❌ Error checking table status:', error);
    }
  }

  // APPLICATION DATA METHODS

  // Reduce application data size to fit within DynamoDB limits
  private reduceApplicationDataSize(data: ApplicationData): ApplicationData {
    console.log('🔧 Reducing application data size...');
    
    const reduced = { ...data };
    
    // Aggressive reduction for webhook_responses - keep only essential data
    if (reduced.webhook_responses && typeof reduced.webhook_responses === 'object') {
      const webhookKeys = Object.keys(reduced.webhook_responses);
      if (webhookKeys.length > 3) {
        // Keep only the most recent 3 webhook responses with minimal data
        const sortedKeys = webhookKeys.sort().slice(-3);
        const reducedWebhooks: any = {};
        sortedKeys.forEach(key => {
          const webhook = reduced.webhook_responses[key];
          if (webhook && typeof webhook === 'object') {
            // Keep only essential fields
            reducedWebhooks[key] = {
              status: webhook.status || 'unknown',
              timestamp: webhook.timestamp || webhook.processingDate,
              documentType: webhook.documentType || 'unknown'
            };
          }
        });
        reduced.webhook_responses = reducedWebhooks;
        console.log('📉 Reduced webhook_responses from', webhookKeys.length, 'to', sortedKeys.length, 'entries (minimal data)');
      }
    }
    
    // Aggressive reduction for uploaded_files_metadata - keep only file names and basic info
    if (reduced.uploaded_files_metadata && typeof reduced.uploaded_files_metadata === 'object') {
      const fileKeys = Object.keys(reduced.uploaded_files_metadata);
      if (fileKeys.length > 5) {
        // Keep only the most recent 5 file entries with minimal metadata
        const sortedKeys = fileKeys.sort().slice(-5);
        const reducedFiles: any = {};
        sortedKeys.forEach(key => {
          const file = reduced.uploaded_files_metadata[key];
          if (file && typeof file === 'object') {
            // Keep only essential file info
            reducedFiles[key] = {
              filename: file.filename || key,
              size: file.size || 0,
              type: file.type || 'unknown',
              uploadedAt: file.uploadedAt || new Date().toISOString()
            };
          }
        });
        reduced.uploaded_files_metadata = reducedFiles;
        console.log('📉 Reduced uploaded_files_metadata from', fileKeys.length, 'to', sortedKeys.length, 'entries (minimal data)');
      }
    }
    
    // Aggressive reduction for application_info - remove large nested objects entirely
    if (reduced.application_info && typeof reduced.application_info === 'object') {
      const appInfo = { ...reduced.application_info };
      
      // Remove large arrays or objects that might be causing size issues
      // Keep "Additional PeopleCollection" intact so downstream systems can use it
      const fieldsToRemove = ['coApplicants', 'guarantors', 'occupants', 'bankRecords', 'documents'];
      fieldsToRemove.forEach(field => {
        if (appInfo[field]) {
          delete appInfo[field];
          console.log(`📉 Removed ${field} entirely from application_info`);
        }
      });
      
      // Keep only essential application fields
      const essentialFields = [
        'buildingAddress', 'apartmentNumber', 'apartmentType', 'monthlyRent', 
        'moveInDate', 'howDidYouHear', 'reference_id', 'zoneinfo',
        // Preserve the Additional People summary block
        'Additional People'
      ];
      const essentialAppInfo: any = {};
      essentialFields.forEach(field => {
        if (appInfo[field] !== undefined) {
          essentialAppInfo[field] = appInfo[field];
        }
      });
      
      reduced.application_info = essentialAppInfo;
      console.log('📉 Reduced application_info to essential fields only');
    }
    
    // Aggressive reduction for encrypted_documents - keep only document count
    if (reduced.encrypted_documents && typeof reduced.encrypted_documents === 'object') {
      const docKeys = Object.keys(reduced.encrypted_documents);
      if (docKeys.length > 0) {
        // Replace with just a count summary
        reduced.encrypted_documents = {
          documentCount: docKeys.length,
          lastUpdated: new Date().toISOString()
        };
        console.log('📉 Reduced encrypted_documents to count summary only');
      }
    }
    
    // Remove signatures entirely if they're large
    if (reduced.signatures && typeof reduced.signatures === 'object') {
      const sigSize = JSON.stringify(reduced.signatures).length;
      if (sigSize > 10000) { // If signatures are larger than 10KB
        reduced.signatures = {
          hasSignatures: true,
          signatureCount: Object.keys(reduced.signatures).length,
          lastUpdated: new Date().toISOString()
        };
        console.log('📉 Reduced signatures to summary only');
      }
    }
    
    console.log('✅ Application data size reduction completed');
    return reduced;
  }

  // Apply ultra-aggressive reduction for extremely large data
  private applyUltraAggressiveReduction(data: ApplicationData): ApplicationData {
    console.log('🔧 Applying ultra-aggressive data reduction...');
    
    const ultraReduced = { ...data };
    
    // Keep only the absolute minimum required fields
    const minimalData: ApplicationData = {
      userId: ultraReduced.userId,
      role: ultraReduced.role,
      appid: ultraReduced.appid,
      zoneinfo: ultraReduced.zoneinfo,
      current_step: ultraReduced.current_step,
      last_updated: ultraReduced.last_updated,
      status: ultraReduced.status,
      flow_type: ultraReduced.flow_type || 'separate_webhooks',
      webhook_flow_version: ultraReduced.webhook_flow_version || '2.0',
      
      // Minimal application_info with only essential fields (preserve Additional People)
      application_info: {
        buildingAddress: ultraReduced.application_info?.buildingAddress || 'Not specified',
        apartmentNumber: ultraReduced.application_info?.apartmentNumber || 'Not specified',
        monthlyRent: ultraReduced.application_info?.monthlyRent || 'Not specified',
        reference_id: ultraReduced.application_info?.reference_id || ultraReduced.appid,
        zoneinfo: ultraReduced.zoneinfo,
        ...(ultraReduced.application_info && (ultraReduced.application_info as any)["Additional People"]
          ? { "Additional People": (ultraReduced.application_info as any)["Additional People"] }
          : {})
      },
      
      // Minimal metadata
      uploaded_files_metadata: {
        fileCount: ultraReduced.uploaded_files_metadata ? Object.keys(ultraReduced.uploaded_files_metadata).length : 0,
        lastUpdated: new Date().toISOString()
      },
      
      // Minimal webhook responses
      webhook_responses: {
        responseCount: ultraReduced.webhook_responses ? Object.keys(ultraReduced.webhook_responses).length : 0,
        lastUpdated: new Date().toISOString()
      },
      
      // Minimal signatures
      signatures: {
        hasSignatures: !!(ultraReduced.signatures && Object.keys(ultraReduced.signatures).length > 0),
        signatureCount: ultraReduced.signatures ? Object.keys(ultraReduced.signatures).length : 0,
        lastUpdated: new Date().toISOString()
      },
      
      // Minimal encrypted documents
      encrypted_documents: {
        documentCount: ultraReduced.encrypted_documents ? Object.keys(ultraReduced.encrypted_documents).length : 0,
        lastUpdated: new Date().toISOString()
      },
      
      storage_mode: 'direct' as const
    };
    
    console.log('✅ Ultra-aggressive data reduction completed - keeping only essential fields');
    return minimalData;
  }

  // Save application data (overwrites existing if found)
  async saveApplicationData(data: Omit<ApplicationData, 'userId' | 'role' | 'appid' | 'zoneinfo'>): Promise<boolean> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return false;
    }

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ No userId available for current user');
        return false;
      }

      const role = await this.getCurrentUserRole();
      if (!role) {
        console.error('❌ No role available for current user');
        return false;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return false;
      }

      // Check for existing application data
      let existingApp = await this.getApplicationData();
      let appid: string;
      
      if (existingApp) {
        // Use existing appid to overwrite
        appid = existingApp.appid;
        console.log('🔄 Found existing application, overwriting with appid:', appid);
      } else {
        // Generate new appid for first-time submission
        appid = this.generateApplicationId();
        console.log('🆕 Creating new application with appid:', appid);
      }

      let applicationData: ApplicationData = this.sanitizeForDynamo({
        ...data,
        userId,
        role,
        appid,
        zoneinfo,
        // Keep original timestamp if overwriting (using last_updated as reference)
        last_updated: new Date().toISOString()
      });

      // Check data size and reduce if necessary
      const marshalledData = marshall(applicationData, { 
        removeUndefinedValues: true,
        convertClassInstanceToMap: true 
      });
      
      const dataSize = JSON.stringify(marshalledData).length;
        console.log('📏 Application data size:', dataSize, 'bytes (DynamoDB limit: 400KB)');
        
        if (dataSize > 400 * 1024) {
          console.warn('⚠️ Application data exceeds DynamoDB 400KB limit, reducing data size...');
        applicationData = this.reduceApplicationDataSize(applicationData);
        
        // Re-check size after reduction
        const reducedMarshalledData = marshall(applicationData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        });
        const reducedSize = JSON.stringify(reducedMarshalledData).length;
        console.log('📏 Reduced application data size:', reducedSize, 'bytes');
        
        if (reducedSize > 400 * 1024) {
          console.warn('⚠️ Application data still too large after first reduction, applying ultra-aggressive reduction...');
          applicationData = this.applyUltraAggressiveReduction(applicationData);
          
          // Final size check
          const ultraReducedMarshalledData = marshall(applicationData, { 
            removeUndefinedValues: true,
            convertClassInstanceToMap: true 
          });
          const ultraReducedSize = JSON.stringify(ultraReducedMarshalledData).length;
          console.log('📏 Ultra-reduced application data size:', ultraReducedSize, 'bytes');
          
          if (ultraReducedSize > 400 * 1024) {
            console.error('❌ Application data still too large after ultra-aggressive reduction:', ultraReducedSize, 'bytes');
            throw new Error(`Application data exceeds DynamoDB 400KB limit even after aggressive reduction: ${ultraReducedSize} bytes`);
          }
        }
      }

      const command = new PutItemCommand({
        TableName: this.tables.app_nyc,
        Item: marshall(applicationData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        })
      });

      const client = this.client as DynamoDBClient;
      await client.send(command);
      console.log('✅ Application data saved successfully with role:', role, 'appid:', appid);
      return true;
    } catch (error) {
      console.error('❌ Error saving application data:', error);
      return false;
    }
  }

  // Get application data by zoneinfo (scan since app_nyc uses appid as partition key)
  async getApplicationData(): Promise<ApplicationData | null> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return null;
    }

    try {
      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return null;
      }

      // Since app_nyc uses appid as partition key, we need to scan by zoneinfo
      const command = new ScanCommand({
        TableName: this.tables.app_nyc,
        FilterExpression: 'zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':zoneinfo': zoneinfo
        }, { convertClassInstanceToMap: true })
      });

      let result;
      try {
        result = await this.client.send(command);
      } catch (err: any) {
        if (err?.name === 'NotAuthorizedException' || err?.name === 'ExpiredTokenException') {
          console.warn('🔄 Auth error during getApplicationData; refreshing and retrying once...');
          await this.initializeClientWithRetry();
          result = await this.client!.send(command);
        } else {
          throw err;
        }
      }
      
      if (result.Items && result.Items.length > 0) {
        // Return the first (and should be only) application for this userId
        return unmarshall(result.Items[0]) as ApplicationData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting application data:', error);
      return null;
    }
  }

  // Get ALL applications for current user's zoneinfo
  async getApplicationsByZoneinfo(): Promise<ApplicationData[]> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return [];
    }

    try {
      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return [];
      }

      const command = new ScanCommand({
        TableName: this.tables.app_nyc,
        FilterExpression: 'zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':zoneinfo': zoneinfo
        }, { convertClassInstanceToMap: true })
      });

      let result;
      try {
        result = await this.client.send(command);
      } catch (err: any) {
        if (err?.name === 'NotAuthorizedException' || err?.name === 'ExpiredTokenException') {
          console.warn('🔄 Auth error during getApplicationsByZoneinfo; refreshing and retrying once...');
          await this.initializeClientWithRetry();
          result = await this.client!.send(command);
        } else {
          throw err;
        }
      }
      if (result.Items && result.Items.length > 0) {
        return result.Items.map(item => unmarshall(item) as ApplicationData);
      }
      return [];
    } catch (error) {
      console.error('❌ Error getting applications by zoneinfo:', error);
      return [];
    }
  }

  // Get application data by appid
  async getApplicationByAppId(appid: string): Promise<ApplicationData | null> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return null;
    }

    try {
      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return null;
      }

      const command = new ScanCommand({
        TableName: this.tables.app_nyc,
        FilterExpression: 'appid = :appid AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':appid': appid,
          ':zoneinfo': zoneinfo
        }, { convertClassInstanceToMap: true })
      });

      let result;
      try {
        result = await this.client.send(command);
      } catch (err: any) {
        if (err?.name === 'NotAuthorizedException' || err?.name === 'ExpiredTokenException') {
          console.warn('🔄 Auth error during getApplicationByAppId; refreshing and retrying once...');
          await this.initializeClientWithRetry();
          result = await this.client!.send(command);
        } else {
          throw err;
        }
      }
      
      if (result.Items && result.Items.length > 0) {
        // If multiple, pick the most recent by last_updated
        const items = result.Items.map(i => unmarshall(i) as ApplicationData);
        items.sort((a, b) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());
        return items[0];
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting application by appid:', error);
      return null;
    }
  }

  // APPLICANT DATA METHODS

  // Reduce applicant data size to fit within DynamoDB limits
  private reduceApplicantDataSize(data: ApplicantData): ApplicantData {
    console.log('🔧 Reducing applicant data size...');
    
    const reduced = { ...data };
    
    // Reduce webhookSummary size
    if (reduced.webhookSummary && typeof reduced.webhookSummary === 'object') {
      const webhookKeys = Object.keys(reduced.webhookSummary);
      if (webhookKeys.length > 10) {
        // Keep only the most recent 10 webhook responses
        const sortedKeys = webhookKeys.sort().slice(-10);
        const reducedWebhooks: any = {};
        sortedKeys.forEach(key => {
          reducedWebhooks[key] = reduced.webhookSummary[key];
        });
        reduced.webhookSummary = reducedWebhooks;
        console.log('📉 Reduced webhookSummary from', webhookKeys.length, 'to', sortedKeys.length, 'entries');
      }
    }
    
    // Reduce applicant_info size by removing large nested objects
    if (reduced.applicant_info && typeof reduced.applicant_info === 'object') {
      const appInfo = { ...reduced.applicant_info };
      
      // Remove large arrays or objects that might be causing size issues
      const fieldsToReduce = ['bankRecords', 'documents'];
      fieldsToReduce.forEach(field => {
        if (appInfo[field] && Array.isArray(appInfo[field]) && appInfo[field].length > 10) {
          appInfo[field] = appInfo[field].slice(0, 10);
          console.log(`📉 Reduced ${field} from ${appInfo[field].length + 10} to 10 entries`);
        }
      });
      
      reduced.applicant_info = appInfo;
    }
    
    // Reduce occupants size
    if (reduced.occupants && Array.isArray(reduced.occupants) && reduced.occupants.length > 10) {
      reduced.occupants = reduced.occupants.slice(0, 10);
      console.log('📉 Reduced occupants from', reduced.occupants.length + 10, 'to 10 entries');
    }
    
    console.log('✅ Applicant data size reduction completed');
    return reduced;
  }

  // Save applicant data
  async saveApplicantData(data: Omit<ApplicantData, 'userId' | 'role' | 'zoneinfo'>): Promise<boolean> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return false;
    }

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ No userId available for current user');
        return false;
      }

      const role = await this.getCurrentUserRole();
      if (!role) {
        console.error('❌ No role available for current user');
        return false;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return false;
      }

      // Attach current application appid if available
      let applicationAppid: string | undefined;
      try {
        const existingApp = await this.getApplicationData();
        applicationAppid = existingApp?.appid;
      } catch {}

      // Preserve existing timestamp if a draft already exists to avoid duplicate records
      const existingApplicant = await this.getApplicantData();
      let applicantData: ApplicantData = this.sanitizeForDynamo({
        ...data,
        // Normalize additionalPeople from either key variant
        additionalPeople: this.pickAdditionalPeople(data),
        userId,
        role,
        zoneinfo,
        appid: applicationAppid,
        timestamp: existingApplicant?.timestamp || new Date().toISOString(),
        last_updated: new Date().toISOString()
      });

      // Check data size and reduce if necessary
      const marshalledData = marshall(applicantData, { 
        removeUndefinedValues: true,
        convertClassInstanceToMap: true 
      });
      
      const dataSize = JSON.stringify(marshalledData).length;
        console.log('📏 Applicant data size:', dataSize, 'bytes (DynamoDB limit: 400KB)');
        
        if (dataSize > 400 * 1024) {
          console.warn('⚠️ Applicant data exceeds DynamoDB 400KB limit, reducing data size...');
        applicantData = this.reduceApplicantDataSize(applicantData);
        
        // Re-check size after reduction
        const reducedMarshalledData = marshall(applicantData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        });
        const reducedSize = JSON.stringify(reducedMarshalledData).length;
        console.log('📏 Reduced applicant data size:', reducedSize, 'bytes');
        
        if (reducedSize > 400 * 1024) {
          console.error('❌ Applicant data still too large after reduction:', reducedSize, 'bytes');
          throw new Error(`Applicant data exceeds DynamoDB 400KB limit: ${reducedSize} bytes`);
        }
      }

      const command = new PutItemCommand({
        TableName: this.tables.applicant_nyc,
        Item: marshall(applicantData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        })
      });

      await this.client.send(command);
      console.log('✅ Applicant data saved successfully with role:', role);
      return true;
    } catch (error) {
      console.error('❌ Error saving applicant data:', error);
      return false;
    }
  }

  // Save applicant data with co-applicants and guarantors (overwrites existing if found)
  async saveApplicantDataNew(data: Omit<ApplicantData, 'userId' | 'role' | 'zoneinfo'>, appid?: string): Promise<boolean> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return false;
    }

    try {
      const baseUserId = await this.getCurrentUserId();
      if (!baseUserId) {
        console.error('❌ No userId available for current user');
        return false;
      }

      const role = await this.getCurrentUserRole();
      if (!role) {
        console.error('❌ No role available for current user');
        return false;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return false;
      }

      // Attach current application appid if available
      let applicationAppid: string | undefined = appid;
      if (!applicationAppid) {
        try {
          const existingApp = await this.getApplicationData();
          applicationAppid = existingApp?.appid;
        } catch {}
      }

      // Check for existing applicant data
      const existingApplicant = await this.getApplicantData();
      
      // Use user's sub as userId for draft saving
      const uniqueUserId = baseUserId;

      // Get existing co-applicants and guarantors data to preserve them
      let existingCoApplicants: any[] = [];
      let existingGuarantors: any[] = [];
      
      if (existingApplicant) {
        existingCoApplicants = existingApplicant.co_applicants || [];
        existingGuarantors = existingApplicant.guarantors || [];
      }

      const applicantData: ApplicantData = this.sanitizeForDynamo({
        ...data,
        // Normalize additionalPeople from either key variant
        additionalPeople: this.pickAdditionalPeople(data),
        userId: uniqueUserId,
        role,
        zoneinfo,
        appid: applicationAppid,
        co_applicants: data.co_applicants || existingCoApplicants, // Include co-applicants data
        guarantors: data.guarantors || existingGuarantors, // Include guarantors data
        timestamp: existingApplicant?.timestamp || new Date().toISOString(), // Keep original timestamp if overwriting
        last_updated: new Date().toISOString()
      });

      const command = new PutItemCommand({
        TableName: this.tables.applicant_nyc,
        Item: marshall(applicantData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        })
      });

      await this.client.send(command);
      console.log('✅ Applicant data with co-applicants and guarantors saved successfully (overwritten existing if found) with userId:', uniqueUserId);
      return true;
    } catch (error) {
      console.error('❌ Error saving applicant data:', error);
      return false;
    }
  }

  // Get applicant data
  async getApplicantData(): Promise<ApplicantData | null> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return null;
    }

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ No userId available for current user');
        return null;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return null;
      }

      // Scan by userId and filter by zoneinfo since we're using timestamp as sort key
      const command = new ScanCommand({
        TableName: this.tables.applicant_nyc,
        FilterExpression: 'userId = :userId AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
          ':zoneinfo': zoneinfo
        }, { convertClassInstanceToMap: true })
      });

      const result = await this.client.send(command);
      
      if (result.Items && result.Items.length > 0) {
        // Return the most recent record
        const items = result.Items.map(item => unmarshall(item) as ApplicantData);
        items.sort((a, b) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());
        return items[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting applicant data:', error);
      return null;
    }
  }

  // Get applicant_nyc record by appid (scan by appid)
  async getApplicantByAppId(appid: string): Promise<ApplicantData | null> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return null;
    }

    try {
      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return null;
      }

      const command = new ScanCommand({
        TableName: this.tables.applicant_nyc,
        FilterExpression: 'appid = :appid AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':appid': appid,
          ':zoneinfo': zoneinfo,
        }, { convertClassInstanceToMap: true })
      });

      const result = await this.client.send(command);
      if (result.Items && result.Items.length > 0) {
        // If multiple, pick the most recent by last_updated
        const items = result.Items.map(i => unmarshall(i) as ApplicantData);
        items.sort((a, b) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());
        return items[0];
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting applicant by appid:', error);
      return null;
    }
  }

  // CO-APPLICANT DATA METHODS

  // Reduce co-applicant data size to fit within DynamoDB limits
  private reduceCoApplicantDataSize(data: CoApplicantData): CoApplicantData {
    console.log('🔧 Reducing co-applicant data size...');
    
    const reduced = { ...data };
    
    // Reduce webhookSummary size
    if (reduced.webhookSummary && typeof reduced.webhookSummary === 'object') {
      const webhookKeys = Object.keys(reduced.webhookSummary);
      if (webhookKeys.length > 10) {
        // Keep only the most recent 10 webhook responses
        const sortedKeys = webhookKeys.sort().slice(-10);
        const reducedWebhooks: any = {};
        sortedKeys.forEach(key => {
          reducedWebhooks[key] = reduced.webhookSummary[key];
        });
        reduced.webhookSummary = reducedWebhooks;
        console.log('📉 Reduced webhookSummary from', webhookKeys.length, 'to', sortedKeys.length, 'entries');
      }
    }
    
    // Reduce coapplicant_info size by removing large nested objects
    if (reduced.coapplicant_info && typeof reduced.coapplicant_info === 'object') {
      const coAppInfo = { ...reduced.coapplicant_info };
      
      // Remove large arrays or objects that might be causing size issues
      const fieldsToReduce = ['bankRecords', 'documents'];
      fieldsToReduce.forEach(field => {
        if (coAppInfo[field] && Array.isArray(coAppInfo[field]) && coAppInfo[field].length > 10) {
          coAppInfo[field] = coAppInfo[field].slice(0, 10);
          console.log(`📉 Reduced ${field} from ${coAppInfo[field].length + 10} to 10 entries`);
        }
      });
      
      reduced.coapplicant_info = coAppInfo;
    }
    
    // Note: CoApplicantData doesn't have occupants property
    
    console.log('✅ Co-applicant data size reduction completed');
    return reduced;
  }

  // Save co-applicant data
  async saveCoApplicantData(data: Omit<CoApplicantData, 'userId' | 'role' | 'zoneinfo' | 'appid' | 'timestamp' | 'current_step'>, appid?: string): Promise<boolean> {
    if (!(await this.ensureClientReady())) {
      console.error('❌ DynamoDB client not initialized');
      return false;
    }
    const client = this.client as DynamoDBClient;

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ No userId available for current user');
        return false;
      }

      const role = await this.getCurrentUserRole();
      if (!role) {
        console.error('❌ No role available for current user');
        return false;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return false;
      }

      // If appid is not provided, try to get it from existing application data
      let applicationAppid = appid;
      if (!applicationAppid) {
        const existingApp = await this.getApplicationData();
        applicationAppid = existingApp?.appid;
        if (!applicationAppid) {
          // Generate an appid if none exists so co-applicant submission doesn't fail
          applicationAppid = this.generateApplicationId();
          console.warn('⚠️ No existing appid found; generating new appid for co-applicant:', applicationAppid);
        }
      }

      let coApplicantData: CoApplicantData = this.sanitizeForDynamo({
        ...data,
        userId,
        role,
        zoneinfo,
        appid: applicationAppid,
        current_step: (data as any).current_step || 0,
        timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });

      // Check data size and reduce if necessary
      const marshalledData = marshall(coApplicantData, { 
        removeUndefinedValues: true,
        convertClassInstanceToMap: true 
      });
      
      const dataSize = JSON.stringify(marshalledData).length;
        console.log('📏 Co-applicant data size:', dataSize, 'bytes (DynamoDB limit: 400KB)');
        
        if (dataSize > 400 * 1024) {
          console.warn('⚠️ Co-applicant data exceeds DynamoDB 400KB limit, reducing data size...');
        coApplicantData = this.reduceCoApplicantDataSize(coApplicantData);
        
        // Re-check size after reduction
        const reducedMarshalledData = marshall(coApplicantData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        });
        const reducedSize = JSON.stringify(reducedMarshalledData).length;
        console.log('📏 Reduced co-applicant data size:', reducedSize, 'bytes');
        
        if (reducedSize > 400 * 1024) {
          console.error('❌ Co-applicant data still too large after reduction:', reducedSize, 'bytes');
          throw new Error(`Co-applicant data exceeds DynamoDB 400KB limit: ${reducedSize} bytes`);
        }
      }

      const command = new PutItemCommand({
        TableName: this.tables.coapplicants,
        Item: marshall(coApplicantData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        })
      });

      await client.send(command);
      console.log('✅ Co-applicant data saved successfully with appid:', applicationAppid, 'and role:', role);
      return true;
    } catch (error) {
      console.error('❌ Error saving co-applicant data:', error);
      return false;
    }
  }

  // Get co-applicant data
  async getCoApplicantData(): Promise<CoApplicantData | null> {
    if (!(await this.ensureClientReady())) {
      console.error('❌ DynamoDB client not initialized');
      return null;
    }
    const client = this.client as DynamoDBClient;

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ No userId available for current user');
        return null;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return null;
      }

      // Scan by userId and filter by zoneinfo since we're using timestamp as sort key
      const command = new ScanCommand({
        TableName: this.tables.coapplicants,
        FilterExpression: 'userId = :userId AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
          ':zoneinfo': zoneinfo
        }, { convertClassInstanceToMap: true })
      });

      const result = await client.send(command);
      
      if (result.Items && result.Items.length > 0) {
        // Return the most recent record
        const items = result.Items.map((item: any) => unmarshall(item) as CoApplicantData);
        items.sort((a: CoApplicantData, b: CoApplicantData) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());
        return items[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting co-applicant data:', error);
      return null;
    }
  }

  // Save co-applicant as NEW record by generating unique userId suffix
  async saveCoApplicantDataNew(data: Omit<CoApplicantData, 'userId' | 'role' | 'zoneinfo' | 'appid' | 'timestamp' | 'current_step'>, appid?: string): Promise<boolean> {
    if (!(await this.ensureClientReady())) {
      console.error('❌ DynamoDB client not initialized');
      return false;
    }
    const client = this.client as DynamoDBClient;

    try {
      const baseUserId = await this.getCurrentUserId();
      if (!baseUserId) {
        console.error('❌ No userId available for current user');
        return false;
      }

      const role = await this.getCurrentUserRole();
      if (!role) {
        console.error('❌ No role available for current user');
        return false;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return false;
      }

      let applicationAppid = appid;
      if (!applicationAppid) {
        const existingApp = await this.getApplicationData();
        applicationAppid = existingApp?.appid;
        if (!applicationAppid) {
          console.error('❌ No appid available for co-applicant data');
          return false;
        }
      }

      // Use the logged-in user's sub for userId (no suffix)
      const uniqueUserId = baseUserId;

      // Preserve existing timestamp if a draft already exists to avoid duplicate records
      const existingCoApplicant = await this.getCoApplicantData();
      
      console.log('🔍 Co-applicant data before sanitization:', {
        hasWebhookSummary: !!data.webhookSummary,
        webhookSummary: data.webhookSummary,
        webhookSummaryKeys: data.webhookSummary ? Object.keys(data.webhookSummary) : [],
        webhookSummaryTotalResponses: data.webhookSummary?.totalResponses || 0
      });
      console.log('👥 Input data.coapplicant_info before normalization:', (data as any).coapplicant_info);
      console.log('👥 Input data.coapplicant_info.bankRecords:', (data as any).coapplicant_info?.bankRecords);
      
      // Normalize coapplicant_info while preserving bankRecords
      const normalizedCoApplicantInfo = this.normalizePersonInfo((data as any).coapplicant_info);
      console.log('👥 Normalized coapplicant_info:', normalizedCoApplicantInfo);
      console.log('👥 Normalized coapplicant_info.bankRecords:', normalizedCoApplicantInfo?.bankRecords);
      
      const coApplicantData: CoApplicantData = this.sanitizeForDynamo({
        ...data,
        coapplicant_info: normalizedCoApplicantInfo,
        userId: uniqueUserId,
        role,
        zoneinfo,
        appid: applicationAppid,
        current_step: (data as any).current_step || 0,
        timestamp: existingCoApplicant?.timestamp || new Date().toISOString(),
        // Keep original timestamp if overwriting (using last_updated as reference)
        last_updated: new Date().toISOString()
      });
      
      console.log('🔍 Co-applicant data after sanitization:', {
        hasWebhookSummary: !!coApplicantData.webhookSummary,
        webhookSummary: coApplicantData.webhookSummary,
        webhookSummaryKeys: coApplicantData.webhookSummary ? Object.keys(coApplicantData.webhookSummary) : [],
        webhookSummaryTotalResponses: coApplicantData.webhookSummary?.totalResponses || 0
      });
      console.log('👥 coapplicant_info after sanitization:', coApplicantData.coapplicant_info);
      console.log('👥 coapplicant_info.bankRecords after sanitization:', coApplicantData.coapplicant_info?.bankRecords);

      // Check data size and reduce if necessary
      const marshalledData = marshall(coApplicantData, { 
        removeUndefinedValues: true,
        convertClassInstanceToMap: true 
      });
      
      const dataSize = JSON.stringify(marshalledData).length;
      console.log('📏 Co-applicant data size:', dataSize, 'bytes (DynamoDB limit: 400KB)');
      
      if (dataSize > 400 * 1024) {
        console.warn('⚠️ Co-applicant data exceeds DynamoDB 400KB limit, reducing data size...');
        const reducedData = this.reduceCoApplicantDataSize(coApplicantData);
        
        // Re-check size after reduction
        const reducedMarshalledData = marshall(reducedData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        });
        const reducedDataSize = JSON.stringify(reducedMarshalledData).length;
        console.log('📏 Co-applicant data size after reduction:', reducedDataSize, 'bytes');
        
        const command = new PutItemCommand({
          TableName: this.tables.coapplicants,
          Item: reducedMarshalledData
        });
        
        await client.send(command);
        console.log('✅ Co-applicant data saved successfully (reduced size) with userId:', uniqueUserId);
        return true;
      }

      const command = new PutItemCommand({
        TableName: this.tables.coapplicants,
        Item: marshalledData
      });

      await client.send(command);
      console.log('✅ Co-applicant data saved successfully (overwritten existing if found) with userId:', uniqueUserId);
      return true;
    } catch (error) {
      console.error('❌ Error saving co-applicant data:', error);
      return false;
    }
  }

  // List all co-applicants for the current application (by appid within same zone)
  async getCoApplicantsByAppId(appid?: string): Promise<CoApplicantData[]> {
    if (!(await this.ensureClientReady())) {
      console.error('❌ DynamoDB client not initialized');
      return [];
    }
    const client = this.client as DynamoDBClient;

    try {
      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return [];
      }

      let targetAppId = appid;
      if (!targetAppId) {
        const app = await this.getApplicationData();
        targetAppId = app?.appid;
      }
      if (!targetAppId) {
        console.warn('⚠️ No appid available to list co-applicants');
        return [];
      }

      // Scan by appid and filter by zoneinfo since we're using timestamp as sort key
      const command = new ScanCommand({
        TableName: this.tables.coapplicants,
        FilterExpression: 'appid = :appid AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':appid': targetAppId,
          ':zoneinfo': zoneinfo,
        }, { convertClassInstanceToMap: true })
      });

      const result = await client.send(command);
      const items = (result.Items || []).map((item: any) => unmarshall(item) as CoApplicantData);
      // Sort by timestamp (most recent first)
      items.sort((a: CoApplicantData, b: CoApplicantData) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());
      return items;
    } catch (error) {
      console.error('❌ Error listing co-applicants by appid:', error);
      return [];
    }
  }

  // List all co-applicant records for the current userId (including suffixed IDs)
  async getAllCoApplicantsForCurrentUser(): Promise<CoApplicantData[]> {
    if (!(await this.ensureClientReady())) {
      console.error('❌ DynamoDB client not initialized');
      return [];
    }
    const client = this.client as DynamoDBClient;

    try {
      const baseUserId = await this.getCurrentUserId();
      if (!baseUserId) {
        console.error('❌ No userId available for current user');
        return [];
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return [];
      }

      // Scan coapplicants table for any records that match:
      // - exact userId match, or
      // - suffixed IDs created by saveCoApplicantDataNew ("<base>-co-<ts>")
      const command = new ScanCommand({
        TableName: this.tables.coapplicants,
        FilterExpression: 'zoneinfo = :zoneinfo AND (userId = :userId OR begins_with(userId, :userIdCoPrefix))',
        ExpressionAttributeValues: marshall({
          ':zoneinfo': zoneinfo,
          ':userId': baseUserId,
          ':userIdCoPrefix': `${baseUserId}`
        }, { convertClassInstanceToMap: true })
      });

      const result = await client.send(command);
      const items = (result.Items || []).map((item: any) => unmarshall(item) as CoApplicantData);
      // Sort by timestamp (most recent first)
      items.sort((a: CoApplicantData, b: CoApplicantData) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());
      return items;
    } catch (error) {
      console.error('❌ Error listing co-applicants for current user:', error);
      return [];
    }
  }

  // GUARANTOR DATA METHODS

  // Reduce guarantor data size to fit within DynamoDB limits
  private reduceGuarantorDataSize(data: GuarantorData): GuarantorData {
    console.log('🔧 Reducing guarantor data size...');
    
    const reduced = { ...data };
    
    // Reduce webhookSummary size
    if (reduced.webhookSummary && typeof reduced.webhookSummary === 'object') {
      const webhookKeys = Object.keys(reduced.webhookSummary);
      if (webhookKeys.length > 10) {
        // Keep only the most recent 10 webhook responses
        const sortedKeys = webhookKeys.sort().slice(-10);
        const reducedWebhooks: any = {};
        sortedKeys.forEach(key => {
          reducedWebhooks[key] = reduced.webhookSummary[key];
        });
        reduced.webhookSummary = reducedWebhooks;
        console.log('📉 Reduced webhookSummary from', webhookKeys.length, 'to', sortedKeys.length, 'entries');
      }
    }
    
    // Reduce guarantor_info size by removing large nested objects
    if (reduced.guarantor_info && typeof reduced.guarantor_info === 'object') {
      const guarInfo = { ...reduced.guarantor_info };
      
      // Remove large arrays or objects that might be causing size issues
      const fieldsToReduce = ['bankRecords', 'documents'];
      fieldsToReduce.forEach(field => {
        if (guarInfo[field] && Array.isArray(guarInfo[field]) && guarInfo[field].length > 10) {
          guarInfo[field] = guarInfo[field].slice(0, 10);
          console.log(`📉 Reduced ${field} from ${guarInfo[field].length + 10} to 10 entries`);
        }
      });
      
      reduced.guarantor_info = guarInfo;
    }
    
    // Note: GuarantorData doesn't have occupants property
    
    console.log('✅ Guarantor data size reduction completed');
    return reduced;
  }

  // Save guarantor data
  async saveGuarantorData(data: Omit<GuarantorData, 'userId' | 'role' | 'zoneinfo' | 'appid' | 'timestamp' | 'current_step'>, appid?: string): Promise<boolean> {
    if (!(await this.ensureClientReady())) {
      console.error('❌ DynamoDB client not initialized');
      return false;
    }
    const client = this.client as DynamoDBClient;

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ No userId available for current user');
        return false;
      }

      const role = await this.getCurrentUserRole();
      if (!role) {
        console.error('❌ No role available for current user');
        return false;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return false;
      }

      // If appid is not provided, try to get it from existing application data
      let applicationAppid = appid;
      if (!applicationAppid) {
        const existingApp = await this.getApplicationData();
        applicationAppid = existingApp?.appid;
        if (!applicationAppid) {
          // Generate an appid if none exists so guarantor submission doesn't fail
          applicationAppid = this.generateApplicationId();
          console.warn('⚠️ No existing appid found; generating new appid for guarantor:', applicationAppid);
        }
      }

      let guarantorData: GuarantorData = this.sanitizeForDynamo({
        ...data,
        userId,
        role,
        zoneinfo,
        appid: applicationAppid,
        current_step: (data as any).current_step || 0,
        timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });

      // Check data size and reduce if necessary
      const marshalledData = marshall(guarantorData, { 
        removeUndefinedValues: true,
        convertClassInstanceToMap: true 
      });
      
      const dataSize = JSON.stringify(marshalledData).length;
        console.log('📏 Guarantor data size:', dataSize, 'bytes (DynamoDB limit: 400KB)');
        
        if (dataSize > 400 * 1024) {
          console.warn('⚠️ Guarantor data exceeds DynamoDB 400KB limit, reducing data size...');
        guarantorData = this.reduceGuarantorDataSize(guarantorData);
        
        // Re-check size after reduction
        const reducedMarshalledData = marshall(guarantorData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        });
        const reducedSize = JSON.stringify(reducedMarshalledData).length;
        console.log('📏 Reduced guarantor data size:', reducedSize, 'bytes');
        
        if (reducedSize > 400 * 1024) {
          console.error('❌ Guarantor data still too large after reduction:', reducedSize, 'bytes');
          throw new Error(`Guarantor data exceeds DynamoDB 400KB limit: ${reducedSize} bytes`);
        }
      }

      const command = new PutItemCommand({
        TableName: this.tables.guarantors,
        Item: marshall(guarantorData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        })
      });

      await client.send(command);
      console.log('✅ Guarantor data saved successfully with appid:', applicationAppid, 'and role:', role);
      return true;
    } catch (error) {
      console.error('❌ Error saving guarantor data:', error);
      return false;
    }
  }

  // Get guarantor data
  async getGuarantorData(): Promise<GuarantorData | null> {
    if (!(await this.ensureClientReady())) {
      console.error('❌ DynamoDB client not initialized');
      return null;
    }
    const client = this.client as DynamoDBClient;

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ No userId available for current user');
        return null;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return null;
      }

      // Scan by userId and filter by zoneinfo since we're using timestamp as sort key
      const command = new ScanCommand({
        TableName: this.tables.guarantors,
        FilterExpression: 'userId = :userId AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
          ':zoneinfo': zoneinfo
        }, { convertClassInstanceToMap: true })
      });

      const result = await client.send(command);
      
      if (result.Items && result.Items.length > 0) {
        // Return the most recent record
        const items = result.Items.map(item => unmarshall(item) as GuarantorData);
        items.sort((a, b) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());
        return items[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting guarantor data:', error);
      return null;
    }
  }

  // Save guarantor data (overwrites existing if found)
  async saveGuarantorDataNew(data: Omit<GuarantorData, 'userId' | 'role' | 'zoneinfo' | 'appid' | 'timestamp' | 'current_step'>, appid?: string): Promise<boolean> {
    console.log('🛡️ saveGuarantorDataNew called with data:', data);
    console.log('🛡️ appid parameter:', appid);
    
    if (!(await this.ensureClientReady())) {
      console.error('❌ DynamoDB client not initialized');
      return false;
    }
    const client = this.client as DynamoDBClient;

    try {
      const baseUserId = await this.getCurrentUserId();
      if (!baseUserId) {
        console.error('❌ No userId available for current user');
        return false;
      }

      const role = await this.getCurrentUserRole();
      if (!role) {
        console.error('❌ No role available for current user');
        return false;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return false;
      }

      let applicationAppid = appid;
      if (!applicationAppid) {
        const existingApp = await this.getApplicationData();
        applicationAppid = existingApp?.appid;
        if (!applicationAppid) {
          // Fallback: generate an appid so guarantor submission doesn't fail
          applicationAppid = this.generateApplicationId();
          console.warn('⚠️ No appid available for guarantor data; generating new appid:', applicationAppid);
        }
      }

      console.log('🛡️ Using userId:', baseUserId, 'role:', role, 'zoneinfo:', zoneinfo, 'appid:', applicationAppid);
      console.log('🛡️ Input data.guarantor_info before normalization:', (data as any).guarantor_info);
      console.log('🛡️ Input data.guarantor_info.bankRecords:', (data as any).guarantor_info?.bankRecords);

      // Use the logged-in user's sub for userId (no suffix)
      const uniqueUserId = baseUserId;

      // Preserve existing timestamp if a draft already exists to avoid duplicate records
      const existingGuarantor = await this.getGuarantorData();
      
      // Normalize guarantor_info while preserving bankRecords
      const normalizedGuarantorInfo = this.normalizePersonInfo((data as any).guarantor_info);
      console.log('🛡️ Normalized guarantor_info:', normalizedGuarantorInfo);
      console.log('🛡️ Normalized guarantor_info.bankRecords:', normalizedGuarantorInfo?.bankRecords);
      
      const guarantorData: GuarantorData = this.sanitizeForDynamo({
        ...data,
        guarantor_info: normalizedGuarantorInfo,
        userId: uniqueUserId,
        role,
        zoneinfo,
        appid: applicationAppid,
        current_step: (data as any).current_step || 0,
        timestamp: existingGuarantor?.timestamp || new Date().toISOString(),
        // Keep original timestamp if overwriting (using last_updated as reference)
        last_updated: new Date().toISOString()
      });

      console.log('🛡️ Final guarantorData to save:', guarantorData);
      console.log('🛡️ guarantor_info:', guarantorData.guarantor_info);
      console.log('🛡️ guarantor_info.bankRecords:', guarantorData.guarantor_info?.bankRecords);
      console.log('🛡️ guarantor_info.bankRecords type:', typeof guarantorData.guarantor_info?.bankRecords);
      console.log('🛡️ guarantor_info.bankRecords isArray:', Array.isArray(guarantorData.guarantor_info?.bankRecords));

      const marshalledItem = marshall(guarantorData, { removeUndefinedValues: true, convertClassInstanceToMap: true });
      console.log('🛡️ Marshalled item:', marshalledItem);
      console.log('🛡️ Marshalled guarantor_info:', marshalledItem.guarantor_info);

      const command = new PutItemCommand({
        TableName: this.tables.guarantors,
        Item: marshalledItem
      });

      await client.send(command);
      console.log('✅ Guarantor data saved successfully (overwritten existing if found) with userId:', uniqueUserId);
      return true;
    } catch (error) {
      console.error('❌ Error saving guarantor data:', error);
      return false;
    }
  }

  // List all guarantors for the current application (by appid within same zone)
  async getGuarantorsByAppId(appid?: string): Promise<GuarantorData[]> {
    if (!(await this.ensureClientReady())) {
      console.error('❌ DynamoDB client not initialized');
      return [];
    }

    try {
      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return [];
      }

      let targetAppId = appid;
      if (!targetAppId) {
        const app = await this.getApplicationData();
        targetAppId = app?.appid;
      }
      if (!targetAppId) {
        console.warn('⚠️ No appid available to list guarantors');
        return [];
      }

      // Scan by appid and filter by zoneinfo since we're using timestamp as sort key
      const command = new ScanCommand({
        TableName: this.tables.guarantors,
        FilterExpression: 'appid = :appid AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':appid': targetAppId,
          ':zoneinfo': zoneinfo,
        }, { convertClassInstanceToMap: true })
      });

      const client = this.client as DynamoDBClient;
      const result = await client.send(command);
      const items = (result.Items || []).map((item: any) => unmarshall(item) as GuarantorData);
      // Sort by timestamp (most recent first)
      items.sort((a: GuarantorData, b: GuarantorData) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime());
      return items;
    } catch (error) {
      console.error('❌ Error listing guarantors by appid:', error);
      return [];
    }
  }

  // UTILITY METHODS

  // Get application data by zoneinfo (scan since app_nyc uses appid as partition key)
  async getApplicationDataByUserId(): Promise<ApplicationData | null> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return null;
    }

    try {
      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.log('❌ No zoneinfo available for current user');
        return null;
      }

      // Since app_nyc uses appid as partition key, we need to scan by zoneinfo
      const command = new ScanCommand({
        TableName: this.tables.app_nyc,
        FilterExpression: 'zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':zoneinfo': zoneinfo
        }, { convertClassInstanceToMap: true })
      });

      const result = await this.client.send(command);
      
      if (result.Items && result.Items.length > 0) {
        // Return the first (and should be only) application for this userId
        return unmarshall(result.Items[0]) as ApplicationData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting application data by userId:', error);
      return null;
    }
  }

  // Get all data for current user across all tables
  async getAllUserData(): Promise<{
    application?: ApplicationData;
    applicant?: ApplicantData;
    coApplicant?: CoApplicantData;
    guarantor?: GuarantorData;
  }> {
    const [application, applicant, coApplicant, guarantor] = await Promise.all([
      this.getApplicationData(), // Use the new method that gets by userId
      this.getApplicantData(),
      this.getCoApplicantData(),
      this.getGuarantorData()
    ]);

    return {
      application: application || undefined,
      applicant: applicant || undefined,
      coApplicant: coApplicant || undefined,
      guarantor: guarantor || undefined
    };
  }

  // Delete all data for current user
  async deleteAllUserData(): Promise<boolean> {
    if (!this.client) {
      console.error('❌ DynamoDB client not initialized');
      return false;
    }

    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.error('❌ No userId available for current user');
        return false;
      }

      const zoneinfo = await this.getCurrentUserZoneinfo();
      if (!zoneinfo) {
        console.error('❌ No zoneinfo available for current user');
        return false;
      }

      // For app_nyc, we need to find the appid first since it uses appid as partition key
      const applicationData = await this.getApplicationData();
      const appid = applicationData?.appid;

      // Since we're using timestamp as sort key, we need to scan and delete all matching records
      const deletePromises = [];

      // Delete from applicant_nyc - scan for all records with this userId and zoneinfo
      const applicantScan = new ScanCommand({
        TableName: this.tables.applicant_nyc,
        FilterExpression: 'userId = :userId AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
          ':zoneinfo': zoneinfo
        }, { convertClassInstanceToMap: true })
      });
      const applicantResult = await this.client.send(applicantScan);
      for (const item of applicantResult.Items || []) {
        const record = unmarshall(item);
        deletePromises.push(
          this.client.send(new DeleteItemCommand({
            TableName: this.tables.applicant_nyc,
            Key: marshall({ userId: record.userId, timestamp: record.timestamp })
          }))
        );
      }

      // Delete from coapplicants - scan for all records with this userId and zoneinfo
      const coApplicantScan = new ScanCommand({
        TableName: this.tables.coapplicants,
        FilterExpression: 'userId = :userId AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
          ':zoneinfo': zoneinfo
        }, { convertClassInstanceToMap: true })
      });
      const coApplicantResult = await this.client.send(coApplicantScan);
      for (const item of coApplicantResult.Items || []) {
        const record = unmarshall(item);
        deletePromises.push(
          this.client.send(new DeleteItemCommand({
            TableName: this.tables.coapplicants,
            Key: marshall({ userId: record.userId, timestamp: record.timestamp })
          }))
        );
      }

      // Delete from guarantors - scan for all records with this userId and zoneinfo
      const guarantorScan = new ScanCommand({
        TableName: this.tables.guarantors,
        FilterExpression: 'userId = :userId AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
          ':zoneinfo': zoneinfo
        }, { convertClassInstanceToMap: true })
      });
      const guarantorResult = await this.client.send(guarantorScan);
      for (const item of guarantorResult.Items || []) {
        const record = unmarshall(item);
        deletePromises.push(
          this.client.send(new DeleteItemCommand({
            TableName: this.tables.guarantors,
            Key: marshall({ userId: record.userId, timestamp: record.timestamp })
          }))
        );
      }

      // Add app_nyc deletion if we have the appid (this still uses zoneinfo as sort key)
      if (appid) {
        deletePromises.push(
          this.client.send(new DeleteItemCommand({
            TableName: this.tables.app_nyc,
            Key: marshall({ appid, zoneinfo })
          }))
        );
      }

      await Promise.all(deletePromises);
      console.log('✅ All user data deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting user data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dynamoDBSeparateTablesService = new DynamoDBSeparateTablesService();

// Export utility functions
export const dynamoDBSeparateTablesUtils = {
  async saveApplicationData(data: Omit<ApplicationData, 'userId' | 'role' | 'appid' | 'zoneinfo'>): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveApplicationData(data);
  },
  
  async getApplicationData(): Promise<ApplicationData | null> {
    return dynamoDBSeparateTablesService.getApplicationData();
  },
  
  async getApplicationDataByUserId(): Promise<ApplicationData | null> {
    return dynamoDBSeparateTablesService.getApplicationDataByUserId();
  },

  async getApplicationsByZoneinfo(): Promise<ApplicationData[]> {
    return dynamoDBSeparateTablesService.getApplicationsByZoneinfo();
  },
  
  async getApplicationByAppId(appid: string): Promise<ApplicationData | null> {
    return dynamoDBSeparateTablesService.getApplicationByAppId(appid);
  },
  
  async getApplicationDataByZoneinfo(): Promise<ApplicationData | null> {
    return dynamoDBSeparateTablesService.getApplicationDataByUserId();
  },
  
  async saveApplicantData(data: Omit<ApplicantData, 'userId' | 'role' | 'zoneinfo'>): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveApplicantData(data);
  },
  
  async getApplicantData(): Promise<ApplicantData | null> {
    return dynamoDBSeparateTablesService.getApplicantData();
  },
  
  async getApplicantByAppId(appid: string): Promise<ApplicantData | null> {
    return dynamoDBSeparateTablesService.getApplicantByAppId(appid);
  },
  
  async saveApplicantDataNew(data: Omit<ApplicantData, 'userId' | 'role' | 'zoneinfo'>, appid?: string): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveApplicantDataNew(data, appid);
  },
  
  async saveCoApplicantData(data: Omit<CoApplicantData, 'userId' | 'role' | 'zoneinfo' | 'appid' | 'timestamp' | 'current_step'>, appid?: string): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveCoApplicantData(data, appid);
  },
  
  async getCoApplicantData(): Promise<CoApplicantData | null> {
    return dynamoDBSeparateTablesService.getCoApplicantData();
  },
  
  async getCoApplicantsByAppId(appid?: string): Promise<CoApplicantData[]> {
    return dynamoDBSeparateTablesService.getCoApplicantsByAppId(appid);
  },
  
  async getAllCoApplicantsForCurrentUser(): Promise<CoApplicantData[]> {
    return dynamoDBSeparateTablesService.getAllCoApplicantsForCurrentUser();
  },
  
  async saveGuarantorData(data: Omit<GuarantorData, 'userId' | 'role' | 'zoneinfo' | 'appid'>, appid?: string): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveGuarantorData(data as any, appid);
  },
  
  async getGuarantorData(): Promise<GuarantorData | null> {
    return dynamoDBSeparateTablesService.getGuarantorData();
  },
  
  async saveCoApplicantDataNew(data: Omit<CoApplicantData, 'userId' | 'role' | 'zoneinfo' | 'appid' | 'timestamp' | 'current_step'>, appid?: string): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveCoApplicantDataNew(data, appid);
  },
  
  async saveGuarantorDataNew(data: Omit<GuarantorData, 'userId' | 'role' | 'zoneinfo' | 'appid' | 'timestamp'>, appid?: string): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveGuarantorDataNew(data as any, appid);
  },
  
  async getGuarantorsByAppId(appid?: string): Promise<GuarantorData[]> {
    return dynamoDBSeparateTablesService.getGuarantorsByAppId(appid);
  },
  
  async getAllUserData() {
    return dynamoDBSeparateTablesService.getAllUserData();
  },
  
  async deleteAllUserData(): Promise<boolean> {
    return dynamoDBSeparateTablesService.deleteAllUserData();
  },
  
  // Expose current userId for client filtering/diagnostics
  async getCurrentUserId(): Promise<string | null> {
    return dynamoDBSeparateTablesService.getCurrentUserId();
  }
};
