import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Menu, Bell, Star, Calendar, Zap, Award, Wallet } from "lucide-react";
import { useTemplateCategories, useTemplates } from "@/hooks/useTemplates";
import { useProfile } from "@/hooks/useProfile";
import { useRealtimeWallet } from "@/hooks/useRealtimeWallet";
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
import WelcomeBonusModal from "@/components/WelcomeBonusModal";
import { useWelcomeBonus } from "@/hooks/useWelcomeBonus";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { preloadBannerPreviewSystem, preloadImages } from "@/lib/preloader";

// Static proxy placeholder for instant card rendering
const PROXY_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='105' viewBox='0 0 140 105'%3E%3Crect fill='%231a1f2e' width='140' height='105'/%3E%3Crect fill='%23ffd34e' opacity='0.1' width='140' height='105'/%3E%3C/svg%3E";

// Track if dashboard has been loaded once
let dashboardLoadedOnce = false;

export default function Dashboard() {
  const {
    categories,
    loading: categoriesLoading
  } = useTemplateCategories();
  const {
    templates: allTemplates,
    loading: templatesLoading
  } = useTemplates();
  const {
    ranks,
    loading: ranksLoading
  } = useRanks();
  const {
    trips,
    loading: tripsLoading
  } = useBonanzaTrips();
  const {
    birthdays,
    loading: birthdaysLoading
  } = useBirthdays();
  const {
    anniversaries,
    loading: anniversariesLoading
  } = useAnniversaries();
  const {
    motivationalBanners,
    loading: motivationalLoading
  } = useMotivationalBanners();
  const {
    festivals,
    loading: festivalsLoading
  } = useFestivals();
  const {
    stories: generatedStories,
    loading: storiesLoading
  } = useGeneratedStories();
  
  // Fetch stories_events with aggressive caching
  const { data: storiesEvents = [], isLoading: storiesEventsLoading } = useQuery({
    queryKey: ["stories-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories_events")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - prevent re-fetching
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  
  const [userId, setUserId] = useState<string | null>(null);
  const {
    profile
  } = useProfile(userId ?? undefined);
  
  // Use real-time wallet for instant balance updates
  const { wallet } = useRealtimeWallet(userId);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const hasLoadedRef = useRef(dashboardLoadedOnce);
  
  // Welcome bonus modal
  const { showWelcomeModal, bonusAmount, handleContinue } = useWelcomeBonus();

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

  // Memoized template filters to prevent recalculation
  const getRankTemplates = useMemo(() => {
    return allTemplates.filter(t => t.rank_id && ranks.some(r => r.id === t.rank_id));
  }, [allTemplates, ranks]);

  const getTripTemplates = useMemo(() => {
    return allTemplates.filter(t => t.trip_id && trips.some(trip => trip.id === t.trip_id));
  }, [allTemplates, trips]);

  const getBirthdayTemplates = useMemo(() => {
    return allTemplates.filter(t => t.birthday_id && birthdays.some(birthday => birthday.id === t.birthday_id));
  }, [allTemplates, birthdays]);

  const getAnniversaryTemplates = useMemo(() => {
    return allTemplates.filter(t => t.anniversary_id && anniversaries.some(anniversary => anniversary.id === t.anniversary_id));
  }, [allTemplates, anniversaries]);

  const getMotivationalBannerTemplates = useMemo(() => {
    return allTemplates.filter(t => t.motivational_banner_id && motivationalBanners.some(mb => mb.id === t.motivational_banner_id));
  }, [allTemplates, motivationalBanners]);

  const getFestivalTemplates = useMemo(() => {
    return allTemplates.filter(t => t.festival_id && festivals.some(f => f.id === t.festival_id));
  }, [allTemplates, festivals]);

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUserId(session?.user?.id ?? null);
    });
    
    // Preload Banner Preview system in background for instant navigation
    preloadBannerPreviewSystem();
  }, []);

  // Preload template images when data loads
  useEffect(() => {
    if (!isInitialLoading && ranks.length > 0) {
      const imageUrls = [
        ...ranks.map(r => r.icon).filter(Boolean),
        ...trips.map(t => t.trip_image_url).filter(Boolean),
        ...birthdays.map(b => b.Birthday_image_url).filter(Boolean),
        ...allTemplates.slice(0, 10).map(t => t.cover_thumbnail_url).filter(Boolean),
      ];
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
    return allTemplates.filter(t => t.category_id === categoryId).slice(0, 3);
  }, [allTemplates]);

  // Show skeleton only on initial load with no cached data
  if (isInitialLoading) {
    return (
      <ProfileCompletionGate userId={userId}>
        <DashboardSkeleton />
      </ProfileCompletionGate>
    );
  }

  return (
    <ProfileCompletionGate userId={userId}>
      <div className="min-h-screen bg-navy-dark pb-24 overflow-x-hidden overflow-y-auto">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-navy-dark/95 backdrop-blur-sm z-50 px-4 py-3 border-b border-primary/20">
        <div className="flex items-center justify-between gap-2 max-w-full">
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-tight">ReBusiness</h1>
              <p className="text-xs text-muted-foreground truncate">
                Welcome back, {profile?.name || "User"}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Wallet Balance - Using real-time wallet data */}
            <Link 
              to="/wallet" 
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
            >
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">₹{wallet.balance}</span>
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
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Content */}
      <div className="py-6 space-y-6">
        {/* Unified Stories Section - Lazy loaded */}
        <StoriesSection 
          festivals={festivals}
          storiesEvents={storiesEvents}
          generatedStories={generatedStories}
        />

        {/* Category Sections - Backend Integrated */}
        {categories.map(category => {
        const categoryTemplates = getCategoryTemplates(category.id);
        const isRankPromotion = category.slug === 'rank-promotion';
        const isBonanzaPromotion = category.slug === 'bonanza-promotion';
        const isBirthday = category.slug === 'birthday';
        const isAnniversary = category.slug === 'anniversary';
        const isMotivational = category.slug === 'motivational';
        const isFestival = category.slug === 'festival';
        return <div key={category.id} className="space-y-3">
              {/* Section Header with 16px padding */}
              <div className="flex items-center justify-between pl-4 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
                </div>
                <Link to={isRankPromotion ? '/rank-selection' : isBonanzaPromotion ? '/categories/bonanza-trips' : isBirthday ? '/categories/birthdays' : isAnniversary ? '/categories/anniversaries' : isMotivational ? '/categories/motivational' : isFestival ? '/categories/festival' : `/categories/${category.slug}`} className="text-primary text-sm font-semibold hover:underline">
                  See All →
                </Link>
              </div>

              {isRankPromotion ? <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getRankTemplates.map(template => {
              const rank = ranks.find(r => r.id === template.rank_id);
              return <BannerCard 
                key={template.id}
                id={template.id}
                title={template.name}
                imageUrl={template.cover_thumbnail_url}
                fallbackIcon={rank?.icon || '🏆'}
                fallbackGradient={rank?.gradient || 'bg-gradient-to-br from-secondary to-card'}
                linkTo={`/rank-banner-create/${template.rank_id}`}
              />;
            })}
                </div> : isBonanzaPromotion ? (
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getTripTemplates.map(template => {
              const trip = trips.find(t => t.id === template.trip_id);
              return <BannerCard 
                key={template.id}
                id={template.id}
                title={template.name}
                imageUrl={template.cover_thumbnail_url}
                fallbackIcon={trip?.short_title || '🎁'}
                fallbackGradient="bg-gradient-to-br from-red-600 to-orange-600"
                linkTo={`/banner-create/bonanza?tripId=${template.trip_id}`}
              />;
            })}
                </div>) : isBirthday ? (
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getBirthdayTemplates.map(template => {
              const birthday = birthdays.find(b => b.id === template.birthday_id);
              return <BannerCard 
                key={template.id}
                id={template.id}
                title={template.name}
                imageUrl={template.cover_thumbnail_url}
                fallbackIcon={birthday?.short_title || '🎂'}
                fallbackGradient="bg-gradient-to-br from-pink-600 to-purple-600"
                linkTo={`/banner-create/birthday?birthdayId=${template.birthday_id}`}
              />;
            })}
                </div>) : isAnniversary ? (
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getAnniversaryTemplates.map(template => {
              const anniversary = anniversaries.find(a => a.id === template.anniversary_id);
              return <BannerCard 
                key={template.id}
                id={template.id}
                title={template.name}
                imageUrl={template.cover_thumbnail_url}
                fallbackIcon={anniversary?.short_title || '💞'}
                fallbackGradient="bg-gradient-to-br from-rose-600 to-pink-600"
                linkTo={`/banner-create/anniversary?anniversaryId=${template.anniversary_id}`}
              />;
            })}
                </div>) : isMotivational ? (
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getMotivationalBannerTemplates.map(template => {
              const motivationalBanner = motivationalBanners.find(mb => mb.id === template.motivational_banner_id);
              return <BannerCard 
                key={template.id}
                id={template.id}
                title={template.name}
                imageUrl={template.cover_thumbnail_url}
                fallbackIcon={motivationalBanner?.short_title || '⚡'}
                fallbackGradient="bg-gradient-to-br from-yellow-600 to-orange-600"
                linkTo={`/motivational-preview/${template.motivational_banner_id}`}
              />;
            })}
                </div>) : isFestival ? (
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
                  {getFestivalTemplates.map(template => {
              const festival = festivals.find(f => f.id === template.festival_id);
              return <BannerCard 
                key={template.id}
                id={template.id}
                title={template.name}
                subtitle={festival?.festival_name}
                imageUrl={template.cover_thumbnail_url}
                fallbackIcon="🎉"
                fallbackGradient="bg-gradient-to-br from-purple-600 to-pink-600"
                linkTo={`/festival-preview/${template.festival_id}`}
              />;
            })}
                </div>) : (/* Template Scroll - 3 per row */
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth">
                  {categoryTemplates.length > 0 ? categoryTemplates.map(template => {
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
              return <BannerCard 
                key={template.id}
                id={template.id}
                title={template.name}
                imageUrl={template.cover_thumbnail_url}
                fallbackIcon="📋"
                fallbackGradient="bg-gradient-to-br from-secondary to-card"
                linkTo={getCategoryRoute()}
              />;
            }) : <div className="w-[calc(33.333%-8px)] min-w-[110px] max-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 p-4">
                      <p className="text-xs text-muted-foreground text-center">No templates yet</p>
                    </div>}
                </div>)}
            </div>;
      })}
      </div>

        <BottomNav />
      </div>
      {/* Welcome Bonus Modal */}
      <WelcomeBonusModal
        open={showWelcomeModal}
        bonusAmount={bonusAmount}
        onContinue={handleContinue}
      />
    </ProfileCompletionGate>
  );
}
