import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { testAwsConfiguration, getTemporaryAwsCredentials } from '../lib/aws-config';
import { DynamoDBService } from '../lib/dynamodb-service';
import { DebugAwsCredentials } from './debug-aws-credentials';

export const DebugAuth: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAwsTest = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);

    try {
      console.log('🧪 Starting AWS Configuration Test...');
      const results = await testAwsConfiguration();
      setTestResults(results);
      console.log('✅ Test completed:', results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const testDynamoDBConnection = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);

    try {
      console.log('🧪 Testing DynamoDB Connection...');
      const dynamoService = new DynamoDBService();
      const success = await dynamoService.testConnection();
      
      setTestResults({
        success,
        message: success ? 'DynamoDB connection successful' : 'DynamoDB connection failed',
        service: 'DynamoDB'
      });
      
      console.log('✅ DynamoDB test completed:', success);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ DynamoDB test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const testTemporaryCredentials = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);

    try {
      console.log('🧪 Testing Temporary AWS Credentials...');
      const credentials = await getTemporaryAwsCredentials();
      
      if (credentials) {
        setTestResults({
          success: true,
          message: 'Temporary AWS credentials obtained successfully',
          service: 'Credentials',
          hasAccessKey: !!credentials.accessKeyId,
          hasSecretKey: !!credentials.secretAccessKey,
          hasSessionToken: !!credentials.sessionToken,
        });
        console.log('✅ Credentials test completed:', credentials);
      } else {
        setTestResults({
          success: false,
          message: 'Failed to get temporary AWS credentials',
          service: 'Credentials'
        });
        console.log('❌ Credentials test failed: No credentials returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Credentials test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🔧 AWS Authentication Debug</CardTitle>
          <CardDescription>
            Test and troubleshoot AWS authentication and DynamoDB connection issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={runAwsTest} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Testing...' : '🧪 Test AWS Config'}
            </Button>
            
            <Button 
              onClick={testTemporaryCredentials} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Testing...' : '🔑 Test Credentials'}
            </Button>
            
            <Button 
              onClick={testDynamoDBConnection} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Testing...' : '🗄️ Test DynamoDB'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-medium text-red-800">❌ Error</h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {testResults && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-800">
                {testResults.success ? '✅ Success' : '⚠️ Warning'}
              </h4>
              <p className="text-red-600 text-sm mb-2">{testResults.message}</p>
              <div className="text-xs text-blue-500">
                <pre>{JSON.stringify(testResults, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Environment Variables:</strong></p>
            <p>Region: {import.meta.env.VITE_AWS_REGION || 'Not set'}</p>
            <p>User Pool ID: {import.meta.env.VITE_AWS_USER_POOL_ID || 'Not set'}</p>
            <p>Identity Pool ID: {import.meta.env.VITE_AWS_IDENTITY_POOL_ID || 'Not set'}</p>
            <p>DynamoDB Table: {import.meta.env.VITE_AWS_DYNAMODB_TABLE_NAME || 'DraftSaved'}</p>
          </div>
        </CardContent>
      </Card>

      {/* AWS Credentials Debug Component */}
      <DebugAwsCredentials />
    </div>
  );
};
