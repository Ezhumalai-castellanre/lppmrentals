import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';

export function TestSidebar() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <div className="flex h-16 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Test Sidebar</h1>
          </div>
        </div>
        <div className="flex-1 p-4">
          <h2>Sidebar Test Page</h2>
          <p>This is a test page to verify the sidebar is working correctly.</p>
        </div>
      </main>
    </SidebarProvider>
  );
} 