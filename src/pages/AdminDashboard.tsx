import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, TrendingUp, Coins, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UserManagement from "@/components/admin/UserManagement";
import BannerAnalytics from "@/components/admin/BannerAnalytics";
import TokenManagement from "@/components/admin/TokenManagement";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Authentication required");
        navigate("/login");
        return;
      }

      const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin', { user_id: user.id });
      
      if (adminError || !adminCheck) {
        toast.error("Access denied - Admin privileges required");
        navigate("/dashboard");
        return;
      }
      
      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage users, analytics & tokens</p>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="gold-border bg-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">--</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>

          <div className="gold-border bg-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">--</p>
                <p className="text-xs text-muted-foreground">Banners Created</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-card border-2 border-primary/20 rounded-2xl p-1">
            <TabsTrigger 
              value="users" 
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="tokens"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Coins className="w-4 h-4 mr-2" />
              Tokens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <BannerAnalytics />
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <TokenManagement />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-bold text-foreground">Quick Actions</h3>
          
          <Button
            onClick={() => navigate("/admin/banner-defaults")}
            className="w-full h-14 gold-border bg-card hover:bg-muted text-foreground justify-start"
          >
            <Settings className="w-5 h-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-semibold">Banner Defaults</p>
              <p className="text-xs text-muted-foreground">Configure default uplines & logos</p>
            </div>
          </Button>

          <Button
            onClick={() => navigate("/admin/templates")}
            className="w-full h-14 gold-border bg-card hover:bg-muted text-foreground justify-start"
          >
            <TrendingUp className="w-5 h-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-semibold">Manage Templates</p>
              <p className="text-xs text-muted-foreground">Add & configure banner templates</p>
            </div>
          </Button>

          <Button
            onClick={() => navigate("/admin/stickers")}
            className="w-full h-14 gold-border bg-card hover:bg-muted text-foreground justify-start"
          >
            <Settings className="w-5 h-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-semibold">Manage Stickers</p>
              <p className="text-xs text-muted-foreground">Upload & organize sticker assets</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
