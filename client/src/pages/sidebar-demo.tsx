import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SidebarDemo() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <div className="flex h-16 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Sidebar Demo</h1>
            <Badge variant="secondary">Collapsible</Badge>
          </div>
        </div>
        <div className="flex-1 p-4" style={{ backgroundColor: '#f2f8fe' }}>
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Sidebar Features</CardTitle>
                <CardDescription>
                  This demo showcases the sidebar component with all its features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Collapsible</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        The sidebar can be collapsed to icons only or completely hidden.
                        Use the trigger button or press Cmd+B (Mac) / Ctrl+B (Windows).
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Responsive</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        On mobile devices, the sidebar becomes a slide-out drawer
                        that can be opened and closed with the trigger button.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Navigation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        The sidebar includes navigation items with icons and tooltips
                        when collapsed. Each item links to different pages.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">User Menu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        The footer contains a user dropdown menu with profile
                        information and account actions.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Keyboard Shortcuts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Cmd+B</Badge>
                        <span className="text-sm">Toggle sidebar (Mac)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Ctrl+B</Badge>
                        <span className="text-sm">Toggle sidebar (Windows/Linux)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
} 