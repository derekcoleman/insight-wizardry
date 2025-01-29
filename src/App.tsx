import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SeoStrategy from "./pages/SeoStrategy";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    console.error("Missing VITE_GOOGLE_CLIENT_ID environment variable");
    return <div>Error: Missing Google Client ID configuration</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <BrowserRouter basename="/">
          <TooltipProvider>
            <AppLayout>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/seo-strategy" element={<SeoStrategy />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/auth" element={<Auth />} />
              </Routes>
            </AppLayout>
          </TooltipProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
};

export default App;