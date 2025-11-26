import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OTPVerification from "./pages/OTPVerification";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import RankSelection from "./pages/RankSelection";
import RankBannerCreate from "./pages/RankBannerCreate";
import BonanzaTripsSelection from "./pages/BonanzaTripsSelection";
import BonanzaBannerCreate from "./pages/BonanzaBannerCreate";
import BirthdaysSelection from "./pages/BirthdaysSelection";
import BirthdayBannerCreate from "./pages/BirthdayBannerCreate";
import AnniversariesSelection from "./pages/AnniversariesSelection";
import AnniversaryBannerCreate from "./pages/AnniversaryBannerCreate";
import MotivationalBannersSelection from "./pages/MotivationalBannersSelection";
import MotivationalBannerCreate from "./pages/MotivationalBannerCreate";
import FestivalSelection from "./pages/FestivalSelection";
import FestivalBannerCreate from "./pages/FestivalBannerCreate";
import FestivalPreview from "./pages/FestivalPreview";
import MotivationalPreview from "./pages/MotivationalPreview";
import StoryBannerCreate from "./pages/StoryBannerCreate";
import BannerSettings from "./pages/BannerSettings";
import BannerPreview from "./pages/BannerPreview";
import AdminStickers from "./pages/AdminStickers";
import AdminRankStickers from "./pages/AdminRankStickers";
import AdminTemplates from "./pages/AdminTemplates";
import AdminBannerDefaults from "./pages/AdminBannerDefaults";
import AdminBannerPreviewDefaults from "./pages/AdminBannerPreviewDefaults";
import AdminTemplateBackgrounds from "./pages/AdminTemplateBackgrounds";
import AdminRanks from "./pages/AdminRanks";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminStories from "./pages/AdminStories";
import AdminAutoStories from "./pages/AdminAutoStories";
import AdminStickerLibrary from "./pages/AdminStickerLibrary";
import Wallet from "./pages/Wallet";
import MyDownloads from "./pages/MyDownloads";
import Transactions from "./pages/Transactions";
import UniversalBannerCreate from "./pages/UniversalBannerCreate";

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
          <Route path="/profile-setup" element={<ProfileSetup />} />
          
          {/* Protected routes - auth required */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/categories" element={<AuthGuard><Categories /></AuthGuard>} />
          <Route path="/categories/bonanza-trips" element={<AuthGuard><BonanzaTripsSelection /></AuthGuard>} />
          <Route path="/categories/birthdays" element={<AuthGuard><BirthdaysSelection /></AuthGuard>} />
          <Route path="/categories/anniversaries" element={<AuthGuard><AnniversariesSelection /></AuthGuard>} />
          <Route path="/categories/motivational" element={<AuthGuard><MotivationalBannersSelection /></AuthGuard>} />
          <Route path="/categories/festival" element={<AuthGuard><FestivalSelection /></AuthGuard>} />
          <Route path="/category/:slug" element={<AuthGuard><ComingSoon /></AuthGuard>} />
          <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/profile-edit" element={<AuthGuard><ProfileEdit /></AuthGuard>} />
          <Route path="/rank-selection" element={<AuthGuard><RankSelection /></AuthGuard>} />
          <Route path="/rank-banner-create/:rankId" element={<AuthGuard><RankBannerCreate /></AuthGuard>} />
          <Route path="/banner-settings" element={<AuthGuard><BannerSettings /></AuthGuard>} />
          <Route path="/banner-preview" element={<AuthGuard><BannerPreview /></AuthGuard>} />
          <Route path="/wallet" element={<AuthGuard><Wallet /></AuthGuard>} />
          <Route path="/transactions" element={<AuthGuard><Transactions /></AuthGuard>} />
          <Route path="/my-downloads" element={<AuthGuard><MyDownloads /></AuthGuard>} />
          <Route path="/banner-create/:category" element={<AuthGuard><UniversalBannerCreate /></AuthGuard>} />
          <Route path="/banner-create/bonanza" element={<AuthGuard><BonanzaBannerCreate /></AuthGuard>} />
          <Route path="/banner-create/birthday" element={<AuthGuard><BirthdayBannerCreate /></AuthGuard>} />
          <Route path="/banner-create/anniversary" element={<AuthGuard><AnniversaryBannerCreate /></AuthGuard>} />
          <Route path="/banner-create/motivational" element={<AuthGuard><MotivationalBannerCreate /></AuthGuard>} />
          <Route path="/banner-create/festival" element={<AuthGuard><FestivalBannerCreate /></AuthGuard>} />
          <Route path="/create/festival-banner" element={<AuthGuard><FestivalSelection /></AuthGuard>} />
          <Route path="/festival-preview/:festivalId" element={<AuthGuard><FestivalPreview /></AuthGuard>} />
          <Route path="/motivational-preview/:motivationalBannerId" element={<AuthGuard><MotivationalPreview /></AuthGuard>} />
          <Route path="/story/:storyId" element={<AuthGuard><StoryBannerCreate /></AuthGuard>} />
          
          {/* Admin routes - auth required */}
          <Route path="/admin" element={<AuthGuard><AdminDashboard /></AuthGuard>} />
          <Route path="/admin/users" element={<AuthGuard><AdminUsers /></AuthGuard>} />
          <Route path="/admin/templates" element={<AuthGuard><AdminTemplates /></AuthGuard>} />
          <Route path="/admin/stories" element={<AuthGuard><AdminStories /></AuthGuard>} />
          <Route path="/admin/ranks" element={<AuthGuard><AdminRanks /></AuthGuard>} />
          <Route path="/admin/stickers" element={<AuthGuard><AdminStickers /></AuthGuard>} />
          <Route path="/admin/rank-stickers" element={<AuthGuard><AdminRankStickers /></AuthGuard>} />
          <Route path="/admin/banner-defaults" element={<AuthGuard><AdminBannerDefaults /></AuthGuard>} />
          <Route path="/admin/banner-preview-defaults" element={<AuthGuard><AdminBannerPreviewDefaults /></AuthGuard>} />
          <Route path="/admin/template-backgrounds" element={<AuthGuard><AdminTemplateBackgrounds /></AuthGuard>} />
          <Route path="/admin/sticker-library" element={<AuthGuard><AdminStickerLibrary /></AuthGuard>} />
          <Route path="/admin/auto-stories" element={<AuthGuard><AdminAutoStories /></AuthGuard>} />
          
          {/* Catch-all for undefined routes */}
          <Route path="*" element={<AuthGuard><ComingSoon /></AuthGuard>} />
        </Routes>
        <WhatsAppSupport />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
