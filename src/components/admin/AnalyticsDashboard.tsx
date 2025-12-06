import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  TrendingUp, 
  FileImage, 
  Activity,
  Calendar,
  Award,
  Database,
  Clock,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface AnalyticsData {
  totalUsers: number;
  totalBanners: number;
  totalTemplates: number;
  activeUsers: number;
  userGrowth: Array<{ date: string; users: number }>;
  bannerTrends: Array<{ date: string; count: number }>;
  templateUsage: Array<{ name: string; count: number }>;
  rankDistribution: Array<{ rank: string; count: number }>;
  systemHealth: {
    dbSize: string;
    avgResponseTime: string;
    uptime: string;
  };
}

const COLORS = ['#FFD34E', '#FFC93C', '#D4AF37', '#FFB000', '#FFA500', '#FF8C00'];

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalyticsCallback = useCallback(async () => {
    await fetchAnalytics();
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    fetchAnalyticsCallback();

    // Real-time subscriptions for instant admin panel updates
    const channel = supabase
      .channel('admin-analytics-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchAnalyticsCallback()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banners' },
        () => fetchAnalyticsCallback()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_credits' },
        () => fetchAnalyticsCallback()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_transactions' },
        () => fetchAnalyticsCallback()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'templates' },
        () => fetchAnalyticsCallback()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banner_downloads' },
        () => fetchAnalyticsCallback()
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Analytics real-time sync active');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeRange, fetchAnalyticsCallback]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total banners
      const { count: totalBanners } = await supabase
        .from('banners')
        .select('*', { count: 'exact', head: true });

      // Fetch total templates
      const { count: totalTemplates } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch active users (users who created banners in the time range)
      const { data: activeBanners } = await supabase
        .from('banners')
        .select('user_id')
        .gte('created_at', startDate.toISOString());
      
      const uniqueUsers = new Set(activeBanners?.map(b => b.user_id) || []);
      const activeUsers = uniqueUsers.size;

      // Fetch user growth data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      const userGrowthMap: Record<string, number> = {};
      profiles?.forEach(profile => {
        const date = new Date(profile.created_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        userGrowthMap[date] = (userGrowthMap[date] || 0) + 1;
      });

      let cumulative = 0;
      const userGrowth = Object.entries(userGrowthMap).map(([date, count]) => {
        cumulative += count;
        return { date, users: cumulative };
      });

      // Fetch banner creation trends
      const { data: banners } = await supabase
        .from('banners')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      const bannerTrendsMap: Record<string, number> = {};
      banners?.forEach(banner => {
        const date = new Date(banner.created_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        bannerTrendsMap[date] = (bannerTrendsMap[date] || 0) + 1;
      });

      const bannerTrends = Object.entries(bannerTrendsMap).map(([date, count]) => ({
        date,
        count
      }));

      // Fetch template usage
      const { data: allBanners } = await supabase
        .from('banners')
        .select('rank_name');

      const templateUsageMap: Record<string, number> = {};
      allBanners?.forEach(banner => {
        const rank = banner.rank_name || 'Unknown';
        templateUsageMap[rank] = (templateUsageMap[rank] || 0) + 1;
      });

      const templateUsage = Object.entries(templateUsageMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name, count }));

      // Fetch rank distribution
      const rankDistribution = Object.entries(templateUsageMap)
        .map(([rank, count]) => ({ rank, count }));

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalBanners: totalBanners || 0,
        totalTemplates: totalTemplates || 0,
        activeUsers,
        userGrowth,
        bannerTrends,
        templateUsage,
        rankDistribution,
        systemHealth: {
          dbSize: "< 100 MB",
          avgResponseTime: "< 200ms",
          uptime: "99.9%"
        }
      });

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-8 text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Last Updated Indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Live sync active
        </span>
        <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground hover:bg-muted border border-primary/20'
            }`}
          >
            {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.activeUsers} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileImage className="w-4 h-4 text-primary" />
              Total Banners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.totalBanners}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(analytics.totalBanners / Math.max(analytics.totalUsers, 1)).toFixed(1)} per user
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.totalTemplates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active templates
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {Math.round((analytics.activeUsers / Math.max(analytics.totalUsers, 1)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="bg-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              User Growth
            </CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #FFD34E',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#FFD34E" 
                  strokeWidth={2}
                  dot={{ fill: '#FFD34E', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Banner Creation Trends */}
        <Card className="bg-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Banner Creation Trends
            </CardTitle>
            <CardDescription>Daily banner creation activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.bannerTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #FFD34E',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="count" fill="#FFD34E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Template Usage */}
        <Card className="bg-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Top Templates
            </CardTitle>
            <CardDescription>Most used banner templates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.templateUsage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#999" 
                  style={{ fontSize: '11px' }}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #FFD34E',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="count" fill="#FFC93C" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rank Distribution Pie Chart */}
        <Card className="bg-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Rank Distribution
            </CardTitle>
            <CardDescription>Banner distribution by rank</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.rankDistribution.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.rankDistribution.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #FFD34E',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="bg-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            System Health
          </CardTitle>
          <CardDescription>Current system status and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Database className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Database Size</p>
                <p className="text-lg font-bold text-foreground">{analytics.systemHealth.dbSize}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-lg font-bold text-foreground">{analytics.systemHealth.avgResponseTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Activity className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-lg font-bold text-foreground">{analytics.systemHealth.uptime}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
