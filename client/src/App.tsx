import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/protected-route";
import NavHeader from "@/components/nav-header";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import RentalApplicationPage from "@/pages/rental-application";
import MissingDocumentsPage from "@/pages/missing-documents";
import ApplicationsPage from "@/pages/applications";
import LoginPage from "@/pages/login";
import TestAuthPage from "@/pages/test-auth";
import TestApplicationsPage from "@/pages/test-applications";
import SidebarDemoPage from "@/pages/sidebar-demo";
import ChangePasswordPage from "@/pages/change-password";
import NotFound from "@/pages/not-found";
import "./lib/aws-config";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f2f8fe' }}>
        <main>
          {children}
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="navbar-container h-14 px-4 md:px-6">
            <div className="navbar-left">
              <SidebarTrigger className="md:hidden navbar-item" />
              <div className="hidden md:block navbar-item">
                <h1 className="text-lg font-semibold">Rental Portal</h1>
              </div>
            </div>
            <div className="navbar-right">
              <div className="navbar-item">
                {/* Add any additional navbar items here */}
              </div>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col" style={{ backgroundColor: '#f2f8fe' }}>
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="max-w-7xl mx-auto w-full px-4 lg:px-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/test-auth">
        <ProtectedRoute>
          <AppLayout>
            <TestAuthPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/change-password">
        <ProtectedRoute>
          <AppLayout>
            <ChangePasswordPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <AppLayout>
            <RentalApplicationPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/missing-documents">
        <ProtectedRoute>
          <AppLayout>
            <MissingDocumentsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/applications">
        <ProtectedRoute>
          <AppLayout>
            <ApplicationsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/test-applications">
        <ProtectedRoute>
          <AppLayout>
            <TestApplicationsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/sidebar-demo">
        <ProtectedRoute>
          <AppLayout>
            <SidebarDemoPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
