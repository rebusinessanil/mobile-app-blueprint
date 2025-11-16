import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function BannerSettings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const { photos: profilePhotos } = useProfilePhotos(userId || undefined);
  
  const [settings, setSettings] = useState({
    showUplineNames: true,
    showContactInfo: true,
    showRankBadge: true,
    autoShareToFeed: false
  });

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
  const handleSave = () => {
    // TODO: Save to backend
    toast.success("Banner settings saved successfully!");
    navigate("/profile");
  };
  return <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Banner Settings</h1>
            <p className="text-sm text-muted-foreground">Customize default banner preferences</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Profile Photos - Auto Synced */}
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Profile Photos</h2>
            <p className="text-sm text-muted-foreground">
              Auto-synced from your profile (max 5 photos)
            </p>
          </div>
          
          <div className="gold-border bg-card rounded-2xl p-5">
            {profilePhotos && profilePhotos.length > 0 ? (
              <div className="grid grid-cols-5 gap-3">
                {profilePhotos.map((photo, index) => (
                  <div key={photo.id} className="relative aspect-square gold-border bg-card rounded-2xl overflow-hidden">
                    <img 
                      src={photo.photo_url} 
                      alt={`Profile ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    {photo.is_primary && (
                      <div className="absolute top-1 left-1 bg-primary rounded-full px-2 py-0.5">
                        <span className="text-xs text-primary-foreground font-semibold">Primary</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No profile photos yet.</p>
                <p className="text-sm mt-2">Add photos in your Profile section and they'll appear here automatically.</p>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            These photos are automatically synced from your Profile. Edit them in Profile settings.
          </p>
        </div>

        {/* Display Settings */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Display Preferences</h2>
          
          <div className="space-y-3">
            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Upline Photos  </p>
                  <p className="text-sm text-muted-foreground">Display names below upline avatars</p>
                </div>
                <Switch checked={settings.showUplineNames} onCheckedChange={checked => setSettings({
                ...settings,
                showUplineNames: checked
              })} className="data-[state=checked]:bg-primary" />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Contact Info</p>
                  <p className="text-sm text-muted-foreground">Include mobile/WhatsApp on banners</p>
                </div>
                <Switch
                  checked={settings.showContactInfo}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showContactInfo: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Rank Badge</p>
                  <p className="text-sm text-muted-foreground">Display rank/achievement badge</p>
                </div>
                <Switch
                  checked={settings.showRankBadge}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showRankBadge: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto Share to Feed</p>
                  <p className="text-sm text-muted-foreground">Automatically post banners to community feed</p>
                </div>
                <Switch
                  checked={settings.autoShareToFeed}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoShareToFeed: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl">
          <Save className="w-5 h-5 mr-2" />
          SAVE SETTINGS
        </Button>
      </div>
    </div>;
}