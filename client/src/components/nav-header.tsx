import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { LogOut, Home, Lock, FileText, TestTube, Wrench } from 'lucide-react';
import LogoutButton from './logout-button';
import { useLocation } from 'wouter';
import { dynamoDBSeparateTablesUtils } from '../lib/dynamodb-separate-tables-service';

const NavHeader: React.FC = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasApplications, setHasApplications] = useState(false);
  const [hasSubmittedApplications, setHasSubmittedApplications] = useState(false);

  useEffect(() => {
    const checkApplications = async () => {
      if (!user) return;
      
      try {
        // Get all user data from separate tables
        const allData = await dynamoDBSeparateTablesUtils.getAllUserData();
        
        // Check if user has any data in any table
        const hasApplicationData = allData.application !== null;
        const hasApplicantData = allData.applicant !== null;
        const hasCoApplicantData = allData.coApplicant !== null;
        const hasGuarantorData = allData.guarantor !== null;
        
        const hasAnyApplications = hasApplicationData || hasApplicantData || hasCoApplicantData || hasGuarantorData;
        setHasApplications(hasAnyApplications);
        
        // Check for submitted applications
        const submittedApps = [];
        if (allData.application?.status === 'submitted') submittedApps.push(allData.application);
        if (allData.applicant?.status === 'submitted') submittedApps.push(allData.applicant);
        if (allData.coApplicant?.status === 'submitted') submittedApps.push(allData.coApplicant);
        if (allData.guarantor?.status === 'submitted') submittedApps.push(allData.guarantor);
        
        setHasSubmittedApplications(submittedApps.length > 0);
      } catch (err) {
        console.error('Error checking applications:', err);
        setHasApplications(false);
      }
    };

    checkApplications();
  }, [user]);

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

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image+(1).png" 
            alt="Logo" 
            className="h-10 w-40 object-contain md:mr-[76px] mr-[109px]"
          />
          <h1 className="text-xl font-semibold text-gray-900">
            Rental Applications
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Only show Missing Documents when there are submitted applications */}
          {hasSubmittedApplications && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/missing-documents')}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Missing Documents</span>
            </Button>
          )}
          
          {/* Only show Maintenance when there are submitted applications */}
          {hasSubmittedApplications && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/maintenance')}
              className="flex items-center space-x-2"
            >
              <Wrench className="h-4 w-4" />
              <span>Maintenance</span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/test-applications')}
            className="flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>Test API</span>
          </Button>
          
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