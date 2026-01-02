import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Menu, Bell, Star, Wallet, LogIn } from "lucide-react";
import { useTemplateCategories, useTemplates, useRanks } from "@/hooks/useTemplates";
import { useProfile } from "@/hooks/useProfile";
import { useBonanzaTrips } from "@/hooks/useBonanzaTrips";
import { useBirthdays } from "@/hooks/useBirthdays";
import { useAnniversaries } from "@/hooks/useAnniversaries";
import { useMotivationalBanners } from "@/hooks/useMotivationalBanners";
import { useFestivals } from "@/hooks/useFestivals";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Profile from "./Profile";
import ProfileCompletionGate from "@/components/ProfileCompletionGate";
import StoriesSection from "@/components/dashboard/StoriesSection";
import GuestBannerCard from "@/components/dashboard/GuestBannerCard";
import WelcomeBonusModal from "@/components/WelcomeBonusModal";
import LoginPromptModal from "@/components/LoginPromptModal";
import { useWelcomeBonus } from "@/hooks/useWelcomeBonus";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { preloadBannerPreviewSystem } from "@/lib/preloader";
import { getOptimizedImageUrl } from "@/lib/imageOptimizer";
import { useAdminSync } from "@/hooks/useAdminSync";
import { useGuestMode } from "@/hooks/useGuestMode";
import { Button } from "@/components/ui/button";
import GuestStatusBar from "@/components/dashboard/GuestStatusBar";
import GuestBannerCarousel from "@/components/dashboard/GuestBannerCarousel";

// Track if dashboard has been loaded once
let dashboardLoadedOnce = false;

// Helper: Render category section carousel
interface CategorySectionProps {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  seeAllPath: string;
  templates: any[];
  isAuthenticated: boolean;
  onShowLoginModal: () => void;
  onNavigate: (path: string) => void;
  getItemConfig: (template: any) => {
    key: string;
    fallbackIcon: string;
    fallbackGradient: string;
    linkTo: string;
    subtitle?: string;
  };
}

function CategorySection({
  categoryId,
  categoryName,
  categoryIcon,
  seeAllPath,
  templates,
  isAuthenticated,
  onShowLoginModal,
  onNavigate,
  getItemConfig,
}: CategorySectionProps) {
  if (templates.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pl-4 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryIcon}</span>
          <h2 className="text-lg font-bold text-foreground">{categoryName}</h2>
        </div>
        {isAuthenticated ? (
          <Link to={seeAllPath} className="text-primary text-sm font-semibold hover:underline">
            See All →
          </Link>
        ) : (
          <button onClick={onShowLoginModal} className="text-primary text-sm font-semibold hover:underline">
            See All →
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth transform-gpu">
        {templates.map((template: any) => {
          const config = getItemConfig(template);
          return (
            <GuestBannerCard
              key={config.key}
              id={template.id}
              title={template.name}
              subtitle={config.subtitle}
              imageUrl={template.cover_thumbnail_url}
              fallbackIcon={config.fallbackIcon}
              fallbackGradient={config.fallbackGradient}
              linkTo={config.linkTo}
              isAuthenticated={isAuthenticated}
              onAuthenticatedClick={() => onNavigate(config.linkTo)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { userId, isGuest, isAuthenticated, isLoading: authLoading, authValidated } = useGuestMode();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const hasLoadedRef = useRef(dashboardLoadedOnce);

  // Data hooks
  const { categories, loading: categoriesLoading } = useTemplateCategories();
  const { templates: allTemplates, loading: templatesLoading } = useTemplates();
  const { ranks, loading: ranksLoading } = useRanks();
  const { trips } = useBonanzaTrips();
  const { birthdays } = useBirthdays();
  const { anniversaries } = useAnniversaries();
  const { motivationalBanners } = useMotivationalBanners();
  const { festivals } = useFestivals();
  const { profile } = useProfile(userId ?? undefined);

  // Welcome bonus modal
  const { showWelcomeModal, bonusAmount, handleContinue } = useWelcomeBonus();

  // Real-time sync for admin updates
  useAdminSync({ enabled: true });

  // Loading state
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
  const getRankTemplates = useMemo(() =>
    allTemplates.filter((t: any) => t.rank_id && ranks.some((r: any) => r.id === t.rank_id)),
    [allTemplates, ranks]
  );
  
  const getTripTemplates = useMemo(() =>
    allTemplates.filter((t: any) => t.trip_id && trips.some((trip: any) => trip.id === t.trip_id)),
    [allTemplates, trips]
  );
  
  const getBirthdayTemplates = useMemo(() =>
    allTemplates.filter((t: any) => t.birthday_id && birthdays.some((b: any) => b.id === t.birthday_id)),
    [allTemplates, birthdays]
  );
  
  const getAnniversaryTemplates = useMemo(() =>
    allTemplates.filter((t: any) => t.anniversary_id && anniversaries.some((a: any) => a.id === t.anniversary_id)),
    [allTemplates, anniversaries]
  );
  
  const getMotivationalTemplates = useMemo(() =>
    allTemplates.filter((t: any) => t.motivational_banner_id && motivationalBanners.some((mb: any) => mb.id === t.motivational_banner_id)),
    [allTemplates, motivationalBanners]
  );
  
  const getFestivalTemplates = useMemo(() =>
    allTemplates.filter((t: any) => t.festival_id && festivals.some((f: any) => f.id === t.festival_id)),
    [allTemplates, festivals]
  );

  // Preload Banner Preview system in background
  useEffect(() => {
    if (isAuthenticated) {
      preloadBannerPreviewSystem();
    }
  }, [isAuthenticated]);

  // Preload first few template images with optimization
  useEffect(() => {
    if (!isInitialLoading && ranks.length > 0) {
      const criticalImages = [
        ...ranks.slice(0, 4).map((r: any) => r.icon),
        ...allTemplates.slice(0, 6).map((t: any) => t.cover_thumbnail_url),
      ].filter(Boolean);

      // Preload optimized versions
      criticalImages.forEach((url) => {
        if (!url) return;
        const optimizedUrl = getOptimizedImageUrl(url, { width: 300, quality: 80 });
        const img = new Image();
        img.src = optimizedUrl;
      });
    }
  }, [isInitialLoading, ranks, allTemplates]);

  const getCategoryTemplates = useCallback(
    (categoryId: string) => allTemplates.filter((t: any) => t.category_id === categoryId).slice(0, 3),
    [allTemplates]
  );

  const handleShowLoginModal = useCallback(() => setShowLoginModal(true), []);

  // Show skeleton only on initial load
  if (isInitialLoading) {
    if (isGuest) return <DashboardSkeleton />;
    return (
      <ProfileCompletionGate userId={userId}>
        <DashboardSkeleton />
      </ProfileCompletionGate>
    );
  }

  const ContentWrapper = isAuthenticated ? ProfileCompletionGate : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <ContentWrapper userId={userId}>
      <div className="dashboard-shell bg-navy-dark min-h-screen">
        {/* Header */}
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
              {isGuest ? (
                <Button onClick={() => navigate("/login")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold">
                  <LogIn className="w-4 h-4" />
                  Login
                </Button>
              ) : (
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
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs font-bold flex items-center justify-center text-white">2</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {isGuest && (
            <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 border border-primary/30 overflow-hidden">
              <GuestBannerCarousel />
              <div className="p-4">
                <Button onClick={() => navigate("/register")} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs">
                  Sign up to unlock all templates, get 199 free
                </Button>
              </div>
            </div>
          )}

          {isGuest && <GuestStatusBar />}

          <div className="py-6 space-y-6">
            <StoriesSection />

            {/* Events Section */}
            {(getBirthdayTemplates.length > 0 || getAnniversaryTemplates.length > 0) && (
              <CategorySection
                categoryId="events"
                categoryName="Events"
                categoryIcon="🎉"
                seeAllPath="/categories/events"
                templates={[...getBirthdayTemplates, ...getAnniversaryTemplates]}
                isAuthenticated={isAuthenticated}
                onShowLoginModal={handleShowLoginModal}
                onNavigate={navigate}
                getItemConfig={(template) => {
                  if (template.birthday_id) {
                    const birthday = birthdays.find((b: any) => b.id === template.birthday_id);
                    return {
                      key: `birthday-${template.id}`,
                      fallbackIcon: (birthday as any)?.short_title || '🎂',
                      fallbackGradient: 'bg-gradient-to-br from-pink-600 to-purple-600',
                      linkTo: `/banner-create/birthday?birthdayId=${template.birthday_id}`,
                    };
                  }
                  const anniversary = anniversaries.find((a: any) => a.id === template.anniversary_id);
                  return {
                    key: `anniversary-${template.id}`,
                    fallbackIcon: (anniversary as any)?.short_title || '💞',
                    fallbackGradient: 'bg-gradient-to-br from-rose-600 to-pink-600',
                    linkTo: `/banner-create/anniversary?anniversaryId=${template.anniversary_id}`,
                  };
                }}
              />
            )}

            {/* Rank Promotion */}
            <CategorySection
              categoryId="rank-promotion"
              categoryName="Rank Promotion"
              categoryIcon="🏆"
              seeAllPath="/rank-selection"
              templates={getRankTemplates}
              isAuthenticated={isAuthenticated}
              onShowLoginModal={handleShowLoginModal}
              onNavigate={navigate}
              getItemConfig={(template) => {
                const rank = ranks.find((r: any) => r.id === template.rank_id);
                return {
                  key: template.id,
                  fallbackIcon: rank?.icon || '🏆',
                  fallbackGradient: rank?.gradient || 'bg-gradient-to-br from-secondary to-card',
                  linkTo: `/rank-banner-create/${template.rank_id}`,
                };
              }}
            />

            {/* Bonanza Trips */}
            <CategorySection
              categoryId="bonanza-promotion"
              categoryName="Bonanza Trips"
              categoryIcon="✈️"
              seeAllPath="/categories/bonanza-trips"
              templates={getTripTemplates}
              isAuthenticated={isAuthenticated}
              onShowLoginModal={handleShowLoginModal}
              onNavigate={navigate}
              getItemConfig={(template) => {
                const trip = trips.find((t: any) => t.id === template.trip_id);
                return {
                  key: template.id,
                  fallbackIcon: (trip as any)?.short_title || '🎁',
                  fallbackGradient: 'bg-gradient-to-br from-red-600 to-orange-600',
                  linkTo: `/banner-create/bonanza?tripId=${template.trip_id}`,
                };
              }}
            />

            {/* Motivational */}
            <CategorySection
              categoryId="motivational"
              categoryName="Motivational"
              categoryIcon="⚡"
              seeAllPath="/categories/motivational"
              templates={getMotivationalTemplates}
              isAuthenticated={isAuthenticated}
              onShowLoginModal={handleShowLoginModal}
              onNavigate={navigate}
              getItemConfig={(template) => {
                const mb = motivationalBanners.find((m: any) => m.id === template.motivational_banner_id);
                return {
                  key: template.id,
                  fallbackIcon: (mb as any)?.short_title || '⚡',
                  fallbackGradient: 'bg-gradient-to-br from-yellow-600 to-orange-600',
                  linkTo: `/motivational-preview/${template.motivational_banner_id}`,
                };
              }}
            />

            {/* Festival */}
            <CategorySection
              categoryId="festival"
              categoryName="Festival"
              categoryIcon="🎊"
              seeAllPath="/categories/festival"
              templates={getFestivalTemplates}
              isAuthenticated={isAuthenticated}
              onShowLoginModal={handleShowLoginModal}
              onNavigate={navigate}
              getItemConfig={(template) => {
                const festival = festivals.find((f: any) => f.id === template.festival_id);
                return {
                  key: template.id,
                  fallbackIcon: '🎉',
                  fallbackGradient: 'bg-gradient-to-br from-purple-600 to-pink-600',
                  linkTo: `/festival-preview/${template.festival_id}`,
                  subtitle: (festival as any)?.festival_name,
                };
              }}
            />

            {/* Other Categories */}
            {categories
              .filter((c: any) => !['birthday', 'anniversary', 'rank-promotion', 'bonanza-promotion', 'motivational', 'festival', 'thank-you', 'thank-you-message'].includes(c.slug))
              .map((category: any) => {
                const categoryTemplates = getCategoryTemplates(category.id);
                if (categoryTemplates.length === 0) return null;

                return (
                  <CategorySection
                    key={category.id}
                    categoryId={category.id}
                    categoryName={category.name}
                    categoryIcon={category.icon || '📋'}
                    seeAllPath={`/categories/${category.slug}`}
                    templates={categoryTemplates}
                    isAuthenticated={isAuthenticated}
                    onShowLoginModal={handleShowLoginModal}
                    onNavigate={navigate}
                    getItemConfig={(template) => ({
                      key: template.id,
                      fallbackIcon: '📋',
                      fallbackGradient: 'bg-gradient-to-br from-secondary to-card',
                      linkTo: `/template/${template.id}`,
                    })}
                  />
                );
              })}
          </div>
        </main>

        <BottomNav />
      </div>

      {isAuthenticated && <WelcomeBonusModal open={showWelcomeModal} bonusAmount={bonusAmount} onContinue={handleContinue} />}
      <LoginPromptModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="this feature" />
    </ContentWrapper>
  );
}
