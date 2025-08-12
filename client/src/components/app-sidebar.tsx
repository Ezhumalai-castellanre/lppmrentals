import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { dynamoDBService } from '@/lib/dynamodb-service';
import { 
  Home, 
  FileText, 
  Wrench,
  Lock, 
  LogOut,
  User,
  Building,
  Clock,
  Plus
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LogoutButton from './logout-button';

export function AppSidebar() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [hasExistingDraft, setHasExistingDraft] = useState(false);
  const [isCheckingDrafts, setIsCheckingDrafts] = useState(false);
  const [currentDraftStep, setCurrentDraftStep] = useState<number | null>(null);

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

  // Check for existing drafts when user changes
  useEffect(() => {
    const checkForExistingDrafts = async () => {
      if (!user) return;
      
      setIsCheckingDrafts(true);
      try {
        // Check if user has existing drafts
        const userZoneinfo = user.zoneinfo || user.applicantId;
        if (userZoneinfo) {
          const drafts = await dynamoDBService.getAllDrafts(userZoneinfo);
          console.log('📋 All drafts found:', drafts);
          
          // Only consider drafts with 'draft' status
          const draftDrafts = drafts ? drafts.filter(draft => draft.status === 'draft') : [];
          console.log('📋 Draft status drafts:', draftDrafts);
          
          if (draftDrafts.length > 0) {
            const mostRecentDraft = draftDrafts
              .sort((a, b) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime())[0];
            
            console.log('📋 Most recent draft:', mostRecentDraft);
            
            if (mostRecentDraft && mostRecentDraft.current_step !== undefined && mostRecentDraft.current_step !== null) {
              setCurrentDraftStep(mostRecentDraft.current_step);
              setHasExistingDraft(true);
              console.log('📍 Found current draft step:', mostRecentDraft.current_step);
            } else {
              console.log('⚠️ No valid current_step found in most recent draft');
              setCurrentDraftStep(null);
              setHasExistingDraft(false);
            }
          } else {
            console.log('⚠️ No drafts with status "draft" found');
            setCurrentDraftStep(null);
            setHasExistingDraft(false);
          }
        } else {
          console.log('⚠️ No userZoneinfo found');
          setCurrentDraftStep(null);
          setHasExistingDraft(false);
        }
      } catch (error) {
        console.error('Error checking for existing drafts:', error);
        setHasExistingDraft(false);
      } finally {
        setIsCheckingDrafts(false);
      }
    };

    checkForExistingDrafts();
  }, [user]);

  // Handle application navigation
  const handleApplicationNavigation = () => {
    if (hasExistingDraft && currentDraftStep !== null) {
      // If there's an existing draft with a current step, navigate to continue it at that step
      console.log('🔄 Navigating to continue application at step:', currentDraftStep);
      setLocation(`/application?continue=true&step=${currentDraftStep}`);
    } else if (hasExistingDraft) {
      // If there's an existing draft but no step info, navigate to continue it
      console.log('🔄 Navigating to continue application (no step info)');
      setLocation('/application?continue=true');
    } else {
      // If no draft exists, start fresh
      console.log('🆕 Starting new application');
      setLocation('/application');
    }
  };

  const navigationItems = [
    // Only show application option if there's a valid draft with step info
    ...(hasExistingDraft && currentDraftStep !== null ? [{
      title: `Continue from Step ${currentDraftStep + 1}`,
      url: "/application",
      icon: FileText,
      onClick: () => setLocation(`/application?continue=true&step=${currentDraftStep}`),
    }] : []),
    {
      title: "My Applications",
      url: "/drafts",
      icon: Clock,
    },
    {
      title: "Missing Documents",
      url: "/missing-documents",
      icon: FileText,
    },
    {
      title: "Maintenance",
      url: "/maintenance",
      icon: Wrench,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center px-2">
          <img 
            src="https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image+(1).png" 
            alt="Logo" 
            className="h-12 w-40 object-contain md:mr-[76px] mr-[109px]"
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    onClick={item.onClick || (() => setLocation(item.url))}
                  >
                    <item.icon />
                    <span>{item.title}</span>

                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(user.name || user.given_name || user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name || user.given_name || user.username}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-popper-anchor-width]" side="top">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.name || user.given_name || user.username}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {hasExistingDraft && currentDraftStep !== null && (
                        <DropdownMenuItem 
                          onClick={() => setLocation(`/application?continue=true&step=${currentDraftStep}`)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          <span>
                            Continue from Step {currentDraftStep + 1}
                          </span>

                        </DropdownMenuItem>
                      )}
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
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
} 