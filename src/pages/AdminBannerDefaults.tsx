import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Upload, X, Users, Image, FileImage, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBannerDefaults } from "@/hooks/useBannerDefaults";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UplineManager from "@/components/UplineManager";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import GoldCoinLoader from "@/components/GoldCoinLoader";

export default function AdminBannerDefaults() {
  const navigate = useNavigate();
  const { defaults, loading } = useBannerDefaults();
  const [uplineAvatars, setUplineAvatars] = useState<Array<{ name: string; avatar_url: string }>>([]);
  const [logoLeft, setLogoLeft] = useState<string | null>(null);
  const [logoRight, setLogoRight] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [congratulationsImage, setCongratulationsImage] = useState<string | null>(null);
  const [uploadingLeft, setUploadingLeft] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);
  const [uploadingCongrats, setUploadingCongrats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);
  const congratsFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data: adminCheck } = await supabase.rpc('is_admin', { user_id: user.id });
      if (!adminCheck) { toast.error("Access denied"); navigate("/dashboard"); return; }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (defaults) {
      setUplineAvatars(defaults.upline_avatars);
      setLogoLeft(defaults.logo_left);
      setLogoRight(defaults.logo_right);
      setCongratulationsImage(defaults.congratulations_image);
    }
  }, [defaults]);

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const handleLogoUpload = async (file: File, position: 'left' | 'right' | 'congrats') => {
    const setUploading = position === 'congrats' ? setUploadingCongrats : (position === 'left' ? setUploadingLeft : setUploadingRight);
    setUploading(true);

    try {
      if (!file.type.startsWith('image/')) { toast.error("Please upload an image"); return; }
      if (file.size > 2 * 1024 * 1024) { toast.error("Image must be less than 2MB"); return; }

      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${position}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('profile-photos').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(filePath);

      if (position === 'left') setLogoLeft(publicUrl);
      else if (position === 'right') setLogoRight(publicUrl);
      else setCongratulationsImage(publicUrl);

      toast.success("Uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = (position: 'left' | 'right' | 'congrats') => {
    if (position === 'left') setLogoLeft(null);
    else if (position === 'right') setLogoRight(null);
    else setCongratulationsImage(null);
    toast.success("Removed");
  };

  const handleSave = async () => {
    if (!defaults?.id) return;

    const { error } = await supabase
      .from('banner_defaults')
      .update({ 
        upline_avatars: uplineAvatars,
        logo_left: logoLeft,
        logo_right: logoRight,
        congratulations_image: congratulationsImage
      })
      .eq('id', defaults.id);

    if (error) toast.error("Failed to save");
    else toast.success("Saved successfully");
  };

  if (!isAdmin || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <GoldCoinLoader size="lg" message="Loading..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader 
        title="Banner Defaults" 
        subtitle="Global banner settings" 
        onRefresh={handleRefresh} 
        isRefreshing={refreshing} 
      />

      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <AdminStatsCard icon={<Users className="w-5 h-5" />} value={uplineAvatars.length} label="Uplines" />
          <AdminStatsCard icon={<Image className="w-5 h-5" />} value={logoLeft ? 1 : 0} label="Left Logo" iconColor={logoLeft ? "text-green-500" : "text-muted-foreground"} />
          <AdminStatsCard icon={<Image className="w-5 h-5" />} value={logoRight ? 1 : 0} label="Right Logo" iconColor={logoRight ? "text-green-500" : "text-muted-foreground"} />
          <AdminStatsCard icon={<FileImage className="w-5 h-5" />} value={congratulationsImage ? 1 : 0} label="Congrats Image" iconColor={congratulationsImage ? "text-green-500" : "text-muted-foreground"} />
        </div>

        {/* Upline Avatars Section */}
        <div className="bg-card border border-primary/20 rounded-2xl p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground">Default Top Uplines</h3>
            <p className="text-xs text-muted-foreground">These avatars appear by default on all new user banners</p>
          </div>
          <UplineManager
            uplines={uplineAvatars}
            onUplinesChange={setUplineAvatars}
            maxUplines={5}
          />
        </div>

        {/* Logos Section */}
        <div className="bg-card border border-primary/20 rounded-2xl p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground">Banner Logos</h3>
            <p className="text-xs text-muted-foreground">Appear on left and right corners of banners</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Left Logo */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Left Logo</p>
              {logoLeft ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-primary/20">
                  <img src={logoLeft} alt="Left logo" className="w-full h-full object-contain" />
                  <button
                    onClick={() => handleRemoveLogo('left')}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-destructive-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => leftFileInputRef.current?.click()}
                  disabled={uploadingLeft}
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-6 h-6 text-primary" />
                  <span className="text-xs text-muted-foreground">{uploadingLeft ? 'Uploading...' : 'Upload'}</span>
                </button>
              )}
              <input ref={leftFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'left')} />
            </div>

            {/* Right Logo */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Right Logo</p>
              {logoRight ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-primary/20">
                  <img src={logoRight} alt="Right logo" className="w-full h-full object-contain" />
                  <button
                    onClick={() => handleRemoveLogo('right')}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-destructive-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => rightFileInputRef.current?.click()}
                  disabled={uploadingRight}
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-6 h-6 text-primary" />
                  <span className="text-xs text-muted-foreground">{uploadingRight ? 'Uploading...' : 'Upload'}</span>
                </button>
              )}
              <input ref={rightFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'right')} />
            </div>
          </div>
        </div>

        {/* Congratulations Image Section */}
        <div className="bg-card border border-primary/20 rounded-2xl p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground">Congratulations Image</h3>
            <p className="text-xs text-muted-foreground">Appears on all user banners automatically</p>
          </div>

          {congratulationsImage ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-primary/20">
              <img src={congratulationsImage} alt="Congratulations" className="w-full h-full object-contain" />
              <button
                onClick={() => handleRemoveLogo('congrats')}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center"
              >
                <X className="w-3 h-3 text-destructive-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => congratsFileInputRef.current?.click()}
              disabled={uploadingCongrats}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Upload className="w-8 h-8 text-primary" />
              <span className="text-sm text-muted-foreground">{uploadingCongrats ? 'Uploading...' : 'Upload Congratulations Image'}</span>
            </button>
          )}
          <input ref={congratsFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'congrats')} />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave} 
          className="w-full h-12 bg-[#E5B80B] hover:bg-[#E5B80B]/90 text-black font-bold rounded-2xl"
        >
          <Save className="w-5 h-5 mr-2" />
          SAVE ALL DEFAULTS
        </Button>
      </div>
    </AdminLayout>
  );
}
