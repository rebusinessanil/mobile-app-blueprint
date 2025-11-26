import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Menu, Bell, Star, Calendar, Zap, Award } from "lucide-react";
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
export default function Dashboard() {
  const {
    categories
  } = useTemplateCategories();
  const {
    templates: allTemplates
  } = useTemplates();
  const {
    ranks
  } = useRanks();
  const {
    trips
  } = useBonanzaTrips();
  const {
    birthdays
  } = useBirthdays();
  const {
    anniversaries
  } = useAnniversaries();
  const {
    motivationalBanners
  } = useMotivationalBanners();
  const {
    festivals
  } = useFestivals();
  const {
    stories: generatedStories
  } = useGeneratedStories();
  const [userId, setUserId] = useState<string | null>(null);
  const {
    profile
  } = useProfile(userId ?? undefined);
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
  return <div className="min-h-screen bg-navy-dark pb-24">
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
            <Link to="/messages" className="relative w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Bell className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs font-bold flex items-center justify-center text-white">
                2
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Stories Section - Square Festival Cards */}
        {festivals.length > 0 && <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📖</span>
                <h2 className="text-sm font-bold text-foreground">Stories</h2>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {festivals.slice(0, 16).map(festival => <Link key={festival.id} to={`/festival-preview/${festival.id}`} className="min-w-[84px] relative flex-shrink-0 transition-all hover:scale-105">
                  <div className="gold-border bg-card rounded-2xl overflow-hidden">
                    <div className="w-[84px] h-[84px] relative">
                      <img src={festival.poster_url} alt={festival.festival_name} className="w-full h-full object-cover" />
                      {/* Green Active Indicator */}
                      <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg" />
                    </div>
                    <div className="p-2 text-center">
                      <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
                        {festival.festival_name}
                      </p>
                    </div>
                  </div>
                </Link>)}
            </div>
          </div>}

        {/* Auto-Generated Stories Section */}
        {generatedStories.length > 0 && <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <h2 className="text-lg font-bold text-foreground">Today's Stories</h2>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {generatedStories.map(story => <Link key={story.id} to={story.status === 'active' ? `/story/${story.id}` : '#'} className={`min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 transition-all ${story.status === 'active' ? 'hover:gold-glow' : 'opacity-75'}`}>
                  <div className="h-24 relative">
                    <img src={story.poster_url} alt={story.title} className="w-full h-full object-cover" />
                    {story.status === 'preview_only' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary" className="text-xs">
                          Coming Tomorrow
                        </Badge>
                      </div>}
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {story.title}
                    </p>
                    {story.status === 'preview_only' && <p className="text-xs text-muted-foreground mt-1">Preview Only</p>}
                  </div>
                </Link>)}
            </div>
          </div>}

        {/* Quick Actions */}
        

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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
                </div>
                <Link to={isRankPromotion ? '/rank-selection' : isBonanzaPromotion ? '/categories/bonanza-trips' : isBirthday ? '/categories/birthdays' : isAnniversary ? '/categories/anniversaries' : isMotivational ? '/categories/motivational' : isFestival ? '/categories/festival' : `/categories/${category.slug}`} className="text-primary text-sm font-semibold hover:underline">
                  See All →
                </Link>
              </div>

              {/* Rank Promotion - Show Ranks with Cover Images */}
              {isRankPromotion ? <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getRankTemplates().map(template => {
              const rank = ranks.find(r => r.id === template.rank_id);
              return <Link key={template.id} to={`/rank-banner-create/${template.rank_id}`} className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all">
                        {template.cover_thumbnail_url ? <div className="h-24 relative">
                            <img src={template.cover_thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                          </div> : <div className={`h-24 ${rank?.gradient || 'bg-gradient-to-br from-secondary to-card'} flex items-center justify-center text-4xl`}>
                            {rank?.icon || '🏆'}
                          </div>}
                        <div className="p-3 text-center">
                          <p className="text-sm font-semibold text-foreground leading-tight">{template.name}</p>
                        </div>
                      </Link>;
            })}
                </div> : isBonanzaPromotion ? (/* Bonanza Trips - Show Trips with Cover Images */
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getTripTemplates().map(template => {
              const trip = trips.find(t => t.id === template.trip_id);
              return <Link key={template.id} to={`/banner-create/bonanza?tripId=${template.trip_id}`} className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all">
                        {template.cover_thumbnail_url ? <div className="h-24 relative">
                            <img src={template.cover_thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                          </div> : <div className="h-24 bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-4xl">
                            {trip?.short_title || '🎁'}
                          </div>}
                        <div className="p-3 text-center">
                          <p className="text-sm font-semibold text-foreground leading-tight">{template.name}</p>
                        </div>
                      </Link>;
            })}
                </div>) : isBirthday ? (/* Birthday - Show Birthday themes with Cover Images */
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getBirthdayTemplates().map(template => {
              const birthday = birthdays.find(b => b.id === template.birthday_id);
              return <Link key={template.id} to={`/banner-create/birthday?birthdayId=${template.birthday_id}`} className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all">
                        {template.cover_thumbnail_url ? <div className="h-24 relative">
                            <img src={template.cover_thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                          </div> : <div className="h-24 bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center text-4xl">
                            {birthday?.short_title || '🎂'}
                          </div>}
                        <div className="p-3 text-center">
                          <p className="text-sm font-semibold text-foreground leading-tight">{template.name}</p>
                        </div>
                      </Link>;
            })}
                </div>) : isAnniversary ? (/* Anniversary - Show Anniversary themes with Cover Images */
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getAnniversaryTemplates().map(template => {
              const anniversary = anniversaries.find(a => a.id === template.anniversary_id);
              return <Link key={template.id} to={`/banner-create/anniversary?anniversaryId=${template.anniversary_id}`} className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all">
                        {template.cover_thumbnail_url ? <div className="h-24 relative">
                            <img src={template.cover_thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                          </div> : <div className="h-24 bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center text-4xl">
                            {anniversary?.short_title || '💞'}
                          </div>}
                        <div className="p-3 text-center">
                          <p className="text-sm font-semibold text-foreground leading-tight">{template.name}</p>
                        </div>
                      </Link>;
            })}
                </div>) : isMotivational ? (/* Motivational - Direct navigation to Banner Preview with motivationalBannerId */
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getMotivationalBannerTemplates().map(template => {
              const motivationalBanner = motivationalBanners.find(mb => mb.id === template.motivational_banner_id);
              return <Link key={template.id} to={`/motivational-preview/${template.motivational_banner_id}`} className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all">
                        {template.cover_thumbnail_url ? <div className="h-24 relative">
                            <img src={template.cover_thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                          </div> : <div className="h-24 bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center text-4xl">
                            {motivationalBanner?.short_title || '⚡'}
                          </div>}
                        <div className="p-3 text-center">
                          <p className="text-sm font-semibold text-foreground leading-tight">{template.name}</p>
                        </div>
                      </Link>;
            })}
                </div>) : isFestival ? (/* Festival - Direct navigation to Banner Preview with festivalId */
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getFestivalTemplates().map(template => {
              const festival = festivals.find(f => f.id === template.festival_id);
              return <Link key={template.id} to={`/festival-preview/${template.festival_id}`} className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all">
                        {template.cover_thumbnail_url ? <div className="h-24 relative">
                            <img src={template.cover_thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                          </div> : <div className="h-24 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-4xl">
                            🎉
                          </div>}
                        <div className="p-3 text-center">
                          <p className="text-sm font-semibold text-foreground leading-tight">{template.name}</p>
                          {festival && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{festival.festival_name}</p>}
                        </div>
                      </Link>;
            })}
                </div>) : (/* Template Scroll - Dynamic from Backend */
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {categoryTemplates.length > 0 ? categoryTemplates.map(template => {
              // Map category slugs to unified banner routes
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
              return <Link key={template.id} to={getCategoryRoute()} className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 hover:gold-glow transition-all mx-0 my-0 py-0 px-0">
                        {template.cover_thumbnail_url ? <div className="h-32 relative">
                            <img src={template.cover_thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                          </div> : <div className="h-32 bg-gradient-to-br from-secondary to-card flex items-center justify-center">
                            <div className="text-center px-2">
                              <p className="text-white font-bold text-sm">CHANGE COVER</p>
                              <p className="text-primary text-xs mt-1">{"{ BACKEND }"}</p>
                            </div>
                          </div>}
                      </Link>;
            }) : <div className="min-w-[140px] gold-border bg-card rounded-2xl overflow-hidden flex-shrink-0 p-4">
                      <p className="text-xs text-muted-foreground text-center">No templates yet</p>
                    </div>}
                </div>)}
            </div>;
      })}
      </div>

      <BottomNav />
    </div>;
}