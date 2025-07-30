import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAwsCredentials } from '@/lib/aws-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const TestAuthPage: React.FC = () => {
  const { user, isAuthenticated, signOut, clearAuthState } = useAuth();
  const [credentials, setCredentials] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [configStatus, setConfigStatus] = React.useState<any>(null);

  const checkConfiguration = () => {
    const config = {
      userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
      region: import.meta.env.VITE_AWS_REGION,
    };

    const status = {
      userPoolConfigured: !!config.userPoolId && config.userPoolId !== 'YOUR_USER_POOL_ID_HERE',
      userPoolClientConfigured: !!config.userPoolClientId && config.userPoolClientId !== 'YOUR_APP_CLIENT_ID_HERE',
      identityPoolConfigured: !!config.identityPoolId,
      regionConfigured: !!config.region,
      allConfigured: config.userPoolId && config.userPoolClientId && config.identityPoolId && config.region,
    };

    setConfigStatus(status);
    return status;
  };

  const testIdentityPool = async () => {
    setLoading(true);
    try {
      const awsCredentials = await getAwsCredentials();
      setCredentials(awsCredentials);
      console.log('AWS Credentials:', awsCredentials);
    } catch (error) {
      console.error('Error getting AWS credentials:', error);
      setCredentials(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkConfiguration();
  }, []);

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#f2f8fe' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">AWS Cognito Authentication Test</CardTitle>
            <CardDescription>
              Test your User Pool authentication and Identity Pool credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Configuration Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuration Status</h3>
              {configStatus && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={configStatus.userPoolConfigured ? "default" : "destructive"}>
                      {configStatus.userPoolConfigured ? "User Pool ✓" : "User Pool ✗"}
                    </Badge>
                    <Badge variant={configStatus.userPoolClientConfigured ? "default" : "destructive"}>
                      {configStatus.userPoolClientConfigured ? "User Pool Client ✓" : "User Pool Client ✗"}
                    </Badge>
                    <Badge variant={configStatus.identityPoolConfigured ? "default" : "destructive"}>
                      {configStatus.identityPoolConfigured ? "Identity Pool ✓" : "Identity Pool ✗"}
                    </Badge>
                    <Badge variant={configStatus.regionConfigured ? "default" : "destructive"}>
                      {configStatus.regionConfigured ? "Region ✓" : "Region ✗"}
                    </Badge>
                  </div>
                  
                  {!configStatus.allConfigured && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Some AWS Cognito configuration is missing. This may cause authentication issues.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Authentication Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Authentication Status</h3>
              <div className="flex items-center gap-2">
                <Badge variant={isAuthenticated ? "default" : "destructive"}>
                  {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* User Information */}
            {isAuthenticated && user && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">User ID</label>
                      <p className="text-sm">{user.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Username</label>
                      <p className="text-sm">{user.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-sm">{user.email}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Identity Pool Test */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Identity Pool Credentials</h3>
                  <p className="text-sm text-gray-600">
                    Test getting AWS credentials using your Identity Pool
                  </p>
                  
                  <div className="space-y-4">
                    <Button 
                      onClick={testIdentityPool} 
                      disabled={loading}
                      className="w-full md:w-auto"
                    >
                      {loading ? 'Getting Credentials...' : 'Get AWS Credentials'}
                    </Button>

                    {credentials && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">AWS Credentials:</h4>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(credentials, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Configuration Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-600">User Pool ID</label>
                      <p className="font-mono text-xs">{import.meta.env.VITE_AWS_USER_POOL_ID}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-600">Identity Pool ID</label>
                      <p className="font-mono text-xs">{import.meta.env.VITE_AWS_IDENTITY_POOL_ID || 'Not configured'}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-600">Region</label>
                      <p className="font-mono text-xs">{import.meta.env.VITE_AWS_REGION}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-600">User Pool Client ID</label>
                      <p className="font-mono text-xs">{import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Sign Out */}
            {isAuthenticated && (
              <>
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button onClick={clearAuthState} variant="outline">
                    Clear Auth State
                  </Button>
                  <Button onClick={signOut} variant="outline">
                    Sign Out
                  </Button>
                </div>
              </>
            )}

            {/* Not Authenticated Message */}
            {!isAuthenticated && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  You need to be authenticated to test Identity Pool credentials.
                </p>
                <div className="flex justify-center gap-2">
                  <Button onClick={clearAuthState} variant="outline">
                    Clear Auth State
                  </Button>
                  <Button asChild>
                    <a href="/login">Go to Login</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAuthPage; 