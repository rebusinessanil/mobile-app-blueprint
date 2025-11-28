import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Menu, Bell, Star } from "lucide-react";
import { useTemplateCategories, useTemplates } from "@/hooks/useTemplates";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useRanks } from "@/hooks/useTemplates";
import { useBonanzaTrips } from "@/hooks/useBonanzaTrips";
import { useBirthdays } from "@/hooks/useBirthdays";
import { useAnniversaries } from "@/hooks/useAnniversaries";
import { useMotivationalBanners } from "@/hooks/useMotivationalBanners";
import { useFestivals } from "@/hooks/useFestivals";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Profile from "./Profile";
import StoriesSlider from "@/components/StoriesSlider";

export default function Dashboard() {
  const { categories } = useTemplateCategories();
  const { templates: allTemplates } = useTemplates();
  const { ranks } = useRanks();
  const { trips } = useBonanzaTrips();
  const { birthdays } = useBirthdays();
  const { anniversaries } = useAnniversaries();
  const { motivationalBanners } = useMotivationalBanners();
  const { festivals } = useFestivals();

  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId ?? undefined);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Get templates for each category
  const getCategoryTemplates = (categoryId: string) => {
    return allTemplates.filter(t => t.category_id === categoryId).slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ReBusiness</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile?.name || "User"}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <SheetTrigger asChild>
                <button className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Menu className="w-5 h-5 text-primary" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full p-0 border-l border-primary/20 overflow-y-auto">
                <Profile />
              </SheetContent>
            </Sheet>
            <Link
              to="/messages"
              className="relative w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
            >
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs font-bold flex items-center justify-center text-white">
                2
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="py-6 space-y-6">
        {/* Unified Stories Slider */}
        <StoriesSlider />

        {/* Category Sections */}
        {categories.map((category) => {
          const categoryTemplates = getCategoryTemplates(category.id);
          const isRankPromotion = category.slug === "rank-promotion";
          const isBonanzaPromotion = category.slug === "bonanza-promotion";
          const isBirthday = category.slug === "birthday";
          const isAnniversary = category.slug === "anniversary";
          const isMotivational = category.slug === "motivational";
          const isFestival = category.slug === "festival";

          return (
            <div key={category.id} className="px-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
                </div>
                <Link
                  to={
                    isRankPromotion
                      ? "/rank-selection"
                      : isBonanzaPromotion
                      ? "/categories/bonanza-trips"
                      : isBirthday
                      ? "/categories/birthdays"
                      : isAnniversary
                      ? "/categories/anniversaries"
                      : isMotivational
                      ? "/categories/motivational"
                      : isFestival
                      ? "/categories/festival"
                      : `/categories/${category.slug}`
                  }
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  See All →
                </Link>
              </div>

              {/* Rank Promotion - Show Ranks with Cover Images */}
              {isRankPromotion ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getRankTemplates().map((template) => {
                    const rank = ranks.find((r) => r.id === template.rank_id);
                    return (
                      <Link
                        key={template.id}
                        to={`/rank-banner-create/${template.rank_id}`}
                        className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all"
                      >
                        {template.cover_thumbnail_url ? (
                          <div className="h-24 relative">
                            <img
                              src={template.cover_thumbnail_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`h-24 ${
                              rank?.gradient || "bg-gradient-to-br from-secondary to-card"
                            } flex items-center justify-center text-4xl`}
                          >
                            {rank?.icon}
                          </div>
                        )}
                        <div className="p-3 text-center">
                          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2">
                            {template.name}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : isBonanzaPromotion ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getTripTemplates().map((template) => {
                    const trip = trips.find((t) => t.id === template.trip_id);
                    return (
                      <Link
                        key={template.id}
                        to={`/bonanza-banner-create?tripId=${template.trip_id}`}
                        className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all"
                      >
                        {template.cover_thumbnail_url && (
                          <div className="h-24 relative">
                            <img
                              src={template.cover_thumbnail_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-3 text-center">
                          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2">
                            {trip?.title || template.name}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : isBirthday ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getBirthdayTemplates().map((template) => {
                    const birthday = birthdays.find((b) => b.id === template.birthday_id);
                    return (
                      <Link
                        key={template.id}
                        to={`/birthday-banner-create?birthdayId=${template.birthday_id}`}
                        className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all"
                      >
                        {template.cover_thumbnail_url && (
                          <div className="h-24 relative">
                            <img
                              src={template.cover_thumbnail_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-3 text-center">
                          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2">
                            {birthday?.title || template.name}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : isAnniversary ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getAnniversaryTemplates().map((template) => {
                    const anniversary = anniversaries.find((a) => a.id === template.anniversary_id);
                    return (
                      <Link
                        key={template.id}
                        to={`/anniversary-banner-create?anniversaryId=${template.anniversary_id}`}
                        className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all"
                      >
                        {template.cover_thumbnail_url && (
                          <div className="h-24 relative">
                            <img
                              src={template.cover_thumbnail_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-3 text-center">
                          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2">
                            {anniversary?.title || template.name}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : isMotivational ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getMotivationalBannerTemplates().map((template) => {
                    const motivational = motivationalBanners.find((m) => m.id === template.motivational_banner_id);
                    return (
                      <Link
                        key={template.id}
                        to={`/motivational-preview/${template.motivational_banner_id}`}
                        className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all"
                      >
                        {template.cover_thumbnail_url && (
                          <div className="h-24 relative">
                            <img
                              src={template.cover_thumbnail_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-3 text-center">
                          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2">
                            {motivational?.title || template.name}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : isFestival ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getFestivalTemplates().map((template) => {
                    const festival = festivals.find((f) => f.id === template.festival_id);
                    return (
                      <Link
                        key={template.id}
                        to={`/festival-preview/${template.festival_id}`}
                        className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all"
                      >
                        {template.cover_thumbnail_url && (
                          <div className="h-24 relative">
                            <img
                              src={template.cover_thumbnail_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-3 text-center">
                          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2">
                            {festival?.festival_name || template.name}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                categoryTemplates.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {categoryTemplates.map((template) => (
                      <Link
                        key={template.id}
                        to={`/categories/${category.slug}/${template.id}`}
                        className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all"
                      >
                        <div className="h-24 relative">
                          <img
                            src={template.cover_thumbnail_url}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2">
                            {template.name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
