import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getTemporaryAwsCredentials, testAwsConfiguration, getAwsCredentialsForS3 } from '../lib/aws-config';

export const DebugAwsCredentials: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<any>(null);

  const testAuthState = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing authentication state...');
      
      // Test current authentication state
      const { fetchAuthSession, getCurrentUser } = await import('aws-amplify/auth');
      
      const session = await fetchAuthSession();
      const currentUser = await getCurrentUser();
      
      const authInfo = {
        session: {
          hasTokens: !!session.tokens,
          hasAccessToken: !!session.tokens?.accessToken,
          hasIdToken: !!session.tokens?.idToken,
          hasIdentityId: !!session.identityId,
          tokenTypes: session.tokens ? Object.keys(session.tokens) : 'none'
        },
        user: {
          username: currentUser.username,
          userId: currentUser.userId,
          signInDetails: currentUser.signInDetails
        }
      };
      
      setAuthState(authInfo);
      console.log('✅ Authentication state:', authInfo);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Authentication state test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const testCredentials = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing AWS credentials...');
      
      // Test 1: Get temporary credentials
      const tempCredentials = await getTemporaryAwsCredentials();
      setCredentials(tempCredentials);
      
      if (tempCredentials) {
        console.log('✅ Temporary credentials obtained:', {
          accessKeyId: tempCredentials.accessKeyId ? '***configured***' : 'missing',
          secretAccessKey: tempCredentials.secretAccessKey ? '***configured***' : 'missing',
          sessionToken: tempCredentials.sessionToken ? '***configured***' : 'missing',
          expiration: tempCredentials.expiration,
        });
      } else {
        console.log('❌ Failed to get temporary credentials');
      }
      
      // Test 2: Run full AWS configuration test
      const result = await testAwsConfiguration();
      setTestResult(result);
      
      console.log('✅ AWS configuration test completed:', result);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ AWS credentials test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const testS3Upload = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing S3 upload with credentials...');
      
      // Create a simple test file
      const testData = 'Hello World - Test S3 Upload';
      const testFile = new File([testData], 'test.txt', { type: 'text/plain' });
      
      // Import and test S3 service
      const { S3Service } = await import('../lib/s3-service');
      
      const result = await S3Service.uploadFile(
        testFile,
        'test-reference',
        'test-section',
        'test-document'
      );
      
      if (result.success) {
        console.log('✅ S3 upload test successful:', result);
        setTestResult({ ...testResult, s3Test: result });
      } else {
        throw new Error(result.error || 'S3 upload failed');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ S3 upload test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const testEnhancedCredentials = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testing enhanced AWS credentials...');
      
      const credentials = await getAwsCredentialsForS3();
      setCredentials(credentials);
      
      if (credentials) {
        console.log('✅ Enhanced credentials obtained:', {
          accessKeyId: credentials.accessKeyId ? '***configured***' : 'missing',
          secretAccessKey: credentials.secretAccessKey ? '***configured***' : 'missing',
          sessionToken: credentials.sessionToken ? '***configured***' : 'missing',
          expiration: credentials.expiration,
        });
      } else {
        console.log('❌ Failed to get enhanced credentials');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Enhanced credentials test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🔧 AWS Credentials Debug</CardTitle>
        <CardDescription>
          Test AWS credentials and S3 functionality to troubleshoot upload issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testAuthState} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : '🔍 Test Auth State'}
          </Button>
          
          <Button 
            onClick={testCredentials} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : '🔑 Test Credentials'}
          </Button>
          
          <Button 
            onClick={testEnhancedCredentials} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : '🚀 Test Enhanced Credentials'}
          </Button>
          
          <Button 
            onClick={testS3Upload} 
            disabled={isLoading || !credentials}
            variant="outline"
          >
            {isLoading ? 'Testing...' : '📤 Test S3 Upload'}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-semibold text-red-800">❌ Error</h4>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {authState && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800">🔍 Authentication State</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Session Tokens:</strong> {authState.session.tokenTypes}</p>
              <p><strong>Has Access Token:</strong> {authState.session.hasAccessToken ? 'Yes' : 'No'}</p>
              <p><strong>Has ID Token:</strong> {authState.session.hasIdToken ? 'Yes' : 'No'}</p>
              <p><strong>Has Identity ID:</strong> {authState.session.hasIdentityId ? 'Yes' : 'No'}</p>
              <p><strong>Username:</strong> {authState.user.username}</p>
              <p><strong>User ID:</strong> {authState.user.userId}</p>
            </div>
          </div>
        )}

        {credentials && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800">✅ AWS Credentials</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Access Key ID:</strong> {credentials.accessKeyId ? '***configured***' : 'missing'}</p>
              <p><strong>Secret Access Key:</strong> {credentials.secretAccessKey ? '***configured***' : 'missing'}</p>
              <p><strong>Session Token:</strong> {credentials.sessionToken ? '***configured***' : 'missing'}</p>
              <p><strong>Expiration:</strong> {credentials.expiration ? new Date(credentials.expiration).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        )}

        {testResult && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-800">📋 Test Results</h4>
            <pre className="text-sm text-blue-700 overflow-auto max-h-64">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <h4 className="font-semibold mb-2">🔍 What This Tests:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Current authentication state and session tokens</li>
            <li>AWS Cognito authentication and session</li>
            <li>Identity Pool temporary credentials generation</li>
            <li>Fallback credentials from environment variables</li>
            <li>S3 client creation with proper credentials</li>
            <li>Basic S3 upload functionality</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
