import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UplineCarousel from "@/components/UplineCarousel";
import BackgroundRemoverModal from "@/components/BackgroundRemoverModal";
import { ranks } from "@/data/ranks";
import { adminPresetUplines } from "@/data/adminPresets";
import { toast } from "sonner";
import { removeBackground, loadImage } from "@/lib/backgroundRemover";
interface Upline {
  id: string;
  name: string;
  avatar?: string;
}
export default function RankBannerCreate() {
  const navigate = useNavigate();
  const {
    rankId
  } = useParams();
  const rank = ranks.find(r => r.id === rankId);
  const [mode, setMode] = useState<"myPhoto" | "others">("myPhoto");
  const [uplines, setUplines] = useState<Upline[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    teamCity: ""
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [showBgRemover, setShowBgRemover] = useState(false);
  const [processingBg, setProcessingBg] = useState(false);
  if (!rank) {
    return null;
  }
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result as string);
        setShowBgRemover(true);
      };
      reader.readAsDataURL(file);
    }
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
  const handleCreate = () => {
    if (!formData.name || !formData.teamCity) {
      toast.error("Please fill in Name and From Team/City");
      return;
    }
    if (mode === "myPhoto" && !photo) {
      toast.error("Please upload your photo");
      return;
    }

    // Navigate to banner preview with data
    navigate("/banner-preview", {
      state: {
        rankName: rank.name,
        rankIcon: rank.icon,
        rankGradient: rank.gradient,
        name: formData.name,
        teamCity: formData.teamCity,
        photo,
        uplines
      }
    });
  };
  const handleReset = () => {
    setFormData({
      name: "",
      teamCity: ""
    });
    setPhoto(null);
    setUplines([]);
  };
  return <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/rank-selection")} className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Rank Badge Display with Title */}
        <div className="flex items-start gap-4">
          <div className={`${rank.gradient} rounded-3xl p-6 flex items-center justify-center gold-border flex-shrink-0 w-32 h-32`}>
            <div className="text-5xl">{rank.icon}</div>
          </div>
          <div className="flex-1 pt-2">
            <p className="text-sm text-muted-foreground mb-1">Please fill up</p>
            <h1 className="text-3xl font-bold text-primary mb-1">{rank.name}</h1>
            <p className="text-lg text-blue-400">Achiever Details</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="space-y-2">
          <label className="text-sm text-foreground font-semibold">Banner Type</label>
          <div className="flex gap-3">
            <button onClick={() => setMode("myPhoto")} className={`flex-1 h-12 rounded-xl font-semibold transition-all ${mode === "myPhoto" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground border-2 border-primary"}`}>
              With My Photo
            </button>
            
          </div>
        </div>

        {/* Uplines Carousel */}
        <div className="space-y-3">
          
          <div className="gold-border bg-card/30 rounded-2xl p-4">
            <UplineCarousel uplines={uplines} onUplinesChange={setUplines} maxUplines={5} adminPresets={adminPresetUplines} />
          </div>
        </div>

        {/* Section Label */}
        

        {/* Form Fields with Photo Upload Side by Side */}
        <div className="flex gap-4">
          {/* Form Fields */}
          <div className="flex-1 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm text-foreground">Name</label>
              <Input value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="Enter your Name" className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-12 focus-visible:ring-0 focus-visible:border-primary" />
            </div>

            {/* From Team/City */}
            <div className="space-y-2">
              <label className="text-sm text-foreground">From Team/City</label>
              <Input value={formData.teamCity} onChange={e => setFormData({
              ...formData,
              teamCity: e.target.value
            })} placeholder="Enter Team/City" className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-12 focus-visible:ring-0 focus-visible:border-primary" />
            </div>
          </div>

          {/* Photo Upload */}
          {mode === "myPhoto" && <div className="w-48 flex-shrink-0">
              {photo ? <div className="relative w-full h-48 gold-border rounded-2xl overflow-hidden bg-secondary">
                  <img src={photo} alt="Uploaded" className="w-full h-full object-cover" />
                  {processingBg && <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-sm">Processing...</div>
                    </div>}
                </div> : <label className="w-full h-48 gold-border bg-secondary/50 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:gold-glow transition-all">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-primary" />
                  </div>
                </label>}
            </div>}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleReset} variant="outline" className="flex-1 h-12 border-2 border-primary text-foreground hover:bg-primary/10">
            RESET
          </Button>
          <Button onClick={handleCreate} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            CREATE
          </Button>
        </div>
      </div>

      {/* Background Remover Modal */}
      <BackgroundRemoverModal open={showBgRemover} onKeep={handleKeepBackground} onRemove={handleRemoveBackground} onClose={() => setShowBgRemover(false)} />
    </div>;
}