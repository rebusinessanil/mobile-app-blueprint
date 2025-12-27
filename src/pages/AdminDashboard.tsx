import { useState, useEffect } from "react";
import { Users, FileImage, Award, Download, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import GoldCoinLoader from "@/components/GoldCoinLoader";
import { AdminGuard } from "@/components/AdminGuard";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalUsers: number;
  totalTemplates: number;
  totalDownloads: number;
  totalRanks: number;
  newUsersToday: number;
  downloadsToday: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTemplates: 0,
    totalDownloads: 0,
    totalRanks: 0,
    newUsersToday: 0,
    downloadsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      const [usersRes, templatesRes, downloadsRes, ranksRes, newUsersRes, downloadsTodayRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('templates').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('banner_downloads').select('id', { count: 'exact', head: true }),
        supabase.from('ranks').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('banner_downloads').select('id', { count: 'exact', head: true }).gte('created_at', today),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalTemplates: templatesRes.count || 0,
        totalDownloads: downloadsRes.count || 0,
        totalRanks: ranksRes.count || 0,
        newUsersToday: newUsersRes.count || 0,
        downloadsToday: downloadsTodayRes.count || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const quickLinks = [
    { label: "Users", path: "/admin/users", icon: Users, color: "text-blue-500" },
    { label: "Templates", path: "/admin/templates", icon: FileImage, color: "text-green-500" },
    { label: "Ranks", path: "/admin/ranks", icon: Award, color: "text-primary" },
    { label: "Stickers", path: "/admin/stickers", icon: FileImage, color: "text-purple-500" },
  ];

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <GoldCoinLoader size="lg" message="Loading dashboard..." />
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <AdminHeader 
          title="Dashboard" 
          subtitle="Welcome to ReBusiness Admin" 
          onRefresh={() => fetchStats(true)} 
          isRefreshing={refreshing} 
        />
        
        <div className="p-4 space-y-6">
          {/* Stats Grid - 4 Cards */}
          <div className="grid grid-cols-2 gap-3">
            <AdminStatsCard 
              icon={<Users className="w-5 h-5" />} 
              value={stats.totalUsers} 
              label="Total Users" 
            />
            <AdminStatsCard 
              icon={<FileImage className="w-5 h-5" />} 
              value={stats.totalTemplates} 
              label="Templates" 
              iconColor="text-green-500"
            />
            <AdminStatsCard 
              icon={<Download className="w-5 h-5" />} 
              value={stats.totalDownloads} 
              label="Downloads" 
              iconColor="text-blue-500"
            />
            <AdminStatsCard 
              icon={<Award className="w-5 h-5" />} 
              value={stats.totalRanks} 
              label="Active Ranks" 
              iconColor="text-purple-500"
            />
          </div>

          {/* Today's Activity */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Today's Activity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">{stats.newUsersToday}</p>
                    <p className="text-xs text-muted-foreground">New Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-500">{stats.downloadsToday}</p>
                    <p className="text-xs text-muted-foreground">Downloads</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="bg-card border border-primary/20 rounded-xl p-4 hover:border-primary/40 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ${link.color}`}>
                      <link.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-foreground">{link.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
