import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationProvider } from "@/components/NotificationToast";
import HubWorldPage from "@/pages/HubWorldPage";
import PrivacyQuestPage from "@/pages/PrivacyQuestPage";
import BreachDefensePage from "@/pages/BreachDefensePage";
import NotFound from "@/pages/not-found";

// Detect base path from Vite (set during GitHub Pages builds)
const base = import.meta.env.BASE_URL.replace(/\/$/, '') || '';

function Routes() {
  return (
    <Switch>
      <Route path="/" component={HubWorldPage} />
      <Route path="/privacy" component={PrivacyQuestPage} />
      <Route path="/breach" component={BreachDefensePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationProvider>
          <Toaster />
          <Router base={base}>
            <Routes />
          </Router>
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
