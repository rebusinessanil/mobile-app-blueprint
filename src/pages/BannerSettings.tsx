import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UplineManager from "@/components/UplineManager";

export default function BannerSettings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const { settings, updateSettings, loading } = useBannerSettings(userId || undefined);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    const { error } = await updateSettings(settings);
    
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Banner settings saved successfully!");
      navigate("/profile");
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/profile")} 
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Banner Settings</h1>
            <p className="text-sm text-muted-foreground">Customize default banner preferences</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Default Top Uplines */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Default Top Uplines</h2>
            <p className="text-sm text-muted-foreground">
              These avatars will appear by default on all your banners
            </p>
          </div>
          
          <div className="gold-border bg-card rounded-2xl p-5">
            <UplineManager
              uplines={settings.upline_avatars}
              onUplinesChange={(uplines) => 
                updateSettings({ upline_avatars: uplines })
              }
              maxUplines={5}
            />
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Upload up to 5 upline/mentor avatars. You can change these anytime in Profile settings.
          </p>
        </div>

        {/* Display Preferences */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Display Preferences</h2>
          
          <div className="space-y-3">
            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Upline Photos</p>
                  <p className="text-sm text-muted-foreground">Display names below upline avatars</p>
                </div>
                <Switch 
                  checked={settings.show_upline_names} 
                  onCheckedChange={(checked) => 
                    updateSettings({ show_upline_names: checked })
                  } 
                  className="data-[state=checked]:bg-primary" 
                />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Contact Info</p>
                  <p className="text-sm text-muted-foreground">Include mobile/WhatsApp on banners</p>
                </div>
                <Switch
                  checked={settings.show_contact_info}
                  onCheckedChange={(checked) =>
                    updateSettings({ show_contact_info: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Rank Badge</p>
                  <p className="text-sm text-muted-foreground">Display rank icon on banners</p>
                </div>
                <Switch
                  checked={settings.show_rank_badge}
                  onCheckedChange={(checked) =>
                    updateSettings({ show_rank_badge: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto Share to Feed</p>
                  <p className="text-sm text-muted-foreground">Automatically post to community feed</p>
                </div>
                <Switch
                  checked={settings.auto_share_to_feed}
                  onCheckedChange={(checked) =>
                    updateSettings({ auto_share_to_feed: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl"
        >
          <Save className="w-5 h-5 mr-2" />
          SAVE SETTINGS
        </Button>
      </div>
    </div>
  );
}
