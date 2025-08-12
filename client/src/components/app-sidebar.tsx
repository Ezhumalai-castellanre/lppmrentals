import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home, 
  FileText, 
  Wrench,
  Lock, 
  LogOut,
  User,
  Building,
  Clock
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

  const navigationItems = [
    {
      title: "Start New Application",
      url: "/application",
      icon: FileText,
    },
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
                    onClick={() => setLocation(item.url)}
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
                      <DropdownMenuItem onClick={() => setLocation('/application')}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Start New Application</span>
                      </DropdownMenuItem>
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