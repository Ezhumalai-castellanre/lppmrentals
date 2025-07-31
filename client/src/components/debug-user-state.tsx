import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DebugUserState() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">🔍 User State Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">🔍 User State Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Authentication Status:</span>
          <Badge variant={isAuthenticated ? "default" : "destructive"}>
            {isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>
        
        {user ? (
          <div className="space-y-1 text-xs">
            <div><strong>User ID:</strong> {user.id}</div>
            <div><strong>Username:</strong> {user.username}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Applicant ID:</strong> 
              <span className={user.applicantId ? "text-green-600" : "text-red-600"}>
                {user.applicantId || "MISSING"}
              </span>
            </div>
            <div><strong>Zoneinfo:</strong> {user.zoneinfo || "None"}</div>
            <div><strong>Name:</strong> {user.name || "None"}</div>
            <div><strong>Given Name:</strong> {user.given_name || "None"}</div>
            <div><strong>Family Name:</strong> {user.family_name || "None"}</div>
            <div><strong>Phone:</strong> {user.phone_number || "None"}</div>
          </div>
        ) : (
          <div className="text-sm text-red-600">No user data available</div>
        )}
      </CardContent>
    </Card>
  );
} 