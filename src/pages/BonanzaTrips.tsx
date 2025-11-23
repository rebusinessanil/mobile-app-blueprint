import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UplineCarousel from "@/components/UplineCarousel";
import ImageCropper from "@/components/ImageCropper";
import BackgroundRemoverModal from "@/components/BackgroundRemoverModal";
import { removeBackground } from "@/lib/backgroundRemover";
import { useBannerSettings } from "@/hooks/useBannerSettings";

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

interface TripCard {
  id: string;
  name: string;
  image: string;
}

const TRIP_CARDS: TripCard[] = [
  { id: "1", name: "Jaisalmer", image: "/placeholder.svg" },
  { id: "2", name: "Vietnam", image: "/placeholder.svg" },
  { id: "3", name: "Dubai", image: "/placeholder.svg" },
  { id: "4", name: "Thailand", image: "/placeholder.svg" },
  { id: "5", name: "Singapore", image: "/placeholder.svg" },
];

export default function BonanzaTrips() {
  const navigate = useNavigate();
  const { settings: bannerSettings } = useBannerSettings();
  
  const [mode, setMode] = useState<"my-photo" | "others">("my-photo");
  const [userId, setUserId] = useState<string | null>(null);
  const [uplines, setUplines] = useState<Upline[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    teamCity: "",
    caption: "",
  });
  const [photo, setPhoto] = useState<string>("");
  const [tempPhoto, setTempPhoto] = useState<string>("");
  const [showCropper, setShowCropper] = useState(false);
  const [showBgRemover, setShowBgRemover] = useState(false);

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Load default uplines from banner settings
        if (bannerSettings?.upline_avatars) {
          const uplineData = bannerSettings.upline_avatars as any[];
          setUplines(uplineData.map((u: any) => ({
            id: u.id || Date.now().toString(),
            name: u.name || "",
            avatar: u.avatar || ""
          })));
        }
      }
    };
    initUser();
  }, [bannerSettings]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhoto(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setPhoto(croppedImage);
    setShowCropper(false);
    setShowBgRemover(true);
  };

  const handleRemoveBackground = async (keep: boolean) => {
    setShowBgRemover(false);
    if (!keep && photo) {
      try {
        const loadImage = (src: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });
        };

        const img = await loadImage(photo);
        const removedBgBlob = await removeBackground(img);
        
        // Convert blob to data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhoto(reader.result as string);
        };
        reader.readAsDataURL(removedBgBlob);
      } catch (error) {
        console.error("Background removal error:", error);
        toast.error("Failed to remove background");
      }
    }
  };

  const handleTripSelect = (tripName: string) => {
    setSelectedTrip(tripName);
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.teamCity.trim()) {
      toast.error("Please enter team/city");
      return;
    }
    if (!selectedTrip) {
      toast.error("Please select a trip");
      return;
    }
    if (mode === "my-photo" && !photo) {
      toast.error("Please upload your photo");
      return;
    }

    // Navigate to banner preview with trip data
    navigate("/banner-preview", {
      state: {
        category: "bonanza-trips",
        tripName: selectedTrip,
        name: formData.name,
        teamCity: formData.teamCity,
        caption: formData.caption,
        photo: mode === "my-photo" ? photo : "",
        uplines: uplines,
        mode: mode,
      },
    });
  };

  const handleReset = () => {
    setFormData({ name: "", teamCity: "", caption: "" });
    setPhoto("");
    setSelectedTrip("");
    setUplines([]);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Bonanza Promotion</h1>
            <p className="text-sm text-muted-foreground">Create Your Trip Achievement Banner</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Trip Cards - Horizontal Scroll */}
        <div>
          <h2 className="text-sm font-medium text-foreground mb-3">Select Trip</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {TRIP_CARDS.map((trip) => (
              <button
                key={trip.id}
                onClick={() => handleTripSelect(trip.name)}
                className={`flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedTrip === trip.name
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                }`}
              >
                <div className="w-32 h-32 bg-card">
                  <img
                    src={trip.image}
                    alt={trip.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2 bg-card text-center">
                  <p className="text-xs font-medium text-foreground">{trip.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            onClick={() => setMode("my-photo")}
            className={`flex-1 rounded-full ${
              mode === "my-photo"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border"
            }`}
          >
            With My Photo
          </Button>
          <Button
            onClick={() => setMode("others")}
            className={`flex-1 rounded-full ${
              mode === "others"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border"
            }`}
          >
            With Others
          </Button>
        </div>

        {/* Top Uplines */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-foreground px-3 py-1 bg-card rounded-full border border-border">
              Top Uplines
            </span>
          </div>
          <UplineCarousel
            uplines={uplines}
            onUplinesChange={setUplines}
            maxUplines={5}
          />
        </div>

        {/* Trip Name Display */}
        {selectedTrip && (
          <div className="p-3 bg-card rounded-xl border border-border">
            <p className="text-xs text-muted-foreground mb-1">Selected Trip</p>
            <p className="text-sm font-semibold text-primary">{selectedTrip}</p>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
            <Input
              placeholder="Enter your Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-card border-border"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">From Team/City</label>
            <Input
              placeholder="Enter Team/City"
              value={formData.teamCity}
              onChange={(e) => setFormData({ ...formData, teamCity: e.target.value })}
              className="bg-card border-border"
            />
          </div>

          {mode === "my-photo" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Upload Photo</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="trip-photo-upload"
                />
                <label
                  htmlFor="trip-photo-upload"
                  className="flex items-center justify-center w-full h-32 bg-card border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors"
                >
                  {photo ? (
                    <img src={photo} alt="Uploaded" className="h-full w-full object-cover rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="h-8 w-8 text-primary" />
                      <span className="text-xs text-muted-foreground">Tap to upload</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1 rounded-full"
          >
            RESET
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 rounded-full bg-primary text-primary-foreground"
          >
            CREATE
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showCropper && (
        <div className="fixed inset-0 z-50 bg-background/95 p-4 flex flex-col justify-center">
          <ImageCropper
            image={tempPhoto}
            onCropComplete={handleCropComplete}
            onCancel={() => setShowCropper(false)}
          />
        </div>
      )}

      <BackgroundRemoverModal
        open={showBgRemover}
        onKeep={() => handleRemoveBackground(true)}
        onRemove={() => handleRemoveBackground(false)}
        onClose={() => setShowBgRemover(false)}
      />
    </div>
  );
}
