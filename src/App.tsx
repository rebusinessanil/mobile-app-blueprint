import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, memo } from "react";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import OfflineBanner from "@/components/OfflineBanner";
import AuthGuard from "@/components/AuthGuard";
import { queryClient } from "@/lib/queryConfig";

// Critical path - load immediately
import Login from "./pages/Login";
import Register from "./pages/Register";

// Lazy load all non-critical pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Categories = lazy(() => import("./pages/Categories"));
const Messages = lazy(() => import("./pages/Messages"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const RankSelection = lazy(() => import("./pages/RankSelection"));
const RankBannerCreate = lazy(() => import("./pages/RankBannerCreate"));
const BonanzaTripsSelection = lazy(() => import("./pages/BonanzaTripsSelection"));
const BonanzaBannerCreate = lazy(() => import("./pages/BonanzaBannerCreate"));
const BirthdaysSelection = lazy(() => import("./pages/BirthdaysSelection"));
const BirthdayBannerCreate = lazy(() => import("./pages/BirthdayBannerCreate"));
const AnniversariesSelection = lazy(() => import("./pages/AnniversariesSelection"));
const AnniversaryBannerCreate = lazy(() => import("./pages/AnniversaryBannerCreate"));
const MotivationalBannersSelection = lazy(() => import("./pages/MotivationalBannersSelection"));
const MotivationalBannerCreate = lazy(() => import("./pages/MotivationalBannerCreate"));
const FestivalSelection = lazy(() => import("./pages/FestivalSelection"));
const FestivalBannerCreate = lazy(() => import("./pages/FestivalBannerCreate"));
const FestivalPreview = lazy(() => import("./pages/FestivalPreview"));
const MotivationalPreview = lazy(() => import("./pages/MotivationalPreview"));
const StoryBannerCreate = lazy(() => import("./pages/StoryBannerCreate"));
const StoryPreview = lazy(() => import("./pages/StoryPreview"));
const BannerSettings = lazy(() => import("./pages/BannerSettings"));
const BannerPreview = lazy(() => import("./pages/BannerPreview"));
const Wallet = lazy(() => import("./pages/Wallet"));
const MyDownloads = lazy(() => import("./pages/MyDownloads"));
const Transactions = lazy(() => import("./pages/Transactions"));
const UniversalBannerCreate = lazy(() => import("./pages/UniversalBannerCreate"));
const ChangePin = lazy(() => import("./pages/ChangePin"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const OTPVerification = lazy(() => import("./pages/OTPVerification"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MeetingBannerCreate = lazy(() => import("./pages/MeetingBannerCreate"));

// Admin pages - lazy load (rarely accessed)
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminTemplates = lazy(() => import("./pages/AdminTemplates"));
const AdminStories = lazy(() => import("./pages/AdminStories"));
const AdminAutoStories = lazy(() => import("./pages/AdminAutoStories"));
const AdminRanks = lazy(() => import("./pages/AdminRanks"));
const AdminStickers = lazy(() => import("./pages/AdminStickers"));
const AdminRankStickers = lazy(() => import("./pages/AdminRankStickers"));
const AdminBannerDefaults = lazy(() => import("./pages/AdminBannerDefaults"));
const AdminBannerPreviewDefaults = lazy(() => import("./pages/AdminBannerPreviewDefaults"));
const AdminTemplateBackgrounds = lazy(() => import("./pages/AdminTemplateBackgrounds"));
const AdminStickerLibrary = lazy(() => import("./pages/AdminStickerLibrary"));

// Minimal loading fallback - GPU accelerated
const PageLoader = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin transform-gpu" />
  </div>
));
PageLoader.displayName = 'PageLoader';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OfflineBanner />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes - no auth required */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/otp-verification" element={<OTPVerification />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
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
            <Route path="/change-pin" element={<AuthGuard><ChangePin /></AuthGuard>} />
            <Route path="/banner-create/:category" element={<AuthGuard><UniversalBannerCreate /></AuthGuard>} />
            <Route path="/banner-create/bonanza" element={<AuthGuard><BonanzaBannerCreate /></AuthGuard>} />
            <Route path="/banner-create/birthday" element={<AuthGuard><BirthdayBannerCreate /></AuthGuard>} />
            <Route path="/banner-create/anniversary" element={<AuthGuard><AnniversaryBannerCreate /></AuthGuard>} />
            <Route path="/banner-create/motivational" element={<AuthGuard><MotivationalBannerCreate /></AuthGuard>} />
            <Route path="/banner-create/festival" element={<AuthGuard><FestivalBannerCreate /></AuthGuard>} />
            <Route path="/banner-create/meeting" element={<AuthGuard><MeetingBannerCreate /></AuthGuard>} />
            <Route path="/create/festival-banner" element={<AuthGuard><FestivalSelection /></AuthGuard>} />
            <Route path="/festival-preview/:festivalId" element={<AuthGuard><FestivalPreview /></AuthGuard>} />
            <Route path="/motivational-preview/:motivationalBannerId" element={<AuthGuard><MotivationalPreview /></AuthGuard>} />
            <Route path="/story/:storyId" element={<AuthGuard><StoryBannerCreate /></AuthGuard>} />
            <Route path="/story-preview/:eventId" element={<AuthGuard><StoryPreview /></AuthGuard>} />
            
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
        </Suspense>
        <WhatsAppSupport />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
