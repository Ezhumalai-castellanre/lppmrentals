import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { generateLppmUincid, isValidLppmUincid } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TestLppmSignupPage() {
  const { signUp, user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const generateTestUincid = () => {
    const uincid = generateLppmUincid();
    setTestResults({
      generated: uincid,
      isValid: isValidLppmUincid(uincid),
      timestamp: new Date().toISOString()
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      console.log('🧪 Testing LPPM-uincid signup with:', formData);
      
      await signUp(
        formData.username,
        formData.email,
        formData.password,
        undefined, // userAttributes
        formData.firstName,
        formData.lastName,
        formData.phoneNumber
      );

      setMessage({
        type: 'success',
        text: `✅ User signed up successfully! Check the console for LPPM-uincid details.`
      });

      console.log('✅ LPPM-uincid signup completed successfully');
    } catch (error) {
      console.error('❌ LPPM-uincid signup failed:', error);
      setMessage({
        type: 'error',
        text: `❌ Signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>LPPM-uincid Signup Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Generate Test Uincid */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Generate Test LPPM-uincid</h3>
            <Button onClick={generateTestUincid} variant="outline">
              🔧 Generate LPPM-uincid
            </Button>
            
            {testResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Generated LPPM-uincid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div><strong>Generated:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{testResults.generated}</code></div>
                    <div><strong>Valid:</strong> <span className={testResults.isValid ? "text-green-600" : "text-red-600"}>{testResults.isValid ? "✅ Yes" : "❌ No"}</span></div>
                    <div><strong>Timestamp:</strong> {testResults.timestamp}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Signup Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test LPPM-uincid Signup</h3>
            
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password"
                    style={{ textAlign: 'left', paddingLeft: '45px' }}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? '🔄 Creating Account...' : '👤 Create Account with LPPM-uincid'}
              </Button>
            </form>
          </div>

          {/* Message Display */}
          {message && (
            <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Current User Info */}
          {isAuthenticated && user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current User Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Username:</strong> {user.username}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Applicant ID:</strong> <code className="bg-gray-100 px-1 rounded">{user.applicantId || 'Not set'}</code></div>
                  <div><strong>Zoneinfo:</strong> <code className="bg-gray-100 px-1 rounded">{user.zoneinfo || 'Not set'}</code></div>
                  <div><strong>Name:</strong> {user.given_name} {user.family_name}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How it works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>1. When a new user signs up, a LPPM-uincid is generated in the format: <code>LPPM-YYYYMMDD-XXXXX</code></p>
              <p>2. This LPPM-uincid is stored in the <code>zoneinfo</code> attribute in Cognito</p>
              <p>3. During authentication, if zoneinfo contains a LPPM-uincid, it's used as the applicantId</p>
              <p>4. The format uses only numbers: YYYYMMDD (date) + XXXXX (sequential number)</p>
              <p>5. Example: <code>LPPM-20250731-12345</code></p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
} 