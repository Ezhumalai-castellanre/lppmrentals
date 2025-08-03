import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/protected-route";
import NavHeader from "@/components/nav-header";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
    <SidebarProvider>
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex-1" />
            </div>
          </header>
          <main className="flex-1 overflow-auto" style={{ backgroundColor: '#f2f8fe' }}>
            {children}
          </main>
        </div>
      </div>
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
