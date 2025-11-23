import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function TripBannerCreate() {
  const navigate = useNavigate();
  const { tripId } = useParams(); // This is now the template ID from backend
  const [mode, setMode] = useState<"myPhoto" | "others">("myPhoto");
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId || undefined);
  const { settings: bannerSettings } = useBannerSettings(userId || undefined);
  const [tripTemplate, setTripTemplate] = useState<any>(null);
  
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
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [selectedTripFilter, setSelectedTripFilter] = useState(tripId || "");

  // Get authenticated user and fetch trip template
  useEffect(() => {
    const initializeData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }

      // Fetch the specific trip template by ID
      if (tripId) {
        const { data: template } = await supabase
          .from('templates')
          .select('*, template_categories(*)')
          .eq('id', tripId)
          .single();
        
        if (template) {
          setTripTemplate(template);
          setFormData(prev => ({ ...prev, tripName: template.name }));
          setSelectedTripFilter(tripId);
        }
      }

      // Fetch all trip templates for filter
      const { data: category } = await supabase
        .from('template_categories')
        .select('id')
        .eq('slug', 'bonanza-trips')
        .single();
      
      if (category) {
        const { data: trips } = await supabase
          .from('templates')
          .select('*')
          .eq('category_id', category.id)
          .eq('is_active', true)
          .order('display_order');
        
        if (trips) {
          setAllTrips(trips);
        }
      }
    };

    initializeData();
  }, [tripId]);

  // Auto-fill name from profile
  useEffect(() => {
    if (profile?.name && !formData.name) {
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

  // Update trip name when filter changes
  useEffect(() => {
    const selectedTrip = allTrips.find(t => t.id === selectedTripFilter);
    if (selectedTrip) {
      setFormData(prev => ({ ...prev, tripName: selectedTrip.name }));
    }
  }, [selectedTripFilter, allTrips]);

  if (!tripTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trip details...</p>
        </div>
      </div>
    );
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
      const response = await fetch(photo);
      const blob = await response.blob();
      const img = await loadImage(blob);
      const resultBlob = await removeBackground(img);
      const resultUrl = URL.createObjectURL(resultBlob);
      setPhoto(resultUrl);
      setShowBgRemover(false);
      toast.success("Background removed successfully");
    } catch (error) {
      console.error("Background removal failed:", error);
      toast.error("Failed to remove background. Keeping original image.");
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
    
    if (!formData.teamCity.trim()) {
      toast.error("Please enter your team/city");
      return;
    }

    if (mode === "myPhoto" && !photo) {
      toast.error("Please upload your photo");
      return;
    }

    navigate("/banner-preview", {
      state: {
        category: "bonanza-trips",
        tripId: tripTemplate.id,
        tripName: formData.tripName,
        name: formData.name,
        teamCity: formData.teamCity,
        photo,
        uplines,
        template: tripTemplate,
        mode
      }
    });
  };

  const handleReset = () => {
    setFormData({ name: profile?.name || "", teamCity: "", tripName: tripTemplate?.name || "" });
    setPhoto(null);
    setUplines(bannerSettings?.upline_avatars.map((upline, index) => ({
      id: `upline-${index}`,
      name: upline.name,
      avatar: upline.avatar_url
    })) || []);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
              Bonanza Achievement
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formData.tripName.toUpperCase()}
            </p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
          <p className="text-sm text-primary text-center font-medium">
            Please fill up Achiever Details
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-3 p-1.5 bg-muted/50 rounded-2xl border border-border">
          <button
            onClick={() => setMode("myPhoto")}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              mode === "myPhoto"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            With My Photo
          </button>
          <button
            onClick={() => setMode("others")}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              mode === "others"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            With Others
          </button>
        </div>

        {/* Uplines Section */}
        <UplineCarousel uplines={uplines} onUplinesChange={setUplines} />

        {/* Trip Name Display */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl">
              🏖️
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Trip Destination</p>
              <p className="text-lg font-bold text-foreground">{formData.tripName}</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your Name"
              className="h-12 bg-background border-border"
            />
          </div>

          {/* Team/City Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">From Team/City</label>
            <Input
              value={formData.teamCity}
              onChange={(e) => setFormData({ ...formData, teamCity: e.target.value })}
              placeholder="Enter Team/City"
              className="h-12 bg-background border-border"
            />
          </div>

          {/* Photo Upload - Only for "With My Photo" mode */}
          {mode === "myPhoto" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Upload Photo</label>
              <div className="relative">
                {!photo ? (
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-background">
                    <ImagePlus className="w-12 h-12 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative h-48 rounded-xl overflow-hidden border-2 border-primary">
                    <img src={photo} alt="Uploaded" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhoto(null)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filter Section */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Filter</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
              {allTrips.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTripFilter(t.id)}
                  className={`px-6 py-2.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                    selectedTripFilter === t.id
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <Button 
              variant="default" 
              className="rounded-full px-6 bg-primary hover:bg-primary/90"
              onClick={() => navigate('/trip-selection')}
            >
              View All
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1 h-14 text-base font-semibold rounded-xl border-2"
          >
            RESET
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90"
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
          onClose={() => setShowBgRemover(false)}
        />
      )}
    </div>
  );
}
