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
  const [congratulationsImage, setCongratulationsImage] = useState<string | null>(null);
  const [uploadingLeft, setUploadingLeft] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);
  const [uploadingCongrats, setUploadingCongrats] = useState(false);
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);
  const congratsFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Auth error:", userError);
        toast.error("Authentication error");
        navigate("/login");
        return;
      }
      
      if (!user) {
        console.log("No user found, redirecting to login");
        navigate("/login");
        return;
      }

      console.log("Checking admin status for user:", user.id);
      const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin', { user_id: user.id });
      
      if (adminError) {
        console.error("Admin check error:", adminError);
        toast.error("Failed to verify admin status");
        navigate("/dashboard");
        return;
      }
      
      console.log("Admin check result:", adminCheck);
      
      if (!adminCheck) {
        toast.error("Access denied - Admin privileges required. Please log out and log back in.");
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
      setCongratulationsImage(defaults.congratulations_image);
    }
  }, [defaults]);

  const handleLogoUpload = async (file: File, position: 'left' | 'right' | 'congrats') => {
    const setUploading = position === 'congrats' ? setUploadingCongrats : (position === 'left' ? setUploadingLeft : setUploadingRight);
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
      } else if (position === 'right') {
        setLogoRight(publicUrl);
      } else {
        setCongratulationsImage(publicUrl);
      }

      toast.success(`${position === 'congrats' ? 'Congratulations' : position === 'left' ? 'Left' : 'Right'} ${position === 'congrats' ? 'image' : 'logo'} uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async (position: 'left' | 'right' | 'congrats') => {
    if (position === 'left') {
      setLogoLeft(null);
    } else if (position === 'right') {
      setLogoRight(null);
    } else {
      setCongratulationsImage(null);
    }
    toast.success(`${position === 'congrats' ? 'Congratulations image' : position === 'left' ? 'Left' : 'Right' + ' logo'} removed`);
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

    if (error) {
      toast.error("Failed to save defaults");
      console.error(error);
    } else {
      toast.success("Banner defaults saved successfully!");
    }
  };

  // Template colors for background previews
  const templateColors = [
    { id: 0, name: "Green Black", bgColor: "from-green-500 to-black" },
    { id: 1, name: "Blue Purple", bgColor: "from-blue-500 to-purple-600" },
    { id: 2, name: "Red Orange", bgColor: "from-red-500 to-orange-600" },
    { id: 3, name: "Pink Violet", bgColor: "from-pink-500 to-violet-600" },
    { id: 4, name: "Teal Cyan", bgColor: "from-teal-500 to-cyan-600" },
    { id: 5, name: "Yellow Green", bgColor: "from-yellow-500 to-green-600" },
    { id: 6, name: "Indigo Blue", bgColor: "from-indigo-500 to-blue-600" },
    { id: 7, name: "Rose Red", bgColor: "from-rose-500 to-red-600" },
    { id: 8, name: "Emerald Teal", bgColor: "from-emerald-500 to-teal-600" },
    { id: 9, name: "Amber Orange", bgColor: "from-amber-500 to-orange-600" },
    { id: 10, name: "Purple Fuchsia", bgColor: "from-purple-500 to-fuchsia-600" },
    { id: 11, name: "Lime Green", bgColor: "from-lime-500 to-green-600" },
    { id: 12, name: "Sky Blue", bgColor: "from-sky-500 to-blue-600" },
    { id: 13, name: "Orange Red", bgColor: "from-orange-500 to-red-600" },
    { id: 14, name: "Violet Purple", bgColor: "from-violet-500 to-purple-600" },
    { id: 15, name: "Cyan Teal", bgColor: "from-cyan-500 to-teal-600" },
  ];

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      <header className="flex items-center justify-between py-3 px-4 bg-card border-b-2 border-gold/20">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-6 h-6 text-gold" />
        </Button>
        <h1 className="text-xl font-bold text-gold">Admin - Banner Defaults</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/admin/template-backgrounds')}
          className="text-gold border-gold/30"
        >
          Template Backgrounds
        </Button>
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

        {/* Congratulations Image Section */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Default Congratulations Image</h2>
            <p className="text-sm text-muted-foreground">
              This image will appear on all user banners automatically. Only admins can modify this.
            </p>
          </div>

          <div className="gold-border bg-card rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Congratulations Banner Image</h3>
            
            {congratulationsImage ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                <img 
                  src={congratulationsImage} 
                  alt="Congratulations" 
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => handleRemoveLogo('congrats')}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-destructive-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => congratsFileInputRef.current?.click()}
                disabled={uploadingCongrats}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card hover:bg-muted/50 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Upload className="w-8 h-8 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {uploadingCongrats ? 'Uploading...' : 'Upload Congratulations Image'}
                </span>
              </button>
            )}
            
            <input
              ref={congratsFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file, 'congrats');
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This image will display on all user banners automatically and cannot be changed by users.
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
