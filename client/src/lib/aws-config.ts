import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

// Check if AWS credentials are available
const hasAwsCredentials = import.meta.env.VITE_AWS_USER_POOL_ID &&
                         import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID &&
                         import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID !== 'YOUR_APP_CLIENT_ID_HERE' &&
                         import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID !== 'demo-client-id';

// Debug logging for production troubleshooting
console.log('AWS Configuration Debug:', {
  hasAwsCredentials,
  userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
  userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID,
  identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
  region: import.meta.env.VITE_AWS_REGION,
});

const awsConfig = hasAwsCredentials ? {
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID || '',
      // Only add identityPoolId if it's properly configured
      ...(import.meta.env.VITE_AWS_IDENTITY_POOL_ID && {
        identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
      }),
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_AWS_COGNITO_DOMAIN || '',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [import.meta.env.VITE_REDIRECT_SIGN_IN || 'http://localhost:5173/'],
          redirectSignOut: [import.meta.env.VITE_REDIRECT_SIGN_OUT || 'http://localhost:5173/'],
          responseType: 'code' as const,
        },
      },
    },
  },
} : {
  // Fallback configuration with actual AWS credentials
  Auth: {
    Cognito: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_d07c780Tz',
      userPoolClientId: 'dodlhbfd06i8u5t9kl6lkk6a0',
      // Only add identityPoolId if it's properly configured
      ...(import.meta.env.VITE_AWS_IDENTITY_POOL_ID && {
        identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
      }),
      loginWith: {
        oauth: {
          domain: 'demo.auth.us-east-1.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['http://localhost:5173/'],
          redirectSignOut: ['http://localhost:5173/'],
          responseType: 'code' as const,
        },
      },
    },
  },
};

Amplify.configure(awsConfig);

// Function to get AWS credentials for authenticated users
export const getAwsCredentials = async () => {
  try {
    const session = await fetchAuthSession();
    
    // Check if we have valid tokens
    if (!session.tokens?.accessToken) {
      console.log('No valid access token available');
      return null;
    }

    return {
      accessKeyId: session.tokens.accessToken.toString(),
      secretAccessKey: session.tokens.idToken?.toString() || '',
      sessionToken: session.tokens.accessToken.toString(),
      // Add additional session info
      identityId: session.identityId,
      userSub: session.tokens.accessToken.payload?.sub,
    };
  } catch (error) {
    console.error('Error getting AWS credentials:', error);
    return null;
  }
};

export default awsConfig; 