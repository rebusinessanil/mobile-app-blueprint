import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import UplineCarousel from "@/components/UplineCarousel";
import { ranks } from "@/data/ranks";
import { toast } from "sonner";

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
  const [uplines, setUplines] = useState<Upline[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    teamCity: "",
    amount: "",
    message: "",
  });
  const [photo, setPhoto] = useState<string | null>(null);

  if (!rank) {
    return null;
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = () => {
    if (!formData.name || !formData.teamCity) {
      toast.error("Please fill in Name and Team/City");
      return;
    }

    if (mode === "myPhoto" && !photo) {
      toast.error("Please upload your photo");
      return;
    }

    // TODO: Implement banner creation logic
    toast.success("Banner created successfully!");
    navigate("/downloads");
  };

  const handleReset = () => {
    setFormData({ name: "", teamCity: "", amount: "", message: "" });
    setPhoto(null);
    setUplines([]);
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/rank-selection")}
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-primary">{rank.name} Promotion</h1>
            <p className="text-sm text-foreground">Please fill up Achiever Details</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Rank Badge Display */}
        <div className={`${rank.gradient} rounded-3xl p-6 text-center gold-border`}>
          <div className="text-6xl mb-3">{rank.icon}</div>
          <h2 className="text-2xl font-bold text-white">{rank.name}</h2>
        </div>

        {/* Mode Toggle */}
        <div className="space-y-2">
          <label className="text-sm text-foreground font-semibold">Banner Type</label>
          <div className="flex gap-3">
            <button
              onClick={() => setMode("myPhoto")}
              className={`flex-1 h-12 rounded-xl font-semibold transition-all ${
                mode === "myPhoto"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground border-2 border-primary"
              }`}
            >
              With My Photo
            </button>
            <button
              onClick={() => setMode("others")}
              className={`flex-1 h-12 rounded-xl font-semibold transition-all ${
                mode === "others"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground border-2 border-primary"
              }`}
            >
              With Others
            </button>
          </div>
        </div>

        {/* Uplines Carousel */}
        <div className="space-y-2">
          <label className="text-sm text-foreground font-semibold">Uplines</label>
          <div className="gold-border bg-card rounded-2xl p-4">
            <UplineCarousel uplines={uplines} onUplinesChange={setUplines} />
          </div>
        </div>

        {/* Section Label */}
        <div className="inline-block px-4 py-2 bg-primary/20 border border-primary rounded-full">
          <span className="text-sm font-semibold text-primary">{rank.name} Achiever Details</span>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter achiever name"
              className="gold-border bg-secondary text-foreground h-12"
            />
          </div>

          {/* Team/City */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Team / City *</label>
            <Input
              value={formData.teamCity}
              onChange={(e) => setFormData({ ...formData, teamCity: e.target.value })}
              placeholder="Enter team name or city"
              className="gold-border bg-secondary text-foreground h-12"
            />
          </div>

          {/* Cheque Amount */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Cheque Amount (Optional)</label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
              className="gold-border bg-secondary text-foreground h-12"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Message (Optional)</label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter congratulatory message"
              className="gold-border bg-secondary text-foreground min-h-24"
            />
          </div>

          {/* Photo Upload */}
          {mode === "myPhoto" && (
            <div className="space-y-2">
              <label className="text-sm text-foreground">Upload Photo *</label>
              {photo ? (
                <div className="relative gold-border rounded-2xl overflow-hidden">
                  <img src={photo} alt="Uploaded" className="w-full h-64 object-cover" />
                  <button
                    onClick={() => setPhoto(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-destructive rounded-full flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 text-white rotate-180" />
                  </button>
                </div>
              ) : (
                <label className="gold-border bg-secondary rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:gold-glow transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Upload Your Photo</p>
                    <p className="text-xs text-muted-foreground">Tap to select image</p>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1 h-12 border-2 border-primary text-foreground hover:bg-primary/10"
          >
            RESET
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          >
            CREATE
          </Button>
        </div>
      </div>
    </div>
  );
}