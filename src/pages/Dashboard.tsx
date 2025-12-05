import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Menu, Bell, Star, Calendar, Zap, Award, Wallet } from "lucide-react";
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
import WelcomeBonusModal from "@/components/WelcomeBonusModal";
import { useWelcomeBonus } from "@/hooks/useWelcomeBonus";

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
  
  // Fetch stories_events
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
  });
  
  const [userId, setUserId] = useState<string | null>(null);
  const {
    profile
  } = useProfile(userId ?? undefined);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Welcome bonus modal
  const { showWelcomeModal, bonusAmount, handleContinue } = useWelcomeBonus();

  // Check if all data is loaded
  const isDataLoading = categoriesLoading || templatesLoading || ranksLoading || 
    tripsLoading || birthdaysLoading || anniversariesLoading || 
    motivationalLoading || festivalsLoading || storiesLoading || storiesEventsLoading;

  // Get rank templates with covers
  const getRankTemplates = () => {
    return allTemplates.filter(t => t.rank_id && ranks.some(r => r.id === t.rank_id));
  };

  // Get trip templates with covers
  const getTripTemplates = () => {
    return allTemplates.filter(t => t.trip_id && trips.some(trip => trip.id === t.trip_id));
  };

  // Get birthday templates with covers
  const getBirthdayTemplates = () => {
    return allTemplates.filter(t => t.birthday_id && birthdays.some(birthday => birthday.id === t.birthday_id));
  };

  // Get anniversary templates with covers
  const getAnniversaryTemplates = () => {
    return allTemplates.filter(t => t.anniversary_id && anniversaries.some(anniversary => anniversary.id === t.anniversary_id));
  };

  // Get motivational banner templates with covers
  const getMotivationalBannerTemplates = () => {
    return allTemplates.filter(t => t.motivational_banner_id && motivationalBanners.some(mb => mb.id === t.motivational_banner_id));
  };

  // Get festival templates with covers
  const getFestivalTemplates = () => {
    return allTemplates.filter(t => t.festival_id && festivals.some(f => f.id === t.festival_id));
  };

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);
  const quickActions = [{
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
  }];

  // Get templates for each category
  const getCategoryTemplates = (categoryId: string) => {
    return allTemplates.filter(t => t.category_id === categoryId).slice(0, 3);
  };
  // Show blank loading state until all data is ready - prevents flash
  if (isDataLoading) {
    return (
      <ProfileCompletionGate userId={userId}>
        <div className="min-h-screen bg-navy-dark pb-24">
          {/* Blank loading state with same background */}
          <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">ReBusiness</h1>
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            </div>
          </header>
          <div className="py-6 space-y-6">
            {/* Stories Skeleton */}
            <div className="space-y-3">
              <div className="h-6 w-32 bg-secondary/50 rounded animate-pulse ml-4" />
              <div className="flex gap-2 overflow-hidden pl-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-[72px] h-[100px] bg-secondary/30 rounded-2xl animate-pulse flex-shrink-0" />
                ))}
              </div>
            </div>
            {/* Banner Section Skeletons */}
            {[1, 2].map((section) => (
              <div key={section} className="space-y-3">
                <div className="flex justify-between items-center px-4">
                  <div className="h-6 w-40 bg-secondary/50 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-secondary/50 rounded animate-pulse" />
                </div>
                <div className="flex gap-3 overflow-hidden pl-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-[calc(33.333%-8px)] min-w-[110px] max-w-[140px] aspect-[4/5] bg-secondary/30 rounded-2xl animate-pulse flex-shrink-0" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <BottomNav />
        </div>
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
            {/* Wallet Balance */}
            <Link 
              to="/wallet" 
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
            >
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">₹{profile?.balance || 0}</span>
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

              {/* Rank Promotion - 3 per row with 12px gap */}
              {isRankPromotion ? <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth">
                  {getRankTemplates().map(template => {
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
                </div> : isBonanzaPromotion ? (/* Bonanza Trips - 3 per row */
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth">
                  {getTripTemplates().map(template => {
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
                </div>) : isBirthday ? (/* Birthday - 3 per row */
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth">
                  {getBirthdayTemplates().map(template => {
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
                </div>) : isAnniversary ? (/* Anniversary - 3 per row */
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth">
                  {getAnniversaryTemplates().map(template => {
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
                </div>) : isMotivational ? (/* Motivational - 3 per row */
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth">
                  {getMotivationalBannerTemplates().map(template => {
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
                </div>) : isFestival ? (/* Festival - 3 per row */
          <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth">
                  {getFestivalTemplates().map(template => {
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