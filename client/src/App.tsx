import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TestSidebar } from "@/components/test-sidebar";
import SidebarDemo from "@/pages/sidebar-demo";
import RentalApplicationPage from "@/pages/rental-application";
import MissingDocumentsPage from "@/pages/missing-documents";
import ApplicationsPage from "@/pages/applications";
import LoginPage from "@/pages/login";
import TestAuthPage from "@/pages/test-auth";
import TestApplicationsPage from "@/pages/test-applications";
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
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <div className="flex h-16 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Rental Applications</h1>
          </div>
        </div>
        <div className="flex-1 p-4" style={{ backgroundColor: '#f2f8fe' }}>
          {children}
        </div>
      </main>
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
      <Route path="/test-sidebar">
        <ProtectedRoute>
          <TestSidebar />
        </ProtectedRoute>
      </Route>
      <Route path="/sidebar-demo">
        <ProtectedRoute>
          <SidebarDemo />
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
