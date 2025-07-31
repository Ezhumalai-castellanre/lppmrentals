import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { generateLppmNumber, isValidLppmNumber } from '@/lib/utils';
import { triggerAwsDebug } from '@/lib/aws-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DebugUserState } from '@/components/debug-user-state';

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);

  const runTests = async () => {
    console.log('🧪 Running comprehensive tests...');
    
    const results = {
      lppmNumber: {
        generated: generateLppmNumber(),
        isValid: isValidLppmNumber(generateLppmNumber()),
      },
      user: {
        isAuthenticated,
        hasUser: !!user,
        applicantId: user?.applicantId,
        email: user?.email,
        username: user?.username,
        zoneinfo: user?.zoneinfo,
        fullUserObject: user,
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

  const forceAuthCheck = async () => {
    console.log('🔄 Forcing authentication check...');
    // This will trigger a re-check of the auth state
    window.location.reload();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Authentication & Lppm Number Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTests} className="w-full">
            🧪 Run All Tests
          </Button>
          
          <Button onClick={forceAuthCheck} variant="outline" className="w-full">
            🔄 Force Auth Check
          </Button>

          {/* Debug component */}
          <DebugUserState />

          {testResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Lppm Number Test</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(testResults.lppmNumber, null, 2)}
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
              <div className="flex items-center gap-2">
                <span className="font-medium">Authentication Status:</span>
                <span className={isAuthenticated ? "text-green-600" : "text-red-600"}>
                  {isAuthenticated ? "✅ Authenticated" : "❌ Not Authenticated"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">User Object:</span>
                <span className={user ? "text-green-600" : "text-red-600"}>
                  {user ? "✅ Present" : "❌ Missing"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Applicant ID:</span>
                <span className={user?.applicantId ? "text-green-600" : "text-red-600"}>
                  {user?.applicantId || "❌ Missing"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Zoneinfo:</span>
                <span className={user?.zoneinfo ? "text-blue-600" : "text-gray-600"}>
                  {user?.zoneinfo || "None"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 