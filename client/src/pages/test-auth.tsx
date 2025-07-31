import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { generateTimezoneBasedUUID, isValidTimezoneUUID } from '@/lib/utils';
import { triggerAwsDebug } from '@/lib/aws-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);

  const runTests = async () => {
    console.log('🧪 Running comprehensive tests...');
    
    const results = {
      timezoneUUID: {
        generated: generateTimezoneBasedUUID(),
        isValid: isValidTimezoneUUID(generateTimezoneBasedUUID()),
      },
      user: {
        isAuthenticated,
        hasUser: !!user,
        applicantId: user?.applicantId,
        email: user?.email,
        username: user?.username,
      },
      awsDebug: null as any,
    };

    try {
      console.log('🔍 Testing AWS configuration...');
      await triggerAwsDebug();
      results.awsDebug = 'AWS debug completed - check console';
    } catch (error) {
      results.awsDebug = `AWS debug failed: ${error}`;
    }

    setTestResults(results);
    console.log('✅ Test results:', results);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Authentication & Timezone UUID Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTests} className="w-full">
            🧪 Run All Tests
          </Button>

          {testResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Timezone UUID Test</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(testResults.timezoneUUID, null, 2)}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User Authentication Test</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(testResults.user, null, 2)}
                    </pre>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm">AWS Debug Test</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {testResults.awsDebug}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Current Status:</h3>
            <div className="space-y-2">
              <div>Authentication: {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}</div>
              <div>User: {user ? '✅ User exists' : '❌ No user'}</div>
              <div>ApplicantId: {user?.applicantId || '❌ No applicantId'}</div>
              <div>Email: {user?.email || '❌ No email'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 