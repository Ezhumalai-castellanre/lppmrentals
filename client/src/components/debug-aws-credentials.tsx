import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTemporaryAwsCredentials, testAwsConfiguration, getAwsCredentialsForS3 } from '../lib/aws-config';
import { dynamoDBService } from '../lib/dynamodb-service';

export function DebugAwsCredentials() {
  const [credentials, setCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [hybridStorageTest, setHybridStorageTest] = useState<any>({});

  const testCredentials = async () => {
    setLoading(true);
    try {
      const creds = await getTemporaryAwsCredentials();
      setCredentials(creds);
      setTestResults({ success: true, message: 'Credentials obtained successfully' });
    } catch (error: any) {
      setTestResults({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testAwsConfig = async () => {
    setLoading(true);
    try {
      const result = await testAwsConfiguration();
      setTestResults(result);
    } catch (error: any) {
      setTestResults({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testS3Credentials = async () => {
    setLoading(true);
    try {
      const creds = await getAwsCredentialsForS3();
      if (creds) {
        setTestResults({ success: true, message: 'S3 credentials obtained successfully' });
      } else {
        setTestResults({ success: false, message: 'Failed to get S3 credentials' });
      }
    } catch (error: any) {
      setTestResults({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testHybridStorage = async () => {
    setLoading(true);
    try {
      console.log('🧪 Starting hybrid storage test...');
      
      // Test S3 bucket access
      const s3Accessible = await (dynamoDBService as any).checkS3BucketAccess();
      if (!s3Accessible) {
        console.warn('⚠️ S3 bucket not accessible, hybrid storage may not work');
        setHybridStorageTest({ success: false, message: 'S3 bucket not accessible' });
        return;
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
        setHybridStorageTest({ success: false, message: 'Failed to save test data with hybrid storage' });
        return;
      }
      
      console.log('✅ Test data saved successfully with hybrid storage');
      
      // Test retrieval
      const retrievedData = await dynamoDBService.getDraft(testData.applicantId, testData.reference_id);
      if (!retrievedData) {
        console.error('❌ Failed to retrieve test data');
        setHybridStorageTest({ success: false, message: 'Failed to retrieve test data' });
        return;
      }
      
      console.log('✅ Test data retrieved successfully');
      
      // Clean up test data
      await dynamoDBService.deleteDraft(testData.applicantId, testData.reference_id);
      console.log('✅ Test data cleaned up');
      
      setHybridStorageTest({ success: true, message: 'Hybrid storage test passed' });
    } catch (error: any) {
      console.error('🧪 Hybrid storage test error:', error);
      setHybridStorageTest({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testLargeDataSave = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing large data save...');
      
      // Create a large dataset that would exceed DynamoDB limits
      const largeData = {
        zoneinfo: 'test-large-data',
        applicantId: 'test-large-data',
        reference_id: `large_test_${Date.now()}`,
        form_data: { 
          test: 'data',
          largeArray: Array(10000).fill('x').join(''), // Create large string
          nestedData: {
            level1: Array(1000).fill('nested').join(''),
            level2: Array(1000).fill('deep').join('')
          }
        },
        current_step: 1,
        last_updated: new Date().toISOString(),
        status: 'draft' as const,
        uploaded_files_metadata: {
          largeFile: {
            fileName: 'large.txt',
            fileSize: 1024 * 1024, // 1MB
            content: Array(100000).fill('x').join(''), // Large content
            metadata: Array(1000).fill('metadata').join('')
          }
        },
        webhook_responses: {
          largeResponse: {
            status: 'success',
            data: Array(5000).fill('response').join(''),
            headers: Array(1000).fill('header').join('')
          }
        }
      };

      console.log('📏 Large data size:', JSON.stringify(largeData).length, 'bytes');
      
      const saveResult = await dynamoDBService.saveDraft(largeData, largeData.applicantId);
      setHybridStorageTest({ 
        success: saveResult, 
        message: saveResult ? 'Large data saved successfully with hybrid storage' : 'Failed to save large data' 
      });
      
      if (saveResult) {
        // Clean up test data
        await dynamoDBService.deleteDraft(largeData.applicantId, largeData.reference_id);
        console.log('✅ Test data cleaned up');
      }
      
    } catch (error: any) {
      console.error('🧪 Large data test error:', error);
      setHybridStorageTest({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>🔑 AWS Credentials Debug</CardTitle>
          <CardDescription>
            Test AWS credentials and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testCredentials} disabled={loading}>
              Test Temporary Credentials
            </Button>
            <Button onClick={testAwsConfig} disabled={loading}>
              Test AWS Configuration
            </Button>
            <Button onClick={testS3Credentials} disabled={loading}>
              Test S3 Credentials
            </Button>
          </div>

          {credentials && (
            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-semibold mb-2">Current Credentials:</h4>
              <pre className="text-sm">
                {JSON.stringify({
                  hasAccessKey: !!credentials.accessKeyId,
                  hasSecretKey: !!credentials.secretAccessKey,
                  hasSessionToken: !!credentials.sessionToken,
                  expiration: credentials.expiration
                }, null, 2)}
              </pre>
            </div>
          )}

          {Object.keys(testResults).length > 0 && (
            <div className={`p-4 rounded ${testResults.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h4 className="font-semibold mb-2">Test Results:</h4>
              <p>{testResults.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🧪 Hybrid Storage Test</CardTitle>
          <CardDescription>
            Test DynamoDB hybrid storage functionality for large data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testHybridStorage} disabled={loading}>
              Test Hybrid Storage
            </Button>
            <Button onClick={testLargeDataSave} disabled={loading}>
              Test Large Data Save
            </Button>
          </div>

          {Object.keys(hybridStorageTest).length > 0 && (
            <div className={`p-4 rounded ${hybridStorageTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h4 className="font-semibold mb-2">Hybrid Storage Test Results:</h4>
              <p>{hybridStorageTest.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
