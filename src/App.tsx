import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { initOneSignal, isPushConfigured } from "@/lib/push";
import EmailUnsubscribe from "./pages/EmailUnsubscribe.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Directory from "./pages/Directory.tsx";
import GroupLanding from "./pages/GroupLanding.tsx";
import BusinessProfile from "./pages/BusinessProfile.tsx";
import Opportunities from "./pages/Opportunities.tsx";
import PostOpportunity from "./pages/PostOpportunity.tsx";
import LeadDetail from "./pages/LeadDetail.tsx";
import Pricing from "./pages/Pricing.tsx";

// Redirect helper for legacy /opportunities/:id → /requests/:id
const RedirectRequestById = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/requests/${id}` : "/requests"} replace />;
};
import ListBusiness from "./pages/ListBusiness.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CategoryLocationPage from "./pages/CategoryLocationPage.tsx";
import { Login, Register, ForgotPassword, ResetPassword } from "./pages/Auth.tsx";
import PublicQuote from "./pages/PublicQuote.tsx";
import VerifiedReviewPage from "./pages/VerifiedReviewPage.tsx";
import FoundingMembersAdmin from "./pages/admin/FoundingMembers.tsx";
import ConciergeAdmin from "./pages/admin/Concierge.tsx";
import DisputesAdmin from "./pages/admin/Disputes.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";

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
                <Route path="/" element={<ComingSoon />} />
                <Route path="/preview-home" element={<Index />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/directory/g/:groupSlug" element={<GroupLanding />} />
                <Route path="/business/:slug" element={<BusinessProfile />} />
                {/* Customer-facing: Requests */}
                <Route path="/requests" element={<Opportunities />} />
                <Route path="/requests/new" element={<ProtectedRoute><PostOpportunity /></ProtectedRoute>} />
                <Route path="/requests/:id" element={<LeadDetail />} />
                {/* Pro-facing: Leads (same board, different framing) */}
                <Route path="/leads" element={<Opportunities />} />
                <Route path="/leads/:id" element={<LeadDetail />} />
                {/* Legacy redirects */}
                <Route path="/opportunities" element={<Navigate to="/requests" replace />} />
                <Route path="/opportunities/new" element={<Navigate to="/requests/new" replace />} />
                <Route path="/opportunities/:id" element={<RedirectRequestById />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/list" element={<ProtectedRoute><ListBusiness /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/founding-members" element={<ProtectedRoute><FoundingMembersAdmin /></ProtectedRoute>} />
                <Route path="/admin/concierge" element={<ProtectedRoute><ConciergeAdmin /></ProtectedRoute>} />
                <Route path="/admin/disputes" element={<ProtectedRoute><DisputesAdmin /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* Programmatic SEO routes — root-level: /:cat / :cat/:province / :cat/:province/:city */}
                <Route path="/:categorySlug" element={<CategoryLocationPage />} />
                <Route path="/:categorySlug/:provinceSlug" element={<CategoryLocationPage />} />
                <Route path="/:categorySlug/:provinceSlug/:citySlug" element={<CategoryLocationPage />} />
                <Route path="/email-preferences/unsubscribe" element={<EmailUnsubscribe />} />
                <Route path="/unsubscribe" element={<EmailUnsubscribe />} />
                <Route path="/quote/:id" element={<PublicQuote />} />
                <Route path="/quote/:id/review" element={<VerifiedReviewPage />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
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
