import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { initOneSignal, isPushConfigured } from "@/lib/push";
import EmailUnsubscribe from "./pages/EmailUnsubscribe.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { KlapProvider } from "@/lib/klapStore";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Directory from "./pages/Directory.tsx";
import GroupLanding from "./pages/GroupLanding.tsx";
import BusinessProfile from "./pages/BusinessProfile.tsx";
import Opportunities from "./pages/Opportunities.tsx";
import PostOpportunity from "./pages/PostOpportunity.tsx";
import Pricing from "./pages/Pricing.tsx";
import ListBusiness from "./pages/ListBusiness.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CategoryLocationPage from "./pages/CategoryLocationPage.tsx";
import { Login, Register, ForgotPassword, ResetPassword } from "./pages/Auth.tsx";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    if (isPushConfigured()) initOneSignal();
  }, []);
  return (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <KlapProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/directory/g/:groupSlug" element={<GroupLanding />} />
                <Route path="/business/:slug" element={<BusinessProfile />} />
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/opportunities/new" element={<ProtectedRoute><PostOpportunity /></ProtectedRoute>} />
                <Route path="/opportunities/:id" element={<Opportunities />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/list" element={<ProtectedRoute><ListBusiness /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* Programmatic SEO routes */}
                <Route path="/services/:categorySlug" element={<CategoryLocationPage />} />
                <Route path="/services/:categorySlug/:provinceSlug" element={<CategoryLocationPage />} />
                <Route path="/services/:categorySlug/:provinceSlug/:citySlug" element={<CategoryLocationPage />} />
                <Route path="/email-preferences/unsubscribe" element={<EmailUnsubscribe />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </KlapProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
