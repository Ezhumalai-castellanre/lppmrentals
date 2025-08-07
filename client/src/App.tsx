import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import RentalApplicationPage from "@/pages/rental-application";
import MondayApplicationPage from "@/pages/monday-application";
import MissingDocumentsPage from "@/pages/missing-documents";
import ApplicationsPage from "@/pages/applications";
import LoginPage from "@/pages/login";
import TestAuthPage from "@/pages/test-auth";
import TestApplicationsPage from "@/pages/test-applications";
import ChangePasswordPage from "@/pages/change-password";
import LandingPage from "@/pages/landing";
import NotFound from "@/pages/not-found";
import VacantUnitsTest from "@/components/vacant-units-test";
import AvailableRentalsPage from "@/pages/available-rentals";
import { DraftProvider, useDraft } from "@/contexts/DraftContext";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import "./lib/aws-config";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { isDraftSaved, draftSavedAt, saveDraft } = useDraft();
  
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
            {isDraftSaved && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full">
                <Save className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Draft Saved
                </span>
                {draftSavedAt && (
                  <span className="text-xs text-yellow-600">
                    {draftSavedAt.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              className="flex items-center text-sm px-3 py-1 bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
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
      
      {/* Protected Routes - Only for authenticated users */}
      <Route path="/application">
        <ProtectedRoute>
          <AppLayout>
            <RentalApplicationPage />
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
      <Route path="/test-auth">
        <ProtectedRoute>
          <AppLayout>
            <TestAuthPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/vacant-units-test">
        <ProtectedRoute>
          <AppLayout>
            <VacantUnitsTest />
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
              <ApplicationsPage />
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
        <DraftProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </DraftProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
