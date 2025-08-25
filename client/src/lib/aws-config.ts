import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { environment, validateEnvironment, logEnvironmentConfig } from '../config/environment';

// Validate environment configuration
validateEnvironment();
logEnvironmentConfig();

// AWS Amplify configuration
const awsConfig = {
  Auth: {
    Cognito: {
      region: environment.aws.region,
      userPoolId: environment.aws.userPoolId,
      userPoolClientId: environment.aws.userPoolClientId,
      identityPoolId: environment.aws.identityPoolId,
      loginWith: {
        oauth: {
          domain: environment.aws.cognitoDomain,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [environment.aws.redirectSignIn],
          redirectSignOut: [environment.aws.redirectSignOut],
          responseType: 'code' as const,
        },
      },
    },
  },
};

console.log('🔧 Configuring AWS Amplify with:', {
  region: awsConfig.Auth.Cognito.region,
  userPoolId: awsConfig.Auth.Cognito.userPoolId,
  userPoolClientId: awsConfig.Auth.Cognito.userPoolClientId ? '***configured***' : 'missing',
  identityPoolId: awsConfig.Auth.Cognito.identityPoolId ? '***configured***' : 'missing',
});

Amplify.configure(awsConfig);

// Function to get AWS credentials for authenticated users
export const getAwsCredentials = async () => {
  try {
    const session = await fetchAuthSession();
    
    if (!session.tokens?.accessToken) {
      console.log('No valid access token available');
      return null;
    }

    if (session.identityId) {
      console.log('Using Identity Pool for AWS credentials');
      return {
        identityId: session.identityId,
        userSub: session.tokens.accessToken.payload?.sub,
      };
    } else {
      console.warn('No Identity Pool configured - DynamoDB operations will fail');
      return null;
    }
  } catch (error) {
    console.error('Error getting AWS credentials:', error);
    return null;
  }
};

// Function to get temporary AWS credentials using Identity Pool
export const getTemporaryAwsCredentials = async () => {
  try {
    console.log('🔑 Attempting to get temporary AWS credentials...');
    
    const session = await fetchAuthSession();
    console.log('📋 Auth session:', {
      hasTokens: !!session.tokens,
      hasAccessToken: !!session.tokens?.accessToken,
      hasIdToken: !!session.tokens?.idToken,
      hasIdentityId: !!session.identityId,
      tokens: session.tokens ? Object.keys(session.tokens) : 'none'
    });
    
    if (!session.tokens?.accessToken) {
      console.warn('❌ No access token available in session');
      return null;
    }
    
    if (!environment.aws.identityPoolId) {
      console.warn('❌ No Identity Pool ID configured');
      return null;
    }
    
    if (!environment.aws.userPoolId) {
      console.warn('❌ No User Pool ID configured');
      return null;
    }

    console.log('🔧 Creating Cognito Identity client...');
    const cognitoIdentityClient = new CognitoIdentityClient({ 
      region: environment.aws.region 
    });
    
    const loginKey = `cognito-idp.${environment.aws.region}.amazonaws.com/${environment.aws.userPoolId}`;
    const idToken = session.tokens.idToken?.toString();
    
    console.log('🔑 Login configuration:', {
      loginKey,
      hasIdToken: !!idToken,
      identityPoolId: environment.aws.identityPoolId,
      region: environment.aws.region
    });

    const credentialProvider = fromCognitoIdentityPool({
      client: cognitoIdentityClient,
      identityPoolId: environment.aws.identityPoolId,
      logins: {
        [loginKey]: idToken || ''
      }
    });

    // Resolve the credential provider to get actual credentials
    const credentials = await credentialProvider();
    
    console.log('✅ Temporary credentials obtained successfully:', {
      hasAccessKey: !!credentials.accessKeyId,
      hasSecretKey: !!credentials.secretAccessKey,
      hasSessionToken: !!credentials.sessionToken,
      expiration: credentials.expiration
    });

    return credentials;
  } catch (error) {
    console.error('❌ Error getting temporary AWS credentials:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return null;
  }
};

// Fallback credential provider for development/testing
export const getFallbackCredentials = () => {
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
  
  if (accessKeyId && secretAccessKey) {
    console.log('⚠️ Using fallback credentials from environment variables');
    return {
      accessKeyId,
      secretAccessKey,
      sessionToken: undefined,
      expiration: undefined
    };
  }
  
  return null;
};

// Enhanced credential provider that tries multiple sources
export const getAwsCredentialsForS3 = async () => {
  console.log('🔑 Getting AWS credentials for S3 operations...');
  
  // First, try to get temporary credentials from authenticated session
  const tempCredentials = await getTemporaryAwsCredentials();
  if (tempCredentials) {
    console.log('✅ Using temporary credentials from authenticated session');
    return tempCredentials;
  }
  
  // Fallback to environment variables if available
  const fallbackCredentials = getFallbackCredentials();
  if (fallbackCredentials) {
    console.log('⚠️ Using fallback credentials from environment variables');
    return fallbackCredentials;
  }
  
  console.error('❌ No AWS credentials available from any source');
  return null;
};

// Enhanced function to get user attributes
export const getUserAttributesWithDebug = async () => {
  try {
    const { fetchUserAttributes } = await import('aws-amplify/auth');
    const attributes = await fetchUserAttributes();
    
    console.log('🔍 AWS User Attributes Debug:', {
      username: attributes.username,
      email: attributes.email,
      email_verified: attributes.email_verified,
      name: attributes.name,
      given_name: attributes.given_name,
      family_name: attributes.family_name,
      nickname: attributes.nickname,
      phone_number: attributes.phone_number,
      phone_number_verified: attributes.phone_number_verified,
      sub: attributes.sub,
      aud: attributes.aud,
      iss: attributes.iss,
      custom_attributes: Object.keys(attributes).filter(key => key.startsWith('custom:')),
      all_attributes: attributes,
    });

    const zoneinfo = attributes.zoneinfo || attributes['custom:zoneinfo'];
    if (zoneinfo) {
      console.log('🌍 Zoneinfo found:', zoneinfo);
    } else {
      console.log('⚠️ No zoneinfo attribute found in user attributes');
    }

    return {
      attributes,
      zoneinfo,
      hasName: !!(attributes.name || attributes.given_name || attributes.family_name),
      hasZoneinfo: !!zoneinfo,
    };
  } catch (error) {
    console.error('Error getting user attributes:', error);
    return {
      attributes: {},
      zoneinfo: undefined,
      hasName: false,
      hasZoneinfo: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Function to get current user with debug info
export const getCurrentUserWithDebug = async () => {
  try {
    const { getCurrentUser } = await import('aws-amplify/auth');
    const currentUser = await getCurrentUser();
    
    console.log('👤 Current User Debug:', {
      username: currentUser.username,
      userId: currentUser.userId,
      signInDetails: currentUser.signInDetails,
    });

    const userAttributes = await getUserAttributesWithDebug();
    
    return {
      currentUser,
      userAttributes,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      currentUser: null,
      userAttributes: {
        attributes: {},
        zoneinfo: undefined,
        hasName: false,
        hasZoneinfo: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export default awsConfig;

// Test AWS configuration
export const testAwsConfiguration = async () => {
  console.log('🧪 Starting AWS Configuration Test...');
  
  try {
    console.log('📋 Test 1: Amplify Configuration');
    console.log('AWS Config:', awsConfig);
    
    console.log('📋 Test 2: Current User');
    const { getCurrentUser } = await import('aws-amplify/auth');
    const currentUser = await getCurrentUser();
    console.log('Current User:', currentUser);
    
    console.log('📋 Test 3: User Attributes');
    const { fetchUserAttributes } = await import('aws-amplify/auth');
    const attributes = await fetchUserAttributes();
    console.log('All User Attributes:', attributes);
    
    const zoneinfo = attributes.zoneinfo || attributes['custom:zoneinfo'];
    if (zoneinfo) {
      console.log('✅ Zoneinfo found:', zoneinfo);
    } else {
      console.log('❌ No zoneinfo attribute found');
    }
    
    return {
      success: true,
      currentUser,
      attributes,
      zoneinfo,
    };
  } catch (error) {
    console.error('❌ AWS Configuration Test Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Function to manually trigger AWS debug
export const triggerAwsDebug = async () => {
  console.log('🚀 Triggering AWS Debug...');
  
  try {
    await testAwsConfiguration();
    await getUserAttributesWithDebug();
    await getCurrentUserWithDebug();
    console.log('✅ AWS Debug Complete');
  } catch (error) {
    console.error('❌ AWS Debug failed:', error);
  }
}; 

 