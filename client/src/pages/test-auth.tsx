import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Shield, CheckCircle, XCircle } from 'lucide-react';
import UserProfile from '@/components/user-profile';

const TestAuthPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#f2f8fe' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <span>Authentication Status</span>
            </CardTitle>
            <CardDescription>
              Test page to verify AWS Cognito authentication setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Authentication Status:</span>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Authenticated</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <XCircle className="h-3 w-3" />
                    <span>Not Authenticated</span>
                  </div>
                )}
              </Badge>
            </div>

            {isAuthenticated && user && (
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Username</p>
                    <p className="text-sm text-gray-600">{user.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">User ID</p>
                    <p className="text-sm text-gray-600">{user.id}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isAuthenticated && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Profile Component</CardTitle>
                <CardDescription>
                  Test the user profile component
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserProfile />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication Features</CardTitle>
                <CardDescription>
                  Test various authentication features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Available Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ User registration with email verification</li>
                    <li>✅ OTP verification for new accounts</li>
                    <li>✅ User sign-in with credentials</li>
                    <li>✅ Forgot password with OTP reset</li>
                    <li>✅ Password reset functionality</li>
                    <li>✅ Protected routes</li>
                    <li>✅ Session management</li>
                    <li>✅ User profile display</li>
                    <li>✅ Logout functionality</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium">Next Steps:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Configure AWS Cognito User Pool</li>
                    <li>• Set up environment variables</li>
                    <li>• Test all authentication flows</li>
                    <li>• Customize email templates</li>
                    <li>• Add additional security features</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle>Not Authenticated</CardTitle>
              <CardDescription>
                You need to sign in to access this page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/login">Go to Login</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestAuthPage; 