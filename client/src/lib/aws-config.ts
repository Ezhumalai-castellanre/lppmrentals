import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { environment, validateEnvironment, logEnvironmentConfig } from '@/config/environment';

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
    const session = await fetchAuthSession();
    
    if (!session.tokens?.accessToken || !environment.aws.identityPoolId) {
      console.warn('Missing required tokens or Identity Pool ID for AWS credentials');
      return null;
    }

    const credentials = await fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: environment.aws.region }),
      identityPoolId: environment.aws.identityPoolId,
      logins: {
        [`cognito-idp.${environment.aws.region}.amazonaws.com/${environment.aws.userPoolId}`]: 
          session.tokens.idToken?.toString() || ''
      }
    });

    return credentials;
  } catch (error) {
    console.error('Error getting temporary AWS credentials:', error);
    return null;
  }
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

 