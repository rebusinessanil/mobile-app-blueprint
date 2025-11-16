import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Calendar, TrendingUp } from "lucide-react";

interface BannerStats {
  total_banners: number;
  banners_today: number;
  banners_this_week: number;
  banners_this_month: number;
  top_rank: string;
  recent_banners: Array<{
    id: string;
    rank_name: string;
    user_name: string;
    created_at: string;
  }>;
}

export default function BannerAnalytics() {
  const [stats, setStats] = useState<BannerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all banners
      const { data: banners, error: bannersError } = await supabase
        .from('banners')
        .select('id, rank_name, user_id, created_at')
        .order('created_at', { ascending: false });

      if (bannersError) throw bannersError;

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const bannersToday = banners?.filter(b => new Date(b.created_at!) >= todayStart).length || 0;
      const bannersThisWeek = banners?.filter(b => new Date(b.created_at!) >= weekStart).length || 0;
      const bannersThisMonth = banners?.filter(b => new Date(b.created_at!) >= monthStart).length || 0;

      // Find most popular rank
      const rankCounts: Record<string, number> = {};
      banners?.forEach(banner => {
        rankCounts[banner.rank_name] = (rankCounts[banner.rank_name] || 0) + 1;
      });
      const topRank = Object.entries(rankCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Fetch user names for recent banners
      const recentBannerIds = banners?.slice(0, 5).map(b => b.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', recentBannerIds);

      const recentBanners = banners?.slice(0, 5).map(banner => {
        const profile = profiles?.find(p => p.user_id === banner.user_id);
        return {
          id: banner.id,
          rank_name: banner.rank_name,
          user_name: profile?.name || 'Unknown User',
          created_at: banner.created_at!,
        };
      }) || [];

      setStats({
        total_banners: banners?.length || 0,
        banners_today: bannersToday,
        banners_this_week: bannersThisWeek,
        banners_this_month: bannersThisMonth,
        top_rank: topRank,
        recent_banners: recentBanners,
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="gold-border bg-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total_banners}</p>
              <p className="text-xs text-muted-foreground">Total Banners</p>
            </div>
          </div>
        </div>

        <div className="gold-border bg-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.banners_today}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </div>
        </div>

        <div className="gold-border bg-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.banners_this_week}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>

        <div className="gold-border bg-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.banners_this_month}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Rank */}
      <div className="gold-border bg-card rounded-2xl p-5">
        <h3 className="text-lg font-bold text-foreground mb-3">Most Popular Rank</h3>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">{stats.top_rank}</span>
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
      </div>

      {/* Recent Banners */}
      <div className="gold-border bg-card rounded-2xl p-5">
        <h3 className="text-lg font-bold text-foreground mb-3">Recent Banners</h3>
        <div className="space-y-3">
          {stats.recent_banners.map((banner) => (
            <div key={banner.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div>
                <p className="font-semibold text-foreground">{banner.rank_name}</p>
                <p className="text-sm text-muted-foreground">{banner.user_name}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(banner.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
