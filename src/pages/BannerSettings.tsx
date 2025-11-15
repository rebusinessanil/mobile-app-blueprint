import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import UplineCarousel from "@/components/UplineCarousel";
import { adminPresetUplines } from "@/data/adminPresets";
import { toast } from "sonner";
interface Upline {
  id: string;
  name: string;
  avatar?: string;
}
export default function BannerSettings() {
  const navigate = useNavigate();
  const [uplines, setUplines] = useState<Upline[]>([]);
  const [settings, setSettings] = useState({
    showUplineNames: true,
    showContactInfo: true,
    showRankBadge: true,
    autoShareToFeed: false
  });
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
        {/* Default Uplines Section */}
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Default Top Uplines</h2>
            <p className="text-sm text-muted-foreground">
              These avatars will appear by default on all your banners
            </p>
          </div>
          
          <div className="gold-border bg-card rounded-2xl p-5">
            <UplineCarousel uplines={uplines} onUplinesChange={setUplines} maxUplines={5} adminPresets={adminPresetUplines} />
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Upload up to 5 upline/mentor avatars. You can change these anytime in Profile settings.
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
                <Switch checked={settings.showContactInfo} onCheckedChange={checked => setSettings({
                ...settings,
                showContactInfo: checked
              })} className="data-[state=checked]:bg-primary" />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Rank Badge</p>
                  <p className="text-sm text-muted-foreground">Display rank icon on banners</p>
                </div>
                <Switch checked={settings.showRankBadge} onCheckedChange={checked => setSettings({
                ...settings,
                showRankBadge: checked
              })} className="data-[state=checked]:bg-primary" />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto Share to Feed</p>
                  <p className="text-sm text-muted-foreground">Automatically post to community feed</p>
                </div>
                <Switch checked={settings.autoShareToFeed} onCheckedChange={checked => setSettings({
                ...settings,
                autoShareToFeed: checked
              })} className="data-[state=checked]:bg-primary" />
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