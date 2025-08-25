// Environment configuration for the client
export const environment = {
  // AWS Configuration
  aws: {
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID || 'us-east-1_d07c780Tz',
    userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID || 'dodlhbfd06i8u5t9kl6lkk6a0',
    identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID || 'us-east-1:317775cf-6015-4ce2-9551-57994672861d',
    cognitoDomain: import.meta.env.VITE_AWS_COGNITO_DOMAIN || 'demo.auth.us-east-1.amazoncognito.com',
    redirectSignIn: import.meta.env.VITE_REDIRECT_SIGN_IN || 'http://localhost:5173/',
    redirectSignOut: import.meta.env.VITE_REDIRECT_SIGN_OUT || 'http://localhost:5173/',
  },
  
  // DynamoDB Configuration
  dynamodb: {
    tableName: import.meta.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved',
  },
  
  // Monday.com Configuration
  monday: {
    apiToken: import.meta.env.VITE_MONDAY_API_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU',
    boardId: import.meta.env.VITE_MONDAY_BOARD_ID || '9769934634',
    documentsBoardId: import.meta.env.VITE_MONDAY_DOCUMENTS_BOARD_ID || '9602025981',
  },
  
  // S3 Configuration
  s3: {
    bucketName: import.meta.env.VITE_AWS_S3_BUCKET_NAME || 'supportingdocuments-storage-2025',
  },
  
  // App Configuration
  app: {
    isDevelopment: import.meta.env.DEV || false,
    isProduction: import.meta.env.PROD || false,
  }
};

// Validate required environment variables
export const validateEnvironment = () => {
  const required = [
    'VITE_AWS_USER_POOL_ID',
    'VITE_AWS_USER_POOL_CLIENT_ID', 
    'VITE_AWS_IDENTITY_POOL_ID'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing required environment variables:', missing);
    console.warn('Using fallback values from environment.ts');
  }
  
  return missing.length === 0;
};

// Log environment configuration (without sensitive data)
export const logEnvironmentConfig = () => {
  console.log('🌍 Environment Configuration:', {
    region: environment.aws.region,
    userPoolId: environment.aws.userPoolId,
    userPoolClientId: environment.aws.userPoolClientId ? '***configured***' : 'missing',
    identityPoolId: environment.aws.identityPoolId ? '***configured***' : 'missing',
    cognitoDomain: environment.aws.cognitoDomain,
    dynamodbTable: environment.dynamodb.tableName,
    mondayApiToken: environment.monday.apiToken ? '***configured***' : 'missing',
    mondayBoardId: environment.monday.boardId,
    mondayDocumentsBoardId: environment.monday.documentsBoardId,
    s3Bucket: environment.s3.bucketName,
    isDevelopment: environment.app.isDevelopment,
    isProduction: environment.app.isProduction,
    // Check for fallback credentials
    hasAccessKey: !!import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    hasSecretKey: !!import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  });
};
