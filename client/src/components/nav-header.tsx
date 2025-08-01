import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LogOut, Home, Lock, FileText } from 'lucide-react';
import LogoutButton from './logout-button';
import { useLocation } from 'wouter';

const NavHeader: React.FC = () => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const isActiveRoute = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Home className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">
            Rental Applications
          </h1>
        </div>

        {/* Main Navigation */}
        <div className="flex items-center space-x-2">
          <Button 
            variant={isActiveRoute('/') ? "default" : "outline"}
            size="sm"
            onClick={() => setLocation('/')}
            className="flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>

          <Button 
            variant={isActiveRoute('/missing-documents') ? "default" : "outline"}
            size="sm"
            onClick={() => setLocation('/missing-documents')}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Missing Documents</span>
          </Button>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="text-xs">
            {user.name || user.given_name || user.email?.split('@')[0] || 'User'}
          </Badge>
          
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-sm font-medium">
                    {getInitials(user.name || user.given_name || user.username)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name || user.given_name || user.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  {user.zoneinfo && (
                    <p className="text-xs leading-none text-muted-foreground">
                      ID: {user.zoneinfo}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setLocation('/change-password')}>
                <Lock className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <LogoutButton 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-start"
                  showIcon={true}
                >
                  Sign out
                </LogoutButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default NavHeader; 