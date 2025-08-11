import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';

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
      // Only add identityPoolId if it's properly configured and not empty
      ...(import.meta.env.VITE_AWS_IDENTITY_POOL_ID && 
          import.meta.env.VITE_AWS_IDENTITY_POOL_ID !== 'us-east-1:317775cf-6015-4ce2-9551-57994672861d' && // Skip demo ID
          import.meta.env.VITE_AWS_IDENTITY_POOL_ID.trim() !== '' && {
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
      // Only add identityPoolId if it's properly configured and not empty
      ...(import.meta.env.VITE_AWS_IDENTITY_POOL_ID && 
          import.meta.env.VITE_AWS_IDENTITY_POOL_ID !== 'us-east-1:317775cf-6015-4ce2-9551-57994672861d' && // Skip demo ID
          import.meta.env.VITE_AWS_IDENTITY_POOL_ID.trim() !== '' && {
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

// Function to get AWS credentials for authenticated users with better error handling
export const getAwsCredentials = async () => {
  try {
    const session = await fetchAuthSession();
    
    // Check if we have valid tokens
    if (!session.tokens?.accessToken) {
      console.log('No valid access token available');
      return null;
    }

    // For DynamoDB access, we need to use the Identity Pool to get temporary AWS credentials
    // The access token and ID token are not AWS credentials - they're JWT tokens
    if (session.identityId) {
      console.log('Using Identity Pool for AWS credentials');
      return {
        identityId: session.identityId,
        userSub: session.tokens.accessToken.payload?.sub,
        // Note: We'll use the credential provider in the DynamoDB service
      };
    } else {
      console.warn('No Identity Pool configured - DynamoDB operations will fail');
      return null;
    }
  } catch (error) {
    console.error('Error getting AWS credentials:', error);
    // Don't throw the error, just return null to allow the app to continue
    return null;
  }
};

// Function to get temporary AWS credentials using Identity Pool
export const getTemporaryAwsCredentials = async () => {
  try {
    const session = await fetchAuthSession();
    
    if (!session.tokens?.accessToken || !import.meta.env.VITE_AWS_IDENTITY_POOL_ID) {
      console.warn('Missing required tokens or Identity Pool ID for AWS credentials');
      return null;
    }

    // Use the Cognito Identity Pool to get temporary AWS credentials
    const credentials = await fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: import.meta.env.VITE_AWS_REGION || 'us-east-1' }),
      identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
      logins: {
        [`cognito-idp.${import.meta.env.VITE_AWS_REGION || 'us-east-1'}.amazonaws.com/${import.meta.env.VITE_AWS_USER_POOL_ID}`]: 
          session.tokens.idToken?.toString() || ''
      }
    });

    return credentials;
  } catch (error) {
    console.error('Error getting temporary AWS credentials:', error);
    return null;
  }
};

// Enhanced function to get user attributes including name and zoneinfo with better error handling
export const getUserAttributesWithDebug = async () => {
  try {
    const { fetchUserAttributes } = await import('aws-amplify/auth');
    const attributes = await fetchUserAttributes();
    
    console.log('🔍 AWS User Attributes Debug:', {
      // Basic user info
      username: attributes.username,
      email: attributes.email,
      email_verified: attributes.email_verified,
      
      // Name attributes
      name: attributes.name,
      given_name: attributes.given_name,
      family_name: attributes.family_name,
      nickname: attributes.nickname,
      
      // Contact info
      phone_number: attributes.phone_number,
      phone_number_verified: attributes.phone_number_verified,
      
      // AWS specific
      sub: attributes.sub,
      aud: attributes.aud,
      iss: attributes.iss,
      
      // Custom attributes (if any)
      custom_attributes: Object.keys(attributes).filter(key => key.startsWith('custom:')),
      
      // All available attributes
      all_attributes: attributes,
    });

    // Check for zoneinfo specifically
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
    // Return a fallback object instead of null to prevent app crashes
    return {
      attributes: {},
      zoneinfo: undefined,
      hasName: false,
      hasZoneinfo: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Function to get current user with full debug info and better error handling
export const getCurrentUserWithDebug = async () => {
  try {
    const { getCurrentUser } = await import('aws-amplify/auth');
    const currentUser = await getCurrentUser();
    
    console.log('👤 Current User Debug:', {
      username: currentUser.username,
      userId: currentUser.userId,
      signInDetails: currentUser.signInDetails,
    });

    // Get user attributes
    const userAttributes = await getUserAttributesWithDebug();
    
    return {
      currentUser,
      userAttributes,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    // Return a fallback object instead of null to prevent app crashes
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

// Comprehensive AWS configuration test function with better error handling
export const testAwsConfiguration = async () => {
  console.log('🧪 Starting AWS Configuration Test...');
  
  try {
    // Test 1: Check if Amplify is configured
    console.log('📋 Test 1: Amplify Configuration');
    console.log('AWS Config:', awsConfig);
    
    // Test 2: Try to get current user
    console.log('📋 Test 2: Current User');
    const { getCurrentUser } = await import('aws-amplify/auth');
    const currentUser = await getCurrentUser();
    console.log('Current User:', currentUser);
    
    // Test 3: Try to get user attributes
    console.log('📋 Test 3: User Attributes');
    const { fetchUserAttributes } = await import('aws-amplify/auth');
    const attributes = await fetchUserAttributes();
    console.log('All User Attributes:', attributes);
    
    // Test 4: Check for specific attributes
    console.log('📋 Test 4: Specific Attributes Check');
    const specificAttributes = {
      name: attributes.name,
      given_name: attributes.given_name,
      family_name: attributes.family_name,
      zoneinfo: attributes.zoneinfo,
      'custom:zoneinfo': attributes['custom:zoneinfo'],
      email: attributes.email,
      phone_number: attributes.phone_number,
      sub: attributes.sub,
    };
    console.log('Specific Attributes:', specificAttributes);
    
    // Test 5: Check for custom attributes
    console.log('📋 Test 5: Custom Attributes');
    const customAttributes = Object.keys(attributes).filter(key => key.startsWith('custom:'));
    console.log('Custom Attributes Found:', customAttributes);
    
    // Test 6: Check for zoneinfo specifically
    console.log('📋 Test 6: Zoneinfo Check');
    const zoneinfo = attributes.zoneinfo || attributes['custom:zoneinfo'];
    if (zoneinfo) {
      console.log('✅ Zoneinfo found:', zoneinfo);
    } else {
      console.log('❌ No zoneinfo attribute found');
      console.log('Available attributes:', Object.keys(attributes));
    }
    
    // Test 7: Check for name attributes
    console.log('📋 Test 7: Name Attributes Check');
    const nameAttributes = {
      name: attributes.name,
      given_name: attributes.given_name,
      family_name: attributes.family_name,
      nickname: attributes.nickname,
    };
    console.log('Name Attributes:', nameAttributes);
    
    return {
      success: true,
      currentUser,
      attributes,
      zoneinfo,
      nameAttributes,
      customAttributes,
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
    // Test basic configuration
    await testAwsConfiguration();
    
    // Test user attributes
    await getUserAttributesWithDebug();
    
    // Test current user
    await getCurrentUserWithDebug();
    
    console.log('✅ AWS Debug Complete');
  } catch (error) {
    console.error('❌ AWS Debug failed:', error);
  }
}; 

 