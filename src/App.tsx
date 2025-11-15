import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OTPVerification from "./pages/OTPVerification";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import RankSelection from "./pages/RankSelection";
import RankBannerCreate from "./pages/RankBannerCreate";
import BannerSettings from "./pages/BannerSettings";
import BannerPreview from "./pages/BannerPreview";
import AdminStickers from "./pages/AdminStickers";
import AdminTemplates from "./pages/AdminTemplates";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes - no auth required */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/otp-verification" element={<OTPVerification />} />
          
          {/* Protected routes - auth required */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/categories" element={<AuthGuard><Categories /></AuthGuard>} />
          <Route path="/category/:slug" element={<AuthGuard><ComingSoon /></AuthGuard>} />
          <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/profile-edit" element={<AuthGuard><ProfileEdit /></AuthGuard>} />
          <Route path="/rank-selection" element={<AuthGuard><RankSelection /></AuthGuard>} />
          <Route path="/rank-banner-create/:rankId" element={<AuthGuard><RankBannerCreate /></AuthGuard>} />
          <Route path="/banner-settings" element={<AuthGuard><BannerSettings /></AuthGuard>} />
          <Route path="/banner-preview" element={<AuthGuard><BannerPreview /></AuthGuard>} />
          
          {/* Admin routes - auth required */}
          <Route path="/admin/stickers" element={<AuthGuard><AdminStickers /></AuthGuard>} />
          <Route path="/admin/templates" element={<AuthGuard><AdminTemplates /></AuthGuard>} />
          
          {/* Catch-all for undefined routes */}
          <Route path="*" element={<AuthGuard><ComingSoon /></AuthGuard>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
