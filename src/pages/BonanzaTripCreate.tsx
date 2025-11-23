import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const TRIP_OPTIONS = [
  { id: "jaisalmer", name: "Jaisalmer" },
  { id: "vietnam", name: "Vietnam" },
  { id: "dubai", name: "Dubai" },
  { id: "thailand", name: "Thailand" },
  { id: "singapore", name: "Singapore" },
];

export default function BonanzaTripCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"myPhoto" | "others">("myPhoto");
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId || undefined);
  const { settings: bannerSettings } = useBannerSettings(userId || undefined);
  
  const [uplines, setUplines] = useState<Upline[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    teamCity: "",
    tripName: ""
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showBgRemover, setShowBgRemover] = useState(false);
  const [processingBg, setProcessingBg] = useState(false);

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

  // Auto-fill name from profile
  useEffect(() => {
    if (profile?.name && !formData.name) {
      setFormData(prev => ({ ...prev, name: profile.name }));
    }
  }, [profile?.name]);

  // Load default uplines from banner settings
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
    
    setProcessingBg(true);
    try {
      // Convert data URL to blob
      const response = await fetch(photo);
      const blob = await response.blob();
      const imgElement = await loadImage(blob);
      const resultBlob = await removeBackground(imgElement) as Blob;
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result as string);
        setShowBgRemover(false);
      };
      reader.readAsDataURL(resultBlob);
    } catch (error) {
      console.error("Background removal error:", error);
      toast.error("Failed to remove background");
      setShowBgRemover(false);
    } finally {
      setProcessingBg(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (!formData.tripName) {
      toast.error("Please select a trip destination");
      return;
    }

    if (mode === "myPhoto" && !photo) {
      toast.error("Please upload your photo");
      return;
    }

    // Fetch trip category template
    const { data: templates } = await supabase
      .from("templates")
      .select("*, ranks(*)")
      .eq("category_id", "bonanza-trips")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!templates) {
      toast.error("Trip template not found");
      return;
    }

    navigate("/banner-preview", {
      state: {
        formData,
        photo,
        uplines,
        template: templates,
        category: "bonanza-trips",
        tripName: formData.tripName
      }
    });
  };

  const handleReset = () => {
    setFormData({ name: profile?.name || "", teamCity: "", tripName: "" });
    setPhoto(null);
    setTempPhoto(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Bonanza Promotion</h1>
            <p className="text-xs text-muted-foreground">Create Your Trip Achievement Banner</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setMode("myPhoto")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === "myPhoto"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            With My Photo
          </button>
          <button
            onClick={() => setMode("others")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === "others"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            With Others
          </button>
        </div>

        {/* Uplines Carousel */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Uplines</Label>
          <UplineCarousel uplines={uplines} onUplinesChange={setUplines} />
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-foreground">Name</Label>
            <Input
              id="name"
              placeholder="Enter Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="teamCity" className="text-foreground">Team / City</Label>
            <Input
              id="teamCity"
              placeholder="Enter Team or City"
              value={formData.teamCity}
              onChange={(e) => setFormData({ ...formData, teamCity: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="tripName" className="text-foreground">Trip Destination</Label>
            <Select
              value={formData.tripName}
              onValueChange={(value) => setFormData({ ...formData, tripName: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select Trip Destination" />
              </SelectTrigger>
              <SelectContent>
                {TRIP_OPTIONS.map((trip) => (
                  <SelectItem key={trip.id} value={trip.name}>
                    {trip.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Photo Upload - Only show in "My Photo" mode */}
          {mode === "myPhoto" && (
            <div>
              <Label className="text-foreground">Upload Photo</Label>
              <div className="mt-1.5">
                {!photo ? (
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <ImagePlus className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Tap to upload photo</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={photo}
                      alt="Uploaded"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => setPhoto(null)}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReset}
          >
            RESET
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={handleCreate}
          >
            CREATE
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showCropper && tempPhoto && (
        <ImageCropper
          image={tempPhoto}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {showBgRemover && photo && (
        <BackgroundRemoverModal
          open={showBgRemover}
          onClose={() => setShowBgRemover(false)}
          onKeep={handleKeepBackground}
          onRemove={handleRemoveBackground}
        />
      )}
    </div>
  );
}
