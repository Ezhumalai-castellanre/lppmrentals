import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LogOut, Home, Lock, FileText, Menu, X } from 'lucide-react';
import LogoutButton from './logout-button';
import { useLocation } from 'wouter';

const NavHeader: React.FC = () => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Home className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Rental Applications
            </h1>
          </div>

          {/* Mobile User Menu */}
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

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center space-x-3 px-6 py-4 border-b border-gray-200">
            <Home className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Rental Applications
            </h1>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Button 
              variant={isActiveRoute('/') ? "default" : "ghost"}
              size="lg"
              onClick={() => setLocation('/')}
              className="w-full justify-start"
            >
              <Home className="mr-3 h-5 w-5" />
              <span>Home</span>
            </Button>

            <Button 
              variant={isActiveRoute('/missing-documents') ? "default" : "ghost"}
              size="lg"
              onClick={() => setLocation('/missing-documents')}
              className="w-full justify-start"
            >
              <FileText className="mr-3 h-5 w-5" />
              <span>Missing Documents</span>
            </Button>
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm font-medium">
                  {getInitials(user.name || user.given_name || user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || user.given_name || user.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
                {user.zoneinfo && (
                  <p className="text-xs text-gray-500 truncate">
                    ID: {user.zoneinfo}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/change-password')}
                className="w-full justify-start"
              >
                <Lock className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </Button>
              
              <LogoutButton 
                variant="ghost" 
                size="sm"
                className="w-full justify-start"
                showIcon={true}
              >
                Sign out
              </LogoutButton>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={closeSidebar} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Home className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Rental Applications
                </h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSidebar}
                className="p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              <Button 
                variant={isActiveRoute('/') ? "default" : "ghost"}
                size="lg"
                onClick={() => {
                  setLocation('/');
                  closeSidebar();
                }}
                className="w-full justify-start"
              >
                <Home className="mr-3 h-5 w-5" />
                <span>Home</span>
              </Button>

              <Button 
                variant={isActiveRoute('/missing-documents') ? "default" : "ghost"}
                size="lg"
                onClick={() => {
                  setLocation('/missing-documents');
                  closeSidebar();
                }}
                className="w-full justify-start"
              >
                <FileText className="mr-3 h-5 w-5" />
                <span>Missing Documents</span>
              </Button>
            </nav>

            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-medium">
                    {getInitials(user.name || user.given_name || user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name || user.given_name || user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                  {user.zoneinfo && (
                    <p className="text-xs text-gray-500 truncate">
                      ID: {user.zoneinfo}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setLocation('/change-password');
                    closeSidebar();
                  }}
                  className="w-full justify-start"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </Button>
                
                <LogoutButton 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-start"
                  showIcon={true}
                >
                  Sign out
                </LogoutButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavHeader; 