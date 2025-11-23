import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import UplineCarousel from "@/components/UplineCarousel";
import BackgroundRemoverModal from "@/components/BackgroundRemoverModal";
import ImageCropper from "@/components/ImageCropper";
import { toast } from "sonner";
import { removeBackground, loadImage } from "@/lib/backgroundRemover";
import { useProfile } from "@/hooks/useProfile";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { supabase } from "@/integrations/supabase/client";

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

export default function MotivationalBannerCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"myPhoto" | "others">("myPhoto");
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId || undefined);
  const { settings: bannerSettings } = useBannerSettings(userId || undefined);
  
  const [uplines, setUplines] = useState<Upline[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    teamCity: "",
    quote: "",
    author: ""
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showBgRemover, setShowBgRemover] = useState(false);
  const [processingBg, setProcessingBg] = useState(false);
  const [slotStickers, setSlotStickers] = useState<Record<number, string[]>>({});

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (bannerSettings && uplines.length === 0) {
      const defaultUplines = bannerSettings.upline_avatars.map((upline, index) => ({
        id: `upline-${index}`,
        name: upline.name,
        avatar: upline.avatar_url
      }));
      setUplines(defaultUplines);
    }
  }, [bannerSettings]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempPhoto(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setPhoto(croppedImage);
    setShowCropper(false);
    setTempPhoto(null);
    setShowBgRemover(true);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempPhoto(null);
  };

  const handleKeepBackground = () => {
    setShowBgRemover(false);
  };

  const handleRemoveBackground = async () => {
    if (!photo) return;
    setShowBgRemover(false);
    setProcessingBg(true);
    try {
      const img = await loadImage(await fetch(photo).then(r => r.blob()));
      const processedBlob = await removeBackground(img);
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result as string);
        toast.success("Background removed successfully!");
      };
      reader.readAsDataURL(processedBlob);
    } catch (error) {
      console.error("Background removal error:", error);
      toast.error("Failed to remove background. Keeping original image.");
    } finally {
      setProcessingBg(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error("Please enter Name");
      return;
    }
    if (formData.name.length > 20) {
      toast.error("Name can't exceed 20 characters");
      return;
    }
    if (mode === "myPhoto" && !photo) {
      toast.error("Please upload your photo");
      return;
    }

    navigate("/banner-preview", {
      state: {
        categoryType: "motivational",
        rankName: "Motivational Quote",
        name: formData.name,
        teamCity: formData.teamCity,
        quote: formData.quote,
        author: formData.author,
        photo,
        uplines,
        slotStickers
      }
    });
  };

  const handleReset = () => {
    setFormData({
      name: "",
      teamCity: "",
      quote: "",
      author: ""
    });
    setPhoto(null);
    setTempPhoto(null);
    if (bannerSettings) {
      const defaultUplines = bannerSettings.upline_avatars.map((upline, index) => ({
        id: `upline-${index}`,
        name: upline.name,
        avatar: upline.avatar_url
      }));
      setUplines(defaultUplines);
    } else {
      setUplines([]);
    }
    setSlotStickers({});
    toast.success("Form reset to default values");
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/categories")} className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-3xl p-6 flex items-center justify-center gold-border flex-shrink-0 w-32 h-32">
            <div className="text-5xl">⚡</div>
          </div>
          <div className="flex-1 pt-2">
            <p className="text-sm text-muted-foreground mb-1">Please fill up</p>
            <h1 className="text-3xl font-bold text-primary mb-1">Motivational Quote</h1>
            <p className="text-lg text-blue-400">Inspiration Details</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-foreground font-semibold">Banner Type</label>
          <div className="flex gap-3">
            <button onClick={() => setMode("myPhoto")} className={`flex-1 h-12 rounded-xl font-semibold transition-all ${mode === "myPhoto" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground border-2 border-primary"}`}>
              With My Photo
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="gold-border bg-card/30 rounded-2xl p-4">
            <UplineCarousel uplines={uplines} onUplinesChange={setUplines} maxUplines={5} />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-foreground">Name (Max 20 characters)</label>
              <Input 
                value={formData.name} 
                onChange={e => {
                  const value = e.target.value;
                  if (value.length <= 20) {
                    setFormData({ ...formData, name: value });
                  }
                }} 
                placeholder="Enter Name" 
                maxLength={20}
                className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-12 focus-visible:ring-0 focus-visible:border-primary" 
              />
              <p className="text-xs text-muted-foreground">{formData.name.length}/20 characters</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Team Name <span className="text-muted-foreground">(Optional)</span></label>
              <Input 
                value={formData.teamCity} 
                onChange={e => setFormData({ ...formData, teamCity: e.target.value })} 
                placeholder="Team Name (Optional)" 
                className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-12 focus-visible:ring-0 focus-visible:border-primary" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Quote <span className="text-muted-foreground">(optional)</span></label>
              <Textarea 
                value={formData.quote} 
                onChange={e => setFormData({ ...formData, quote: e.target.value })} 
                placeholder="Enter motivational quote" 
                className="bg-transparent border-2 border-muted rounded-lg text-foreground min-h-20 focus-visible:ring-0 focus-visible:border-primary resize-none" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Author <span className="text-muted-foreground">(optional)</span></label>
              <Input 
                value={formData.author} 
                onChange={e => setFormData({ ...formData, author: e.target.value })} 
                placeholder="Enter quote author" 
                className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-12 focus-visible:ring-0 focus-visible:border-primary" 
              />
            </div>
          </div>

          {mode === "myPhoto" && (
            <div className="w-48 flex-shrink-0">
              {photo ? (
                <div className="relative w-full h-48 gold-border rounded-2xl overflow-hidden bg-secondary">
                  <img src={photo} alt="Uploaded" className="w-full h-full object-cover" />
                  {processingBg && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-sm">Processing...</div>
                    </div>
                  )}
                </div>
              ) : (
                <label className="w-full h-48 gold-border bg-secondary/50 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:gold-glow transition-all">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-primary" />
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleReset} variant="outline" className="flex-1 h-12 border-2 border-primary text-foreground hover:bg-primary/10">
            RESET
          </Button>
          <Button onClick={handleCreate} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            CREATE
          </Button>
        </div>
      </div>

      {showCropper && tempPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0E15] rounded-2xl p-6 w-full max-w-2xl border-2 border-primary shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Crop Your Photo</h3>
            <p className="text-sm text-muted-foreground mb-4">Adjust to 3:4 portrait ratio for perfect banner fit</p>
            <ImageCropper
              image={tempPhoto}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              aspect={0.75}
            />
          </div>
        </div>
      )}

      <BackgroundRemoverModal 
        open={showBgRemover} 
        onKeep={handleKeepBackground} 
        onRemove={handleRemoveBackground} 
        onClose={() => setShowBgRemover(false)} 
      />
    </div>
  );
}
