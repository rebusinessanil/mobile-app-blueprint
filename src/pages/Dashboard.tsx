import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Menu, Bell, Star, Calendar, Zap, Award, Wallet, LogIn } from "lucide-react";
import { useTemplateCategories, useTemplates } from "@/hooks/useTemplates";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useRanks } from "@/hooks/useTemplates";
import { useBonanzaTrips } from "@/hooks/useBonanzaTrips";
import { useBirthdays } from "@/hooks/useBirthdays";
import { useAnniversaries } from "@/hooks/useAnniversaries";
import { useMotivationalBanners } from "@/hooks/useMotivationalBanners";
import { useFestivals } from "@/hooks/useFestivals";
import { useGeneratedStories } from "@/hooks/useAutoStories";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Profile from "./Profile";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import ProfileCompletionGate from "@/components/ProfileCompletionGate";
import StoriesSection from "@/components/dashboard/StoriesSection";
import BannerCard from "@/components/dashboard/BannerCard";
import GuestBannerCard from "@/components/dashboard/GuestBannerCard";
import WelcomeBonusModal from "@/components/WelcomeBonusModal";
import LoginPromptModal from "@/components/LoginPromptModal";
import { useWelcomeBonus } from "@/hooks/useWelcomeBonus";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { preloadBannerPreviewSystem, preloadImages } from "@/lib/preloader";
import { useAdminSync } from "@/hooks/useAdminSync";
import { useGuestMode } from "@/hooks/useGuestMode";
import { Button } from "@/components/ui/button";
import LockedCard from "@/components/dashboard/LockedCard";
import GuestStatusBar from "@/components/dashboard/GuestStatusBar";
import GuestBannerCarousel from "@/components/dashboard/GuestBannerCarousel";

// Static proxy placeholder for instant card rendering
const PROXY_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='105' viewBox='0 0 140 105'%3E%3Crect fill='%231a1f2e' width='140' height='105'/%3E%3Crect fill='%23ffd34e' opacity='0.1' width='140' height='105'/%3E%3C/svg%3E";

// Track if dashboard has been loaded once
let dashboardLoadedOnce = false;
export default function Dashboard() {
  const navigate = useNavigate();
  const {
    userId,
    isGuest,
    isAuthenticated,
    isLoading: authLoading,
    authValidated
  } = useGuestMode();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Re-validate auth state on visibility change (tab focus) to catch session changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Session will be re-validated by useGuestMode automatically
        // This ensures fresh state when user returns to tab
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Prevent any UI flicker by ensuring auth state is validated before rendering
  // This catches edge cases where cached React state doesn't match actual auth state
  useEffect(() => {
    if (authValidated && !authLoading) {
      // Auth state is now confirmed - no additional action needed
      // The isGuest/isAuthenticated flags are now reliable
    }
  }, [authValidated, authLoading]);

  // Fetch real data - will gracefully fail for guests due to RLS
  const {
    categories: realCategories,
    loading: categoriesLoading
  } = useTemplateCategories();
  const {
    templates: realTemplates,
    loading: templatesLoading
  } = useTemplates();
  const {
    ranks: realRanks,
    loading: ranksLoading
  } = useRanks();
  const {
    trips: realTrips,
    loading: tripsLoading
  } = useBonanzaTrips();
  const {
    birthdays: realBirthdays,
    loading: birthdaysLoading
  } = useBirthdays();
  const {
    anniversaries: realAnniversaries,
    loading: anniversariesLoading
  } = useAnniversaries();
  const {
    motivationalBanners: realMotivationalBanners,
    loading: motivationalLoading
  } = useMotivationalBanners();
  const {
    festivals: realFestivals,
    loading: festivalsLoading
  } = useFestivals();
  const {
    stories: generatedStories,
    loading: storiesLoading
  } = useGeneratedStories();

  // Fetch stories_events with aggressive caching
  const {
    data: storiesEvents = [],
    isLoading: storiesEventsLoading
  } = useQuery({
    queryKey: ["stories-events"],
    queryFn: async () => {
      try {
        const {
          data,
          error
        } = await supabase.from("stories_events").select("*").order("event_date", {
          ascending: true
        });
        if (error) throw error;
        return data || [];
      } catch (error) {
        // Silently fall back for guests
        console.warn('Stories events fetch failed (likely RLS):', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
  const {
    profile: realProfile
  } = useProfile(userId ?? undefined);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const hasLoadedRef = useRef(dashboardLoadedOnce);

  // Welcome bonus modal - only for authenticated users
  const {
    showWelcomeModal,
    bonusAmount,
    handleContinue
  } = useWelcomeBonus();

  // Real-time sync for admin updates
  useAdminSync({
    enabled: isAuthenticated
  });

  // Use real public data for everyone - no demo fallback
  const categories = realCategories;
  const allTemplates = realTemplates;
  const ranks = realRanks;
  const trips = realTrips;
  const birthdays = realBirthdays;
  const anniversaries = realAnniversaries;
  const motivationalBanners = realMotivationalBanners;
  const festivals = realFestivals;
  const profile = realProfile;

  // Check if data is loading AND no cached data exists AND first load
  const hasNoData = categories.length === 0 && allTemplates.length === 0 && ranks.length === 0;
  const isInitialLoading = (categoriesLoading || templatesLoading || ranksLoading) && hasNoData && !hasLoadedRef.current;

  // Mark dashboard as loaded once data arrives
  useEffect(() => {
    if (!isInitialLoading && (categories.length > 0 || ranks.length > 0)) {
      dashboardLoadedOnce = true;
      hasLoadedRef.current = true;
    }
  }, [isInitialLoading, categories.length, ranks.length]);

  // Memoized template filters
  const getRankTemplates = useMemo(() => {
    return allTemplates.filter((t: any) => t.rank_id && ranks.some((r: any) => r.id === t.rank_id));
  }, [allTemplates, ranks]);
  const getTripTemplates = useMemo(() => {
    return allTemplates.filter((t: any) => t.trip_id && trips.some((trip: any) => trip.id === t.trip_id));
  }, [allTemplates, trips]);
  const getBirthdayTemplates = useMemo(() => {
    return allTemplates.filter((t: any) => t.birthday_id && birthdays.some((birthday: any) => birthday.id === t.birthday_id));
  }, [allTemplates, birthdays]);
  const getAnniversaryTemplates = useMemo(() => {
    return allTemplates.filter((t: any) => t.anniversary_id && anniversaries.some((anniversary: any) => anniversary.id === t.anniversary_id));
  }, [allTemplates, anniversaries]);
  const getMotivationalBannerTemplates = useMemo(() => {
    return allTemplates.filter((t: any) => t.motivational_banner_id && motivationalBanners.some((mb: any) => mb.id === t.motivational_banner_id));
  }, [allTemplates, motivationalBanners]);
  const getFestivalTemplates = useMemo(() => {
    return allTemplates.filter((t: any) => t.festival_id && festivals.some((f: any) => f.id === t.festival_id));
  }, [allTemplates, festivals]);

  // Preload Banner Preview system in background
  useEffect(() => {
    if (isAuthenticated) {
      preloadBannerPreviewSystem();
    }
  }, [isAuthenticated]);

  // Preload template images when data loads
  useEffect(() => {
    if (!isInitialLoading && ranks.length > 0) {
      const imageUrls = [...ranks.map((r: any) => r.icon).filter(Boolean), ...trips.map((t: any) => t.trip_image_url).filter(Boolean), ...birthdays.map((b: any) => b.Birthday_image_url).filter(Boolean), ...allTemplates.slice(0, 10).map((t: any) => t.cover_thumbnail_url).filter(Boolean)];
      if (imageUrls.length > 0) {
        preloadImages(imageUrls as string[]);
      }
    }
  }, [isInitialLoading, ranks, trips, birthdays, allTemplates]);

  // Memoized quick actions
  const quickActions = useMemo(() => [{
    icon: Calendar,
    label: "Festival Banner",
    color: "bg-icon-purple"
  }, {
    icon: Zap,
    label: "Motivational Quote",
    color: "bg-icon-orange"
  }, {
    icon: Award,
    label: "Achievements",
    color: "bg-icon-purple"
  }, {
    label: "Special Offer Today",
    color: "bg-secondary",
    special: true
  }], []);

  // Memoized category templates getter
  const getCategoryTemplates = useCallback((categoryId: string) => {
    return allTemplates.filter((t: any) => t.category_id === categoryId).slice(0, 3);
  }, [allTemplates]);

  // Protected navigation handler
  const handleProtectedNavigation = useCallback((path: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    navigate(path);
  }, [isAuthenticated, navigate]);

  // Show skeleton only on initial load with no cached data
  if (isInitialLoading) {
    // For guests, just show skeleton without ProfileCompletionGate
    if (isGuest) {
      return <DashboardSkeleton />;
    }
    return <ProfileCompletionGate userId={userId}>
        <DashboardSkeleton />
      </ProfileCompletionGate>;
  }

  // Content wrapper - ProfileCompletionGate only for authenticated users
  const ContentWrapper = isAuthenticated ? ProfileCompletionGate : ({
    children
  }: {
    children: React.ReactNode;
  }) => <>{children}</>;
  return <ContentWrapper userId={userId}>
      <div className="dashboard-shell bg-navy-dark min-h-screen">
      {/* Fixed Header */}
      <header className="dashboard-header bg-navy-dark/95 backdrop-blur-sm border-b border-primary/20">
        <div className="h-full flex items-center justify-between gap-2 px-4 max-w-full">
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-tight">ReBusiness</h1>
              <p className="text-xs text-muted-foreground truncate">
                {isGuest ? "Welcome! Explore our templates" : `Welcome back, ${profile?.name || "User"}!`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isGuest ? (/* Guest: Show Login Button */
            <Button onClick={() => navigate("/login")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold">
                <LogIn className="w-4 h-4" />
                Login
              </Button>) : (/* Authenticated: Show Wallet & Profile */
            <>
                <Link to="/wallet" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">₹{(profile as any)?.balance || 0}</span>
                </Link>
                <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <SheetTrigger asChild>
                    <button className="w-9 h-9 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
                      <Menu className="w-5 h-5 text-primary" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full p-0 border-l border-primary/20 overflow-y-auto">
                    <Profile />
                  </SheetContent>
                </Sheet>
                <Link to="/messages" className="relative w-9 h-9 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Bell className="w-5 h-5 text-primary" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs font-bold flex items-center justify-center text-white">
                    2
                  </span>
                </Link>
              </>)}
          </div>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main>
        {/* Guest Banner - Show value proposition with Carousel */}
        {isGuest && <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 border border-primary/30 overflow-hidden">
            <GuestBannerCarousel />
            <div className="p-4">
              
              
              <Button onClick={() => navigate("/register")} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs">
                Sign up to unlock all templates, get 199 free  
              </Button>
            </div>
          </div>}

        {/* Compact Status Bar for Guests */}
        {isGuest && <GuestStatusBar />}

      {/* Content */}
      <div className="py-6 space-y-6">
        {/* Unified Stories Section */}
        <StoriesSection festivals={festivals as any} storiesEvents={storiesEvents} generatedStories={generatedStories as any} />

        {/* Category Sections */}
        {categories.map((category: any) => {
          const categoryTemplates = getCategoryTemplates(category.id);
          const isRankPromotion = category.slug === 'rank-promotion';
          const isBonanzaPromotion = category.slug === 'bonanza-promotion';
          const isBirthday = category.slug === 'birthday';
          const isAnniversary = category.slug === 'anniversary';
          const isMotivational = category.slug === 'motivational';
          const isFestival = category.slug === 'festival';

          // Get the "See All" link path
          const seeAllPath = isRankPromotion ? '/rank-selection' : isBonanzaPromotion ? '/categories/bonanza-trips' : isBirthday ? '/categories/birthdays' : isAnniversary ? '/categories/anniversaries' : isMotivational ? '/categories/motivational' : isFestival ? '/categories/festival' : `/categories/${category.slug}`;
          return <div key={category.id} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between pl-4 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
                </div>
                {isAuthenticated ? <Link to={seeAllPath} className="text-primary text-sm font-semibold hover:underline">
                    See All →
                  </Link> : <button onClick={() => setShowLoginModal(true)} className="text-primary text-sm font-semibold hover:underline">
                    See All →
                  </button>}
              </div>

              {isRankPromotion ? <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getRankTemplates.map((template: any) => {
                const rank = ranks.find((r: any) => r.id === template.rank_id);
                return <GuestBannerCard key={template.id} id={template.id} title={template.name} imageUrl={template.cover_thumbnail_url} fallbackIcon={rank?.icon || '🏆'} fallbackGradient={rank?.gradient || 'bg-gradient-to-br from-secondary to-card'} linkTo={`/rank-banner-create/${template.rank_id}`} isAuthenticated={isAuthenticated} onAuthenticatedClick={() => navigate(`/rank-banner-create/${template.rank_id}`)} />;
              })}
                </div> : isBonanzaPromotion ? <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getTripTemplates.map((template: any) => {
                const trip = trips.find((t: any) => t.id === template.trip_id);
                return <GuestBannerCard key={template.id} id={template.id} title={template.name} imageUrl={template.cover_thumbnail_url} fallbackIcon={(trip as any)?.short_title || '🎁'} fallbackGradient="bg-gradient-to-br from-red-600 to-orange-600" linkTo={`/banner-create/bonanza?tripId=${template.trip_id}`} isAuthenticated={isAuthenticated} onAuthenticatedClick={() => navigate(`/banner-create/bonanza?tripId=${template.trip_id}`)} />;
              })}
                </div> : isBirthday ? <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getBirthdayTemplates.map((template: any) => {
                const birthday = birthdays.find((b: any) => b.id === template.birthday_id);
                return <GuestBannerCard key={template.id} id={template.id} title={template.name} imageUrl={template.cover_thumbnail_url} fallbackIcon={(birthday as any)?.short_title || '🎂'} fallbackGradient="bg-gradient-to-br from-pink-600 to-purple-600" linkTo={`/banner-create/birthday?birthdayId=${template.birthday_id}`} isAuthenticated={isAuthenticated} onAuthenticatedClick={() => navigate(`/banner-create/birthday?birthdayId=${template.birthday_id}`)} />;
              })}
                </div> : isAnniversary ? <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getAnniversaryTemplates.map((template: any) => {
                const anniversary = anniversaries.find((a: any) => a.id === template.anniversary_id);
                return <GuestBannerCard key={template.id} id={template.id} title={template.name} imageUrl={template.cover_thumbnail_url} fallbackIcon={(anniversary as any)?.short_title || '💞'} fallbackGradient="bg-gradient-to-br from-rose-600 to-pink-600" linkTo={`/banner-create/anniversary?anniversaryId=${template.anniversary_id}`} isAuthenticated={isAuthenticated} onAuthenticatedClick={() => navigate(`/banner-create/anniversary?anniversaryId=${template.anniversary_id}`)} />;
              })}
                </div> : isMotivational ? <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getMotivationalBannerTemplates.map((template: any) => {
                const motivationalBanner = motivationalBanners.find((mb: any) => mb.id === template.motivational_banner_id);
                return <GuestBannerCard key={template.id} id={template.id} title={template.name} imageUrl={template.cover_thumbnail_url} fallbackIcon={(motivationalBanner as any)?.short_title || '⚡'} fallbackGradient="bg-gradient-to-br from-yellow-600 to-orange-600" linkTo={`/motivational-preview/${template.motivational_banner_id}`} isAuthenticated={isAuthenticated} onAuthenticatedClick={() => navigate(`/motivational-preview/${template.motivational_banner_id}`)} />;
              })}
                </div> : isFestival ? <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getFestivalTemplates.map((template: any) => {
                const festival = festivals.find((f: any) => f.id === template.festival_id);
                return <GuestBannerCard key={template.id} id={template.id} title={template.name} subtitle={(festival as any)?.festival_name} imageUrl={template.cover_thumbnail_url} fallbackIcon="🎉" fallbackGradient="bg-gradient-to-br from-purple-600 to-pink-600" linkTo={`/festival-preview/${template.festival_id}`} isAuthenticated={isAuthenticated} onAuthenticatedClick={() => navigate(`/festival-preview/${template.festival_id}`)} />;
              })}
                </div> : <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth">
                  {categoryTemplates.length > 0 ? categoryTemplates.map((template: any) => {
                const getCategoryRoute = () => {
                  const routeMap: Record<string, string> = {
                    'bonanza-promotion': '/banner-create/bonanza',
                    'birthday': '/banner-create/birthday',
                    'anniversary': '/banner-create/anniversary',
                    'meeting': '/banner-create/meeting',
                    'festival': '/banner-create/festival',
                    'motivational': '/banner-create/motivational'
                  };
                  return routeMap[category.slug] || `/template/${template.id}`;
                };
                return <GuestBannerCard key={template.id} id={template.id} title={template.name} imageUrl={template.cover_thumbnail_url} fallbackIcon="📋" fallbackGradient="bg-gradient-to-br from-secondary to-card" linkTo={getCategoryRoute()} isAuthenticated={isAuthenticated} onAuthenticatedClick={() => navigate(getCategoryRoute())} />;
              }) : <div className="w-[calc(33.333%-8px)] min-w-[110px] max-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 p-4">
                      <p className="text-xs text-muted-foreground text-center">No templates yet</p>
                    </div>}
                </div>}
            </div>;
        })}
      </div>
      </main>

      <BottomNav />
    </div>
      
      {/* Welcome Bonus Modal - only for authenticated users */}
      {isAuthenticated && <WelcomeBonusModal open={showWelcomeModal} bonusAmount={bonusAmount} onContinue={handleContinue} />}
      
      {/* Login Prompt Modal for guest interactions */}
      <LoginPromptModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="this feature" />
    </ContentWrapper>;
}