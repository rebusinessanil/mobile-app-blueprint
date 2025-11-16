import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBannerDefaults } from "@/hooks/useBannerDefaults";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UplineManager from "@/components/UplineManager";

export default function AdminBannerDefaults() {
  const navigate = useNavigate();
  const { defaults, loading } = useBannerDefaults();
  const [uplineAvatars, setUplineAvatars] = useState<Array<{ name: string; avatar_url: string }>>([]);
  const [logoLeft, setLogoLeft] = useState<string | null>(null);
  const [logoRight, setLogoRight] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadingLeft, setUploadingLeft] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

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
      setLogoLeft(defaults.logo_left);
      setLogoRight(defaults.logo_right);
    }
  }, [defaults]);

  const handleLogoUpload = async (file: File, position: 'left' | 'right') => {
    const setUploading = position === 'left' ? setUploadingLeft : setUploadingRight;
    setUploading(true);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${position}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      if (position === 'left') {
        setLogoLeft(publicUrl);
      } else {
        setLogoRight(publicUrl);
      }

      toast.success(`${position === 'left' ? 'Left' : 'Right'} logo uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async (position: 'left' | 'right') => {
    if (position === 'left') {
      setLogoLeft(null);
    } else {
      setLogoRight(null);
    }
    toast.success(`${position === 'left' ? 'Left' : 'Right'} logo removed`);
  };

  const handleSave = async () => {
    if (!defaults?.id) return;

    const { error } = await supabase
      .from('banner_defaults')
      .update({ 
        upline_avatars: uplineAvatars,
        logo_left: logoLeft,
        logo_right: logoRight
      })
      .eq('id', defaults.id);

    if (error) {
      toast.error("Failed to save defaults");
      console.error(error);
    } else {
      toast.success("Banner defaults saved successfully!");
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
        {/* Upline Avatars Section */}
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

        {/* Logos Section */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Banner Logos</h2>
            <p className="text-sm text-muted-foreground">
              Upload logos that will appear on the left and right corners of banners
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Left Logo */}
            <div className="gold-border bg-card rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Left Logo</h3>
              
              {logoLeft ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img 
                    src={logoLeft} 
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
              
              {logoRight ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img 
                    src={logoRight} 
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

          <p className="text-xs text-muted-foreground text-center">
            Logos will appear on the top corners of all banners. Recommended: PNG with transparent background.
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl"
        >
          <Save className="w-5 h-5 mr-2" />
          SAVE ALL DEFAULTS
        </Button>
      </div>
    </div>
  );
}
