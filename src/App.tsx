import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, memo, Component, ReactNode, useMemo, useEffect } from "react";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import OfflineBanner from "@/components/OfflineBanner";
import AuthGuard from "@/components/AuthGuard";
import { queryClient } from "@/lib/queryConfig";
import { preloadCriticalModules, preloadFonts } from "@/lib/preloader";
import { preloadMobileModel } from "@/lib/backgroundRemoverMobile";

// Skeleton loaders
import {
  DashboardSkeleton,
  BannerCreateSkeleton,
  BannerPreviewSkeleton,
  ProfileSkeleton,
  ListPageSkeleton,
  WalletSkeleton,
  AdminSkeleton,
  GenericSkeleton,
} from "@/components/skeletons";

// Critical path - load immediately for instant access
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BannerPreview from "./pages/BannerPreview";
import Categories from "./pages/Categories";
import RankSelection from "./pages/RankSelection";

// Start preloading fonts and modules immediately on script load
preloadFonts();
setTimeout(() => preloadCriticalModules(), 50);

// Preload background removal model for instant processing when needed
// Delayed slightly to prioritize critical UI rendering first
setTimeout(() => {
  preloadMobileModel().catch(err => {
    console.warn('Background removal model preload failed:', err);
  });
}, 2000);

// Lazy load with retry and cache
const lazyWithRetry = (componentImport: () => Promise<{ default: React.ComponentType<unknown> }>) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('Lazy load failed, retrying...', error);
      // Clear module cache and retry
      await new Promise(r => setTimeout(r, 100));
      return await componentImport();
    }
  });

// Secondary pages - lazy load with retry
const Messages = lazyWithRetry(() => import("./pages/Messages"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const ProfileEdit = lazyWithRetry(() => import("./pages/ProfileEdit"));
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
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));

// Admin pages
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
const AdminStickerManagement = lazyWithRetry(() => import("./pages/AdminStickerManagement"));
const AdminBannerCarousel = lazyWithRetry(() => import("./pages/AdminBannerCarousel"));

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

// Context-aware skeleton loader
const RouteSkeleton = memo(() => {
  const location = useLocation();
  const path = location.pathname;

  const skeleton = useMemo(() => {
    if (path === '/dashboard') return <DashboardSkeleton />;
    if (path.includes('/banner-preview') || path.includes('-preview')) return <BannerPreviewSkeleton />;
    if (path.includes('/banner-create') || path.includes('-banner-create')) return <BannerCreateSkeleton />;
    if (path.includes('/profile')) return <ProfileSkeleton />;
    if (path.includes('/wallet') || path.includes('/transactions')) return <WalletSkeleton />;
    if (path.includes('/admin')) return <AdminSkeleton />;
    if (path.includes('/categories') || path.includes('/selection') || path.includes('/my-downloads')) return <ListPageSkeleton />;
    return <GenericSkeleton />;
  }, [path]);

  return skeleton;
});
RouteSkeleton.displayName = 'RouteSkeleton';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OfflineBanner />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LazyErrorBoundary>
          <Suspense fallback={<RouteSkeleton />}>
            <Routes>
              {/* Public routes - no auth required */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/otp-verification" element={<OTPVerification />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Dashboard - public with guest mode (deferred login) */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Protected routes - auth required */}
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
              <Route path="/admin/sticker-management" element={<AuthGuard><AdminStickerManagement /></AuthGuard>} />
              <Route path="/admin/auto-stories" element={<AuthGuard><AdminAutoStories /></AuthGuard>} />
              <Route path="/admin/banner-carousel" element={<AuthGuard><AdminBannerCarousel /></AuthGuard>} />
              
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
