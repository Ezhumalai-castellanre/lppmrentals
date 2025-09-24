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

// Primary Applicant Interface
export interface ApplicantData {
  userId: string; // User's ID
  role: string; // User's role (applicant, coapplicant, guarantor, etc.)
  zoneinfo: string; // User's zoneinfo
  appid?: string; // Link to main application
  applicant_info: any; // Primary applicant form data
  occupants: any; // Occupants data
  webhookSummary: any; // Webhook summary
  signature: any; // Applicant signature
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
  occupants: any; // Occupants data
  webhookSummary: any; // Webhook summary
  signature: any; // Co-applicant signature
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
  occupants: any; // Occupants data
  webhookSummary: any; // Webhook summary
  signature: any; // Guarantor signature
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

  // Get current user's zoneinfo
  async getCurrentUserZoneinfo(): Promise<string | null> {
    try {
      const userAttributes = await fetchUserAttributes();
      const zoneinfo = userAttributes.zoneinfo;
      
      if (!zoneinfo) {
        console.warn('⚠️ No zoneinfo found in user attributes');
        return null;
      }
      
      console.log('✅ Retrieved zoneinfo:', zoneinfo);
      return zoneinfo;
    } catch (error) {
      console.error('❌ Error getting user zoneinfo:', error);
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

  // Save application data
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

      const appid = this.generateApplicationId();
      const applicationData: ApplicationData = {
        ...data,
        userId,
        role,
        appid,
        zoneinfo,
        last_updated: new Date().toISOString()
      };

      const command = new PutItemCommand({
        TableName: this.tables.app_nyc,
        Item: marshall(applicationData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        })
      });

      await this.client.send(command);
      console.log('✅ Application data saved successfully with role:', role);
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

      const result = await this.client.send(command);
      
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

      const result = await this.client.send(command);
      if (result.Items && result.Items.length > 0) {
        return result.Items.map(item => unmarshall(item) as ApplicationData);
      }
      return [];
    } catch (error) {
      console.error('❌ Error getting applications by zoneinfo:', error);
      return [];
    }
  }
  // APPLICANT DATA METHODS

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

      const applicantData: ApplicantData = {
        ...data,
        userId,
        role,
        zoneinfo,
        appid: applicationAppid,
        last_updated: new Date().toISOString()
      };

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

  // Save applicant data as a NEW record by generating a unique userId suffix
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

      // Use appid (if available) as userId to avoid suffixes; fallback to base userId
      const uniqueUserId = applicationAppid || baseUserId;

      const applicantData: ApplicantData = {
        ...data,
        userId: uniqueUserId,
        role,
        zoneinfo,
        appid: applicationAppid,
        last_updated: new Date().toISOString()
      };

      const command = new PutItemCommand({
        TableName: this.tables.applicant_nyc,
        Item: marshall(applicantData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        })
      });

      await this.client.send(command);
      console.log('✅ Applicant data saved as NEW record with unique userId:', uniqueUserId);
      return true;
    } catch (error) {
      console.error('❌ Error saving applicant data as new record:', error);
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

      const command = new GetItemCommand({
        TableName: this.tables.applicant_nyc,
        Key: marshall({
          userId,
          zoneinfo
        })
      });

      const result = await this.client.send(command);
      
      if (result.Item) {
        return unmarshall(result.Item) as ApplicantData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting applicant data:', error);
      return null;
    }
  }

  // Get applicant_nyc record by appid (scan by zoneinfo + appid)
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
        FilterExpression: 'zoneinfo = :zoneinfo AND appid = :appid',
        ExpressionAttributeValues: marshall({
          ':zoneinfo': zoneinfo,
          ':appid': appid,
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

  // Save co-applicant data
  async saveCoApplicantData(data: Omit<CoApplicantData, 'userId' | 'role' | 'zoneinfo' | 'appid'>, appid?: string): Promise<boolean> {
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

      // If appid is not provided, try to get it from existing application data
      let applicationAppid = appid;
      if (!applicationAppid) {
        const existingApp = await this.getApplicationData();
        applicationAppid = existingApp?.appid;
        if (!applicationAppid) {
          console.error('❌ No appid available for co-applicant data');
          return false;
        }
      }

      const coApplicantData: CoApplicantData = {
        ...data,
        userId,
        role,
        zoneinfo,
        appid: applicationAppid,
        last_updated: new Date().toISOString()
      };

      const command = new PutItemCommand({
        TableName: this.tables.coapplicants,
        Item: marshall(coApplicantData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        })
      });

      await this.client.send(command);
      console.log('✅ Co-applicant data saved successfully with appid:', applicationAppid, 'and role:', role);
      return true;
    } catch (error) {
      console.error('❌ Error saving co-applicant data:', error);
      return false;
    }
  }

  // Get co-applicant data
  async getCoApplicantData(): Promise<CoApplicantData | null> {
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

      const command = new GetItemCommand({
        TableName: this.tables.coapplicants,
        Key: marshall({
          userId,
          zoneinfo
        })
      });

      const result = await this.client.send(command);
      
      if (result.Item) {
        return unmarshall(result.Item) as CoApplicantData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting co-applicant data:', error);
      return null;
    }
  }

  // Save co-applicant as NEW record by generating unique userId suffix
  async saveCoApplicantDataNew(data: Omit<CoApplicantData, 'userId' | 'role' | 'zoneinfo' | 'appid'>, appid?: string): Promise<boolean> {
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

      let applicationAppid = appid;
      if (!applicationAppid) {
        const existingApp = await this.getApplicationData();
        applicationAppid = existingApp?.appid;
        if (!applicationAppid) {
          console.error('❌ No appid available for co-applicant data');
          return false;
        }
      }

      const uniqueUserId = `${baseUserId}-co-${Date.now()}`;

      const coApplicantData: CoApplicantData = {
        ...data,
        userId: uniqueUserId,
        role,
        zoneinfo,
        appid: applicationAppid,
        last_updated: new Date().toISOString()
      };

      const command = new PutItemCommand({
        TableName: this.tables.coapplicants,
        Item: marshall(coApplicantData, { removeUndefinedValues: true, convertClassInstanceToMap: true })
      });

      await this.client.send(command);
      console.log('✅ Co-applicant saved as NEW record with unique userId:', uniqueUserId);
      return true;
    } catch (error) {
      console.error('❌ Error saving co-applicant as new record:', error);
      return false;
    }
  }

  // List all co-applicants for the current application (by appid within same zone)
  async getCoApplicantsByAppId(appid?: string): Promise<CoApplicantData[]> {
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

      let targetAppId = appid;
      if (!targetAppId) {
        const app = await this.getApplicationData();
        targetAppId = app?.appid;
      }
      if (!targetAppId) {
        console.warn('⚠️ No appid available to list co-applicants');
        return [];
      }

      // Table primary key appears to be { userId, zoneinfo }. Since we need by appid, use Scan with filter
      const command = new ScanCommand({
        TableName: this.tables.coapplicants,
        FilterExpression: 'appid = :appid AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':appid': targetAppId,
          ':zoneinfo': zoneinfo,
        }, { convertClassInstanceToMap: true })
      });

      const result = await this.client.send(command);
      const items = (result.Items || []).map(item => unmarshall(item) as CoApplicantData);
      return items;
    } catch (error) {
      console.error('❌ Error listing co-applicants by appid:', error);
      return [];
    }
  }

  // GUARANTOR DATA METHODS

  // Save guarantor data
  async saveGuarantorData(data: Omit<GuarantorData, 'userId' | 'role' | 'zoneinfo' | 'appid'>, appid?: string): Promise<boolean> {
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

      // If appid is not provided, try to get it from existing application data
      let applicationAppid = appid;
      if (!applicationAppid) {
        const existingApp = await this.getApplicationData();
        applicationAppid = existingApp?.appid;
        if (!applicationAppid) {
          console.error('❌ No appid available for guarantor data');
          return false;
        }
      }

      const guarantorData: GuarantorData = {
        ...data,
        userId,
        role,
        zoneinfo,
        appid: applicationAppid,
        last_updated: new Date().toISOString()
      };

      const command = new PutItemCommand({
        TableName: this.tables.guarantors,
        Item: marshall(guarantorData, { 
          removeUndefinedValues: true,
          convertClassInstanceToMap: true 
        })
      });

      await this.client.send(command);
      console.log('✅ Guarantor data saved successfully with appid:', applicationAppid, 'and role:', role);
      return true;
    } catch (error) {
      console.error('❌ Error saving guarantor data:', error);
      return false;
    }
  }

  // Get guarantor data
  async getGuarantorData(): Promise<GuarantorData | null> {
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

      const command = new GetItemCommand({
        TableName: this.tables.guarantors,
        Key: marshall({
          userId,
          zoneinfo
        })
      });

      const result = await this.client.send(command);
      
      if (result.Item) {
        return unmarshall(result.Item) as GuarantorData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting guarantor data:', error);
      return null;
    }
  }

  // Save guarantor as NEW record by generating unique userId suffix
  async saveGuarantorDataNew(data: Omit<GuarantorData, 'userId' | 'role' | 'zoneinfo' | 'appid'>, appid?: string): Promise<boolean> {
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

      let applicationAppid = appid;
      if (!applicationAppid) {
        const existingApp = await this.getApplicationData();
        applicationAppid = existingApp?.appid;
        if (!applicationAppid) {
          console.error('❌ No appid available for guarantor data');
          return false;
        }
      }

      const uniqueUserId = `${baseUserId}-guar-${Date.now()}`;

      const guarantorData: GuarantorData = {
        ...data,
        userId: uniqueUserId,
        role,
        zoneinfo,
        appid: applicationAppid,
        last_updated: new Date().toISOString()
      };

      const command = new PutItemCommand({
        TableName: this.tables.guarantors,
        Item: marshall(guarantorData, { removeUndefinedValues: true, convertClassInstanceToMap: true })
      });

      await this.client.send(command);
      console.log('✅ Guarantor saved as NEW record with unique userId:', uniqueUserId);
      return true;
    } catch (error) {
      console.error('❌ Error saving guarantor as new record:', error);
      return false;
    }
  }

  // List all guarantors for the current application (by appid within same zone)
  async getGuarantorsByAppId(appid?: string): Promise<GuarantorData[]> {
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

      let targetAppId = appid;
      if (!targetAppId) {
        const app = await this.getApplicationData();
        targetAppId = app?.appid;
      }
      if (!targetAppId) {
        console.warn('⚠️ No appid available to list guarantors');
        return [];
      }

      const command = new ScanCommand({
        TableName: this.tables.guarantors,
        FilterExpression: 'appid = :appid AND zoneinfo = :zoneinfo',
        ExpressionAttributeValues: marshall({
          ':appid': targetAppId,
          ':zoneinfo': zoneinfo,
        }, { convertClassInstanceToMap: true })
      });

      const result = await this.client.send(command);
      const items = (result.Items || []).map(item => unmarshall(item) as GuarantorData);
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

      // Delete from all tables
      const deletePromises = [
        // Delete from applicant_nyc, coapplicants, and guarantors using composite key
        this.client.send(new DeleteItemCommand({
          TableName: this.tables.applicant_nyc,
          Key: marshall({ userId, zoneinfo })
        })),
        this.client.send(new DeleteItemCommand({
          TableName: this.tables.coapplicants,
          Key: marshall({ userId, zoneinfo })
        })),
        this.client.send(new DeleteItemCommand({
          TableName: this.tables.guarantors,
          Key: marshall({ userId, zoneinfo })
        }))
      ];

      // Add app_nyc deletion if we have the appid
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
  
  async saveCoApplicantData(data: Omit<CoApplicantData, 'userId' | 'role' | 'zoneinfo' | 'appid'>, appid?: string): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveCoApplicantData(data, appid);
  },
  
  async getCoApplicantData(): Promise<CoApplicantData | null> {
    return dynamoDBSeparateTablesService.getCoApplicantData();
  },
  
  async getCoApplicantsByAppId(appid?: string): Promise<CoApplicantData[]> {
    return dynamoDBSeparateTablesService.getCoApplicantsByAppId(appid);
  },
  
  async saveGuarantorData(data: Omit<GuarantorData, 'userId' | 'role' | 'zoneinfo' | 'appid'>, appid?: string): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveGuarantorData(data, appid);
  },
  
  async getGuarantorData(): Promise<GuarantorData | null> {
    return dynamoDBSeparateTablesService.getGuarantorData();
  },
  
  async saveCoApplicantDataNew(data: Omit<CoApplicantData, 'userId' | 'role' | 'zoneinfo' | 'appid'>, appid?: string): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveCoApplicantDataNew(data, appid);
  },
  
  async saveGuarantorDataNew(data: Omit<GuarantorData, 'userId' | 'role' | 'zoneinfo' | 'appid'>, appid?: string): Promise<boolean> {
    return dynamoDBSeparateTablesService.saveGuarantorDataNew(data, appid);
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
