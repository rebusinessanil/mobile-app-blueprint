import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UplineManager from "@/components/UplineManager";
export default function BannerSettings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadingLeft, setUploadingLeft] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    settings,
    updateSettings,
    loading
  } = useBannerSettings(userId || undefined);

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

  const handleLogoUpload = async (file: File, position: 'left' | 'right') => {
    const setUploading = position === 'left' ? setUploadingLeft : setUploadingRight;
    setUploading(true);

    try {
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Only PNG/JPG images up to 5MB allowed");
        return;
      }

      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeUserId = userId || 'unknown';
      const fileName = `logo-${position}-${safeUserId}-${Date.now()}.${fileExt}`;
      const filePath = `${safeUserId}/logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true, contentType: file.type, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      await updateSettings({
        [position === 'left' ? 'logo_left' : 'logo_right']: publicUrl
      });

      toast.success(`${position === 'left' ? 'Left' : 'Right'} logo uploaded successfully!`);
    } catch (error: any) {
      console.error('Upload error:', error);
      const msg = (error?.message || '').toString().toLowerCase();
      if (msg.includes('row-level security')) {
        toast.error('Upload blocked by security policy (RLS). Please configure storage policies.');
      } else {
        toast.error('Failed to upload logo');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async (position: 'left' | 'right') => {
    await updateSettings({
      [position === 'left' ? 'logo_left' : 'logo_right']: null
    });
    toast.success(`${position === 'left' ? 'Left' : 'Right'} logo removed`);
  };

  const handleSave = async () => {
    toast.success("All settings are auto-saved!");
    navigate("/profile");
  };
  if (loading || !settings) {
    return <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>;
  }
  return <div className="min-h-screen bg-navy-dark pb-6 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-4 sm:px-6 py-4 border-b border-primary/20">
        <div className="flex items-center gap-4 max-w-screen-md mx-auto">
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Banner Settings</h1>
            <p className="text-sm text-muted-foreground">Customize default banner preferences</p>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-screen-md mx-auto">
        {/* Default Top Uplines */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Default Top Uplines</h2>
            
          </div>
          
          <div className="gold-border bg-card rounded-2xl p-5 mx-0 my-0 py-[17px]">
            <UplineManager uplines={settings.upline_avatars} onUplinesChange={uplines => updateSettings({
            upline_avatars: uplines
          })} maxUplines={5} />
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Upload up to 5 upline/mentor avatars. You can change these anytime in Profile settings.
          </p>
        </div>

        {/* Banner Logos */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Banner Logos</h2>
            <p className="text-sm text-muted-foreground">
              Upload custom logos for your banners (optional)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Left Logo */}
            <div className="gold-border bg-card rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Left Logo</h3>
              
              {settings.logo_left ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img 
                    src={settings.logo_left} 
                    alt="Left logo" 
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => handleRemoveLogo('left')}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-destructive-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => leftFileInputRef.current?.click()}
                  disabled={uploadingLeft}
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card hover:bg-muted/50 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-8 h-8 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingLeft ? 'Uploading...' : 'Upload Logo'}
                  </span>
                </button>
              )}
              
              <input
                ref={leftFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file, 'left');
                }}
              />
            </div>

            {/* Right Logo */}
            <div className="gold-border bg-card rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Right Logo</h3>
              
              {settings.logo_right ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img 
                    src={settings.logo_right} 
                    alt="Right logo" 
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => handleRemoveLogo('right')}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-destructive-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => rightFileInputRef.current?.click()}
                  disabled={uploadingRight}
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card hover:bg-muted/50 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-8 h-8 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingRight ? 'Uploading...' : 'Upload Logo'}
                  </span>
                </button>
              )}
              
              <input
                ref={rightFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file, 'right');
                }}
              />
            </div>
          </div>
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
                <Switch checked={settings.show_upline_names} onCheckedChange={checked => updateSettings({
                show_upline_names: checked
              })} className="data-[state=checked]:bg-primary" />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Contact Info</p>
                  <p className="text-sm text-muted-foreground">Include mobile/WhatsApp on banners</p>
                </div>
                <Switch checked={settings.show_contact_info} onCheckedChange={checked => updateSettings({
                show_contact_info: checked
              })} className="data-[state=checked]:bg-primary" />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Show Rank Badge</p>
                  <p className="text-sm text-muted-foreground">Display rank icon on banners</p>
                </div>
                <Switch checked={settings.show_rank_badge} onCheckedChange={checked => updateSettings({
                show_rank_badge: checked
              })} className="data-[state=checked]:bg-primary" />
              </div>
            </div>

            <div className="gold-border bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Auto Share to Feed</p>
                  <p className="text-sm text-muted-foreground">Automatically post to community feed</p>
                </div>
                <Switch checked={settings.auto_share_to_feed} onCheckedChange={checked => updateSettings({
                auto_share_to_feed: checked
              })} className="data-[state=checked]:bg-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center">
            ✨ All changes are saved automatically in real-time
          </p>
          <Button 
            onClick={handleSave} 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl"
          >
            <Save className="w-5 h-5 mr-2" />
            DONE
          </Button>
        </div>
      </div>
    </div>;
}