import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ApplicationForm } from "@/components/application-form";
import MondayApplicationPage from "@/pages/monday-application";
import MissingDocumentsPage from "@/pages/missing-documents";
import MaintenancePage from "@/pages/maintenance";
import ApplicationsPage from "@/pages/applications";
import DraftsPage from "@/pages/drafts";
import StartNewApplicationPage from "@/pages/start-new-application";
import LoginPage from "@/pages/login";
import ChangePasswordPage from "@/pages/change-password";
import LandingPage from "@/pages/landing";
import NotFound from "@/pages/not-found";
import AvailableRentalsPage from "@/pages/available-rentals";
import PropertyDetailsPage from "@/pages/property-details";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { DebugAuth } from "@/components/debug-auth";
import "./lib/aws-config";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
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
        <div className="flex-1 p-4 bg-white">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      {/* Available Rentals route - Only for NON-authenticated users */}
      <Route path="/available-rentals">
        {!isAuthenticated ? (
          <AvailableRentalsPage />
        ) : (
          <LandingPage />
        )}
      </Route>
      
      {/* Property Details route - Only for NON-authenticated users */}
      <Route path="/property-details">
        {!isAuthenticated ? (
          <PropertyDetailsPage />
        ) : (
          <LandingPage />
        )}
      </Route>
      
      {/* Protected Routes - Only for authenticated users */}
      <Route path="/application">
        <ProtectedRoute>
          <AppLayout>
            <ApplicationForm />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/monday-application">
        <MondayApplicationPage />
      </Route>
      <Route path="/missing-documents">
        <ProtectedRoute>
          <AppLayout>
            <MissingDocumentsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/maintenance">
        <ProtectedRoute>
          <AppLayout>
            <MaintenancePage />
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
      
      <Route path="/drafts">
        <ProtectedRoute>
          <AppLayout>
            <DraftsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/start-new-application">
        <ProtectedRoute>
          <AppLayout>
            <StartNewApplicationPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Debug route for troubleshooting */}
      <Route path="/debug">
        <ProtectedRoute>
          <AppLayout>
            <div className="container mx-auto py-8">
              <DebugAuth />
            </div>
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
      
      {/* Root route - Conditional based on authentication */}
      <Route path="/">
        {isAuthenticated ? (
          <ProtectedRoute>
            <AppLayout>
              <DraftsPage />
            </AppLayout>
          </ProtectedRoute>
        ) : (
          <LandingPage />
        )}
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
