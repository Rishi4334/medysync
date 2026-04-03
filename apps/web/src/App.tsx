import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";
import { useRealtimeSync } from "@/lib/realtime";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import PatientsPage from "@/pages/patients";
import PatientDetailPage from "@/pages/patient-detail";
import CaretakersPage from "@/pages/caretakers";
import MedicinesPage from "@/pages/medicines";
import RemindersPage from "@/pages/reminders";
import EventsPage from "@/pages/events";
import DevicesPage from "@/pages/devices";
import AdherencePage from "@/pages/adherence";
import UsersPage from "@/pages/users";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  const [location] = useLocation();
  if (!user) {
    return <Redirect to="/login" />;
  }
  return <>{children}</>;
}

function Router() {
  const user = getCurrentUser();
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">{user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}</Route>
      <Route path="/dashboard"><RequireAuth><DashboardPage /></RequireAuth></Route>
      <Route path="/patients/:id"><RequireAuth><PatientDetailPage /></RequireAuth></Route>
      <Route path="/patients"><RequireAuth><PatientsPage /></RequireAuth></Route>
      <Route path="/caretakers"><RequireAuth><CaretakersPage /></RequireAuth></Route>
      <Route path="/medicines"><RequireAuth><MedicinesPage /></RequireAuth></Route>
      <Route path="/reminders"><RequireAuth><RemindersPage /></RequireAuth></Route>
      <Route path="/events"><RequireAuth><EventsPage /></RequireAuth></Route>
      <Route path="/devices"><RequireAuth><DevicesPage /></RequireAuth></Route>
      <Route path="/adherence"><RequireAuth><AdherencePage /></RequireAuth></Route>
      <Route path="/users"><RequireAuth><UsersPage /></RequireAuth></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function RealtimeBridge() {
  useRealtimeSync();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RealtimeBridge />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
