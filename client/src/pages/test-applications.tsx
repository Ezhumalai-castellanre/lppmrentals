import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function TestApplicationsPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const testApplicationsAPI = async () => {
    if (!user?.applicantId) {
      setTestResults({
        error: 'No applicant ID available',
        success: false
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🧪 Testing applications API with applicantId:', user.applicantId);

      const response = await fetch(`/api/applications/user/${user.applicantId}`);
      const result = await response.json();
      console.log('✅ Applications API result:', result);

      setTestResults({
        applications: result,
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      });
    } catch (error) {
      console.error('❌ Applications API test failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  const testAllApplicationsAPI = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing all applications API');

      const response = await fetch('/api/applications');
      const result = await response.json();
      console.log('✅ All applications API result:', result);

      setTestResults({
        allApplications: result,
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      });
    } catch (error) {
      console.error('❌ All applications API test failed:', error);
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
          <CardTitle>Applications API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Current User:</strong> {user?.email || 'Not logged in'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Applicant ID:</strong> {user?.applicantId || 'Not available'}
            </p>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={testApplicationsAPI} 
              disabled={loading || !user?.applicantId}
            >
              👤 Test User Applications
            </Button>
            <Button 
              onClick={testAllApplicationsAPI} 
              disabled={loading}
            >
              📋 Test All Applications
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

              {testResults.success && (
                <div className="text-green-600">
                  ✅ API endpoint working! 
                  {testResults.applications && (
                    <span> Found {testResults.applications.length} applications for user.</span>
                  )}
                  {testResults.allApplications && (
                    <span> Found {testResults.allApplications.length} total applications.</span>
                  )}
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