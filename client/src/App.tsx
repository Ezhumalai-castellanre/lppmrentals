import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/protected-route";
import NavHeader from "@/components/nav-header";
import RentalApplicationPage from "@/pages/rental-application";
import MissingDocumentsPage from "@/pages/missing-documents";
import LoginPage from "@/pages/login";
import TestAuthPage from "@/pages/test-auth";
import NotFound from "@/pages/not-found";
import "./lib/aws-config";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f2f8fe' }}>
      {isAuthenticated && <NavHeader />}
      <main className={isAuthenticated ? "pt-0" : ""}>
        {children}
      </main>
    </div>
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
