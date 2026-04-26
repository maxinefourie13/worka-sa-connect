import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Directory from "./pages/Directory.tsx";
import BusinessProfile from "./pages/BusinessProfile.tsx";
import Opportunities from "./pages/Opportunities.tsx";
import PostOpportunity from "./pages/PostOpportunity.tsx";
import Pricing from "./pages/Pricing.tsx";
import ListBusiness from "./pages/ListBusiness.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import { Login, Register, ForgotPassword } from "./pages/Auth.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/business/:slug" element={<BusinessProfile />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/opportunities/new" element={<PostOpportunity />} />
          <Route path="/opportunities/:id" element={<Opportunities />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/list" element={<ListBusiness />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
