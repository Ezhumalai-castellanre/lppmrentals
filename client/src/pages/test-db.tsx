import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestDBPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testUserRegistration = async () => {
    setLoading(true);
    try {
      const testUser = {
        cognitoUsername: `testuser_${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '1234567890'
      };

      console.log('🧪 Testing user registration with:', testUser);

      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser),
      });

      const result = await response.json();
      console.log('✅ Registration result:', result);

      if (response.ok) {
        // Test retrieving the user
        const getUserResponse = await fetch(`/api/users/${result.user.applicantId}`);
        const userResult = await getUserResponse.json();
        console.log('✅ User retrieval result:', userResult);

        setTestResults({
          registration: result,
          retrieval: userResult,
          success: true
        });
      } else {
        setTestResults({
          error: result,
          success: false
        });
      }
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const result = await response.json();
      console.log('✅ Health check result:', result);
      setTestResults({
        health: result,
        success: true
      });
    } catch (error) {
      console.error('❌ Health check failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testHealthCheck} disabled={loading}>
              🏥 Test Health Check
            </Button>
            <Button onClick={testUserRegistration} disabled={loading}>
              👤 Test User Registration
            </Button>
          </div>

          {loading && (
            <div className="text-blue-600">🔄 Testing...</div>
          )}

          {testResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {testResults.success && testResults.registration && (
                <div className="text-green-600">
                  ✅ Database connection working! ApplicantId generated: {testResults.registration.user.applicantId}
                </div>
              )}

              {!testResults.success && (
                <div className="text-red-600">
                  ❌ Test failed: {testResults.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 