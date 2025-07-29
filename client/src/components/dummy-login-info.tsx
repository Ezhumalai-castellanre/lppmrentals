import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DummyLoginInfo: React.FC = () => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const dummyUsers = [
    { username: 'admin', email: 'admin@example.com', password: 'admin123' },
    { username: 'user', email: 'user@example.com', password: 'user123' },
    { username: 'test', email: 'test@example.com', password: 'test123' },
  ];

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🧪 Dummy Login Credentials
          <Badge variant="secondary" className="text-xs">TEST MODE</Badge>
        </CardTitle>
        <CardDescription>
          Use these credentials to test the login functionality without AWS Cognito setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {dummyUsers.map((user, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">User {index + 1}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${user.username}:${user.password}`, `user${index}`)}
                className="h-6 px-2 text-xs"
              >
                {copiedField === `user${index}` ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Username:</span>
                <div className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {user.username}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Password:</span>
                <div className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {user.password}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Email: {user.email}
            </div>
          </div>
        ))}
        
        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
          <strong>Note:</strong> This is a dummy authentication system for testing. 
          Set <code className="bg-blue-100 px-1 rounded">DUMMY_MODE = false</code> in 
          <code className="bg-blue-100 px-1 rounded">use-auth.tsx</code> to use real AWS Cognito.
        </div>
      </CardContent>
    </Card>
  );
};

export default DummyLoginInfo; 