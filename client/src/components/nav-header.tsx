import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LogOut, Home, Lock, FileText, Menu, X, User, Shield, Settings } from 'lucide-react';
import LogoutButton from './logout-button';
import { useLocation } from 'wouter';

const NavHeader: React.FC = () => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleNavigation = (path: string) => {
    setLocation(path);
    if (isMobile) {
      closeSidebar();
    }
  };

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isSidebarOpen]);

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 touch-manipulation"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Home className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              Rental Applications
            </h1>
          </div>

          {/* Mobile User Menu */}
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              {user.name || user.given_name || user.email?.split('@')[0] || 'User'}
            </Badge>
            
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full touch-manipulation">
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
                    showIcon={false}
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
              <span>Supporting Documents</span>
            </Button>
          </nav>

          {/* Advanced User Profile Section */}
          <div className="border-t border-gray-200">
            {/* Profile Header */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-lg">
                    <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {getInitials(user.name || user.given_name || user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name || user.given_name || user.username}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {user.email}
                  </p>
                  {user.zoneinfo && (
                    <Badge variant="outline" className="mt-1 text-xs bg-blue-50 text-blue-700 border-blue-200" style={{ fontSize: '10px' }}>
                      {user.zoneinfo}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 space-y-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/change-password')}
                className="w-full justify-start h-10 group hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <Lock className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="font-medium">Change Password</span>
                </div>
              </Button>
              


              <div className="pt-2">
                <LogoutButton 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-start h-10 group hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                  showIcon={false}
                >
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-red-100 group-hover:bg-red-200 transition-colors">
                      <LogOut className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <span className="font-medium">Sign out</span>
                  </div>
                </LogoutButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out" 
            onClick={closeSidebar}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
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
                className="p-2 touch-manipulation"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-3">
              <Button 
                variant={isActiveRoute('/') ? "default" : "ghost"}
                size="lg"
                onClick={() => handleNavigation('/')}
                className="w-full justify-start h-12 text-base"
              >
                <Home className="mr-3 h-5 w-5" />
                <span>Home</span>
              </Button>

              <Button 
                variant={isActiveRoute('/missing-documents') ? "default" : "ghost"}
                size="lg"
                onClick={() => handleNavigation('/missing-documents')}
                className="w-full justify-start h-12 text-base"
              >
                <FileText className="mr-3 h-5 w-5" />
                <span>Supporting Documents</span>
              </Button>
            </nav>

            {/* Mobile Advanced User Profile Section */}
            <div className="border-t border-gray-200">
              {/* Profile Header */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-lg">
                      <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {getInitials(user.name || user.given_name || user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.name || user.given_name || user.username}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {user.email}
                    </p>
                    {user.zoneinfo && (
                      <Badge variant="outline" className="mt-1 text-xs bg-blue-50 text-blue-700 border-blue-200" style={{ fontSize: '10px' }}>
                        {user.zoneinfo}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleNavigation('/change-password')}
                  className="w-full justify-start h-10 group hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-blue-100 group-hover:bg-blue-200 transition-colors">
                      <Lock className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="font-medium">Change Password</span>
                  </div>
                </Button>
                


                <div className="pt-2">
                  <LogoutButton 
                    variant="ghost" 
                    size="sm"
                    className="w-full justify-start h-10 group hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                    showIcon={false}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-md bg-red-100 group-hover:bg-red-200 transition-colors">
                        <LogOut className="h-3.5 w-3.5 text-red-600" />
                      </div>
                      <span className="font-medium">Sign out</span>
                    </div>
                  </LogoutButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavHeader; 