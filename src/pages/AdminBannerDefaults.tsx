import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBannerDefaults } from "@/hooks/useBannerDefaults";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UplineManager from "@/components/UplineManager";

export default function AdminBannerDefaults() {
  const navigate = useNavigate();
  const { defaults, loading } = useBannerDefaults();
  const [uplineAvatars, setUplineAvatars] = useState<Array<{ name: string; avatar_url: string }>>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: adminCheck } = await supabase.rpc('is_admin', { user_id: user.id });
      if (!adminCheck) {
        toast.error("Access denied");
        navigate("/dashboard");
        return;
      }
      
      setIsAdmin(true);
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (defaults) {
      setUplineAvatars(defaults.upline_avatars);
    }
  }, [defaults]);

  const handleSave = async () => {
    if (!defaults?.id) return;

    const { error } = await supabase
      .from('banner_defaults')
      .update({ upline_avatars: uplineAvatars })
      .eq('id', defaults.id);

    if (error) {
      toast.error("Failed to save defaults");
      console.error(error);
    } else {
      toast.success("Default uplines saved successfully!");
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin: Banner Defaults</h1>
            <p className="text-sm text-muted-foreground">Set default uplines for all users</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Default Top Uplines</h2>
            <p className="text-sm text-muted-foreground">
              These avatars will appear by default on all new user banners
            </p>
          </div>
          
          <div className="gold-border bg-card rounded-2xl p-5">
            <UplineManager
              uplines={uplineAvatars}
              onUplinesChange={setUplineAvatars}
              maxUplines={5}
            />
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            These defaults will apply to all users who haven't customized their own uplines.
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl"
        >
          <Save className="w-5 h-5 mr-2" />
          SAVE DEFAULTS
        </Button>
      </div>
    </div>
  );
}
