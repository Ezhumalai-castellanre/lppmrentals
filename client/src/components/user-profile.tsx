import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, LogOut } from 'lucide-react';
import LogoutButton from './logout-button';

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-xl">{user.username}</CardTitle>
        <CardDescription>User Profile</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Username</p>
              <p className="text-sm text-gray-600">{user.username}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Member Since</p>
              <p className="text-sm text-gray-600">
                {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center pt-4">
          <Badge variant="secondary" className="text-xs">
            Verified Account
          </Badge>
        </div>
        
        <div className="pt-4">
          <LogoutButton 
            variant="destructive" 
            className="w-full"
            showIcon={true}
          >
            Sign Out
          </LogoutButton>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile; 