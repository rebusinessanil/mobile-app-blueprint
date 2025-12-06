import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UplineCarousel from "@/components/UplineCarousel";
import BackgroundRemoverModal from "@/components/BackgroundRemoverModal";
import ImageCropper from "@/components/ImageCropper";
import { ranks } from "@/data/ranks";
import { toast } from "sonner";
import { useBackgroundRemovalFast } from "@/hooks/useBackgroundRemovalFast";
import { useProfile } from "@/hooks/useProfile";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { supabase } from "@/integrations/supabase/client";

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

export default function RankBannerCreate() {
  const navigate = useNavigate();
  const { rankId } = useParams();
  const rank = ranks.find(r => r.id === rankId);
  const [mode, setMode] = useState<"myPhoto" | "others">("myPhoto");
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId || undefined);
  const { settings: bannerSettings } = useBannerSettings(userId || undefined);
  
  const [uplines, setUplines] = useState<Upline[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    teamCity: "",
    chequeAmount: ""
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [slotStickers, setSlotStickers] = useState<Record<number, string[]>>({});

  // Fast backend background removal hook
  const bgRemoval = useBackgroundRemovalFast({
    onSuccess: (processedUrl) => setPhoto(processedUrl)
  });

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

  if (!rank) {
    return null;
  }

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
    bgRemoval.openModal(croppedImage);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempPhoto(null);
  };

  const handleKeepBackground = () => {
    bgRemoval.closeModal();
  };

  const handleRemoveBackground = async () => {
    await bgRemoval.processRemoval();
  };

  const handleCreate = async () => {
    if (bgRemoval.isProcessing) {
      toast.warning("Please wait for background removal to complete");
      return;
    }
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

    const { data: template } = await supabase
      .from('templates')
      .select('id')
      .eq('rank_id', rankId)
      .single();

    navigate("/banner-preview", {
      state: {
        rankName: rank.name,
        rankIcon: rank.icon,
        rankGradient: rank.gradient,
        name: formData.name,
        teamCity: formData.teamCity,
        chequeAmount: formData.chequeAmount,
        photo,
        uplines,
        slotStickers,
        templateId: template?.id,
        rankId: rankId
      }
    });
  };

  const handleReset = () => {
    if (bgRemoval.isProcessing) {
      toast.warning("Please wait for background removal to complete");
      return;
    }
    setFormData({
      name: "",
      teamCity: "",
      chequeAmount: ""
    });
    setPhoto(null);
    setTempPhoto(null);
    setShowCropper(false);
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
    <div className="h-screen bg-navy-dark flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <header className="flex-shrink-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-4 py-3 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => !bgRemoval.isProcessing && navigate("/dashboard")} 
            className="w-9 h-9 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
            disabled={bgRemoval.isProcessing}
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-primary">Rank: {rank.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content - Flexbox auto-fit */}
      <div className="flex-1 flex flex-col px-4 py-3 overflow-hidden">
        {/* Rank Info Section */}
        <div className="flex-shrink-0 flex items-center gap-3 mb-3">
          <div className={`${rank.gradient} rounded-2xl p-3 flex items-center justify-center gold-border w-16 h-16`}>
            <div className="text-2xl">{rank.icon}</div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Please fill up</p>
            <h1 className="text-xl font-bold text-primary">{rank.name}</h1>
            <p className="text-sm text-blue-400">Achiever Details</p>
          </div>
        </div>

        {/* Banner Type Toggle */}
        <div className="flex-shrink-0 mb-3">
          <label className="text-xs text-foreground font-semibold mb-1 block">Banner Type</label>
          <button 
            onClick={() => setMode("myPhoto")} 
            className={`w-full h-10 rounded-xl font-semibold transition-all text-sm ${mode === "myPhoto" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground border-2 border-primary"}`}
          >
            With My Photo
          </button>
        </div>

        {/* Uplines Section */}
        <div className="flex-shrink-0 mb-3">
          <div className="gold-border bg-card/30 rounded-xl p-2">
            <UplineCarousel uplines={uplines} onUplinesChange={setUplines} maxUplines={5} />
          </div>
        </div>

        {/* Form Fields + Photo - Flex to fill remaining space */}
        <div className="flex-1 flex gap-3 min-h-0">
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-foreground">Name (Max 20)</label>
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
                  className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-9 text-sm focus-visible:ring-0 focus-visible:border-primary" 
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">{formData.name.length}/20</p>
              </div>

              <div>
                <label className="text-xs text-foreground">Team Name <span className="text-muted-foreground">(Optional)</span></label>
                <Input 
                  value={formData.teamCity} 
                  onChange={e => setFormData({ ...formData, teamCity: e.target.value })} 
                  placeholder="Team Name" 
                  className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-9 text-sm focus-visible:ring-0 focus-visible:border-primary" 
                />
              </div>

              <div>
                <label className="text-xs text-foreground">Cheque Amount <span className="text-muted-foreground">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-foreground text-sm">₹</span>
                  <Input 
                    value={formData.chequeAmount} 
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, chequeAmount: value });
                    }} 
                    placeholder="Enter amount" 
                    className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-9 text-sm focus-visible:ring-0 focus-visible:border-primary pl-4" 
                  />
                </div>
              </div>
            </div>
          </div>

          {mode === "myPhoto" && (
            <div className="w-32 flex-shrink-0">
              {photo ? (
                <div className="relative w-full h-full max-h-36 gold-border rounded-xl overflow-hidden bg-secondary">
                  <img src={photo} alt="Uploaded" className="w-full h-full object-cover" />
                </div>
              ) : (
                <label className="w-full h-full max-h-36 gold-border bg-secondary/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:gold-glow transition-all">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <ImagePlus className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Upload Photo</span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 flex gap-3 mt-3">
          <Button 
            onClick={handleReset} 
            variant="outline" 
            className="flex-1 h-11 border-2 border-primary text-foreground hover:bg-primary/10"
            disabled={bgRemoval.isProcessing}
          >
            RESET
          </Button>
          <Button 
            onClick={handleCreate} 
            className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            disabled={bgRemoval.isProcessing}
          >
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
        open={bgRemoval.showModal} 
        onKeep={handleKeepBackground} 
        onRemove={handleRemoveBackground} 
        onClose={bgRemoval.closeModal}
        isProcessing={bgRemoval.isProcessing}
        progress={bgRemoval.progress}
        progressText={bgRemoval.progressText}
      />
    </div>
  );
}
