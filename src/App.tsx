import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Loading from "./pages/Loading";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Paywall from "./pages/Paywall";
import Reminder from "./pages/Reminder";
import Workout from "./pages/Workout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/loading" 
            element={
              <ProtectedRoute>
                <Loading />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/workout" 
            element={
              <ProtectedRoute>
                <Workout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/paywall" 
            element={
              <ProtectedRoute>
                <Paywall />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reminder" 
            element={
              <ProtectedRoute>
                <Reminder />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
