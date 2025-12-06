import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, memo, Component, ReactNode } from "react";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import OfflineBanner from "@/components/OfflineBanner";
import AuthGuard from "@/components/AuthGuard";
import { queryClient } from "@/lib/queryConfig";

// Critical path - load immediately
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// Lazy load all non-critical pages with retry logic
const lazyWithRetry = (componentImport: () => Promise<{ default: React.ComponentType<unknown> }>) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      // Retry once on failure (handles HMR/chunk issues)
      console.warn('Lazy load failed, retrying...', error);
      return await componentImport();
    }
  });

const Categories = lazyWithRetry(() => import("./pages/Categories"));
const Messages = lazyWithRetry(() => import("./pages/Messages"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const ProfileEdit = lazyWithRetry(() => import("./pages/ProfileEdit"));
const RankSelection = lazyWithRetry(() => import("./pages/RankSelection"));
const RankBannerCreate = lazyWithRetry(() => import("./pages/RankBannerCreate"));
const BonanzaTripsSelection = lazyWithRetry(() => import("./pages/BonanzaTripsSelection"));
const BonanzaBannerCreate = lazyWithRetry(() => import("./pages/BonanzaBannerCreate"));
const BirthdaysSelection = lazyWithRetry(() => import("./pages/BirthdaysSelection"));
const BirthdayBannerCreate = lazyWithRetry(() => import("./pages/BirthdayBannerCreate"));
const AnniversariesSelection = lazyWithRetry(() => import("./pages/AnniversariesSelection"));
const AnniversaryBannerCreate = lazyWithRetry(() => import("./pages/AnniversaryBannerCreate"));
const MotivationalBannersSelection = lazyWithRetry(() => import("./pages/MotivationalBannersSelection"));
const MotivationalBannerCreate = lazyWithRetry(() => import("./pages/MotivationalBannerCreate"));
const FestivalSelection = lazyWithRetry(() => import("./pages/FestivalSelection"));
const FestivalBannerCreate = lazyWithRetry(() => import("./pages/FestivalBannerCreate"));
const FestivalPreview = lazyWithRetry(() => import("./pages/FestivalPreview"));
const MotivationalPreview = lazyWithRetry(() => import("./pages/MotivationalPreview"));
const StoryBannerCreate = lazyWithRetry(() => import("./pages/StoryBannerCreate"));
const StoryPreview = lazyWithRetry(() => import("./pages/StoryPreview"));
const BannerSettings = lazyWithRetry(() => import("./pages/BannerSettings"));
const BannerPreview = lazyWithRetry(() => import("./pages/BannerPreview"));
const Wallet = lazyWithRetry(() => import("./pages/Wallet"));
const MyDownloads = lazyWithRetry(() => import("./pages/MyDownloads"));
const Transactions = lazyWithRetry(() => import("./pages/Transactions"));
const UniversalBannerCreate = lazyWithRetry(() => import("./pages/UniversalBannerCreate"));
const ChangePin = lazyWithRetry(() => import("./pages/ChangePin"));
const AuthCallback = lazyWithRetry(() => import("./pages/AuthCallback"));
const OTPVerification = lazyWithRetry(() => import("./pages/OTPVerification"));
const ComingSoon = lazyWithRetry(() => import("./pages/ComingSoon"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const MeetingBannerCreate = lazyWithRetry(() => import("./pages/MeetingBannerCreate"));

// Admin pages - lazy load (rarely accessed)
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const AdminUsers = lazyWithRetry(() => import("./pages/AdminUsers"));
const AdminTemplates = lazyWithRetry(() => import("./pages/AdminTemplates"));
const AdminStories = lazyWithRetry(() => import("./pages/AdminStories"));
const AdminAutoStories = lazyWithRetry(() => import("./pages/AdminAutoStories"));
const AdminRanks = lazyWithRetry(() => import("./pages/AdminRanks"));
const AdminStickers = lazyWithRetry(() => import("./pages/AdminStickers"));
const AdminRankStickers = lazyWithRetry(() => import("./pages/AdminRankStickers"));
const AdminBannerDefaults = lazyWithRetry(() => import("./pages/AdminBannerDefaults"));
const AdminBannerPreviewDefaults = lazyWithRetry(() => import("./pages/AdminBannerPreviewDefaults"));
const AdminTemplateBackgrounds = lazyWithRetry(() => import("./pages/AdminTemplateBackgrounds"));
const AdminStickerLibrary = lazyWithRetry(() => import("./pages/AdminStickerLibrary"));

// Error Boundary for lazy loading failures
interface ErrorBoundaryState {
  hasError: boolean;
}

class LazyErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Lazy loading error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <p className="text-foreground mb-4">Something went wrong loading the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
        <LazyErrorBoundary>
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
        </LazyErrorBoundary>
        <WhatsAppSupport />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
