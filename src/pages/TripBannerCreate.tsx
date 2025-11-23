import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UplineCarousel from "@/components/UplineCarousel";
import BackgroundRemoverModal from "@/components/BackgroundRemoverModal";
import ImageCropper from "@/components/ImageCropper";
import { trips } from "@/data/trips";
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

export default function TripBannerCreate() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const trip = trips.find(t => t.id === tripId);
  const [mode, setMode] = useState<"myPhoto" | "others">("myPhoto");
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId || undefined);
  const { settings: bannerSettings } = useBannerSettings(userId || undefined);
  
  const [uplines, setUplines] = useState<Upline[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    teamCity: "",
    tripName: trip?.name || ""
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showBgRemover, setShowBgRemover] = useState(false);
  const [processingBg, setProcessingBg] = useState(false);

  // Get authenticated user and load profile data
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
    if (profile && !formData.name) {
      setFormData(prev => ({ ...prev, name: profile.name }));
    }
  }, [profile]);

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

  if (!trip) {
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
      // Convert base64 data URL to Blob
      const response = await fetch(photo);
      const blob = await response.blob();
      const imageElement = await loadImage(blob);
      const resultBlob = await removeBackground(imageElement);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        toast.success("Background removed successfully");
      };
      reader.readAsDataURL(resultBlob);
    } catch (error) {
      console.error("Background removal error:", error);
      toast.error("Failed to remove background");
    } finally {
      setProcessingBg(false);
      setShowBgRemover(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.teamCity.trim()) {
      toast.error("Please enter team/city");
      return;
    }
    if (mode === "myPhoto" && !photo) {
      toast.error("Please upload your photo");
      return;
    }

    // Fetch trip template data
    const { data: categoryData } = await supabase
      .from('template_categories')
      .select('id')
      .eq('slug', 'bonanza-trips')
      .single();

    if (!categoryData) {
      toast.error("Bonanza Trips category not found");
      return;
    }

    const { data: templateData } = await supabase
      .from('templates')
      .select('id, name')
      .eq('category_id', categoryData.id)
      .eq('name', trip.name)
      .maybeSingle();

    if (!templateData) {
      toast.error(`Template for ${trip.name} not found`);
      return;
    }

    navigate("/banner-preview", {
      state: {
        formData: {
          name: formData.name,
          teamCity: formData.teamCity,
          tripName: formData.tripName
        },
        photo,
        uplines,
        trip: {
          id: trip.id,
          name: trip.name,
          color: trip.color,
          gradient: trip.gradient,
          icon: trip.icon,
          destination: trip.destination
        },
        templateId: templateData.id,
        categoryId: categoryData.id,
        mode
      }
    });
  };

  const handleReset = () => {
    setFormData({
      name: profile?.name || "",
      teamCity: "",
      tripName: trip?.name || ""
    });
    setPhoto(null);
    setUplines(
      bannerSettings?.upline_avatars.map((upline, index) => ({
        id: `upline-${index}`,
        name: upline.name,
        avatar: upline.avatar_url
      })) || []
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {trip.name} Trip Banner
            </h1>
            <p className="text-sm text-muted-foreground">{trip.destination}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Trip Badge */}
        <div className={`${trip.gradient} text-white p-6 rounded-2xl flex items-center gap-4`}>
          <span className="text-5xl">{trip.icon}</span>
          <div>
            <h2 className="text-2xl font-bold">{trip.name}</h2>
            <p className="text-white/90">{trip.destination}</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-full">
          <button
            onClick={() => setMode("myPhoto")}
            className={`flex-1 py-2.5 px-4 rounded-full font-medium transition-all ${
              mode === "myPhoto"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            With My Photo
          </button>
          <button
            onClick={() => setMode("others")}
            className={`flex-1 py-2.5 px-4 rounded-full font-medium transition-all ${
              mode === "others"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            With Others
          </button>
        </div>

        {/* Upline Carousel */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Uplines</Label>
          <UplineCarousel uplines={uplines} onUplinesChange={setUplines} />
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Achiever Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter Name"
              className="bg-card border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamCity" className="text-sm font-medium text-foreground">
              Team / City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="teamCity"
              value={formData.teamCity}
              onChange={(e) => setFormData({ ...formData, teamCity: e.target.value })}
              placeholder="Enter Team/City"
              className="bg-card border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tripName" className="text-sm font-medium text-foreground">
              Trip Name
            </Label>
            <Input
              id="tripName"
              value={formData.tripName}
              onChange={(e) => setFormData({ ...formData, tripName: e.target.value })}
              placeholder="Trip Name"
              className="bg-card border-border"
              readOnly
            />
          </div>

          {/* Photo Upload */}
          {mode === "myPhoto" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Upload Photo <span className="text-destructive">*</span>
              </Label>
              <div
                onClick={() => document.getElementById("photo-upload")?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors bg-card"
              >
                {photo ? (
                  <div className="space-y-2">
                    <img
                      src={photo}
                      alt="Uploaded"
                      className="max-h-40 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">Click to change photo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload your photo
                    </p>
                  </div>
                )}
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            RESET
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 bg-primary hover:bg-primary/90"
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
          onKeep={handleKeepBackground}
          onRemove={handleRemoveBackground}
          onClose={handleKeepBackground}
        />
      )}
    </div>
  );
}
