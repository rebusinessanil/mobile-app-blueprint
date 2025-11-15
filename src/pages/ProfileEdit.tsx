import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PhotoUploadGrid from "@/components/PhotoUploadGrid";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { profile, loading: profileLoading, error: profileError, updateProfile } = useProfile(userId || undefined);
  
  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to edit your profile");
        navigate("/login");
        return;
      }
      console.log("Authenticated user ID:", user.id);
      setUserId(user.id);
    };
    getUser();
  }, [navigate]);

  // Check if profile exists after loading
  useEffect(() => {
    if (userId && !profileLoading && !profile && !profileError) {
      console.error("Profile does not exist for user:", userId);
      toast.error("Profile not found. Please complete your profile setup.");
      navigate("/profile-setup");
    }
  }, [userId, profile, profileLoading, profileError, navigate]);
  
  const [formData, setFormData] = useState({
    title: "mr",
    name: "",
    mobile: "",
    whatsapp: "",
    role: "royal-ambassador",
    language: "eng",
    gender: "male",
    married: false,
  });

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setFormData({
        title: "mr",
        name: profile.name || "",
        mobile: profile.mobile || "",
        whatsapp: profile.whatsapp || "",
        role: profile.role || "royal-ambassador",
        language: "eng",
        gender: "male",
        married: false,
      });
      if (profile.profile_photo) {
        setPhotos([profile.profile_photo]);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (formData.name.length > 100) {
      toast.error("Name must be less than 100 characters");
      return;
    }

    if (photos.length === 0) {
      toast.error("Please upload at least 1 profile photo");
      return;
    }

    if (formData.mobile && !/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (formData.whatsapp && !/^\d{10}$/.test(formData.whatsapp.replace(/\D/g, ''))) {
      toast.error("Please enter a valid 10-digit WhatsApp number");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await updateProfile({
        name: formData.name.trim(),
        mobile: formData.mobile || null,
        whatsapp: formData.whatsapp || null,
        role: formData.role,
        rank: formData.role,
        profile_photo: photos[0],
      });

      if (error) {
        console.error("Profile update error:", error);
        toast.error(error.message || "Failed to update profile. Please try again.");
        return;
      }

      toast.success("Profile updated successfully! Your banners will auto-update.");
      navigate("/profile");
    } catch (err) {
      console.error("Unexpected error during profile update:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-primary">Profile</h1>
            <p className="text-sm text-foreground">Here is your profile details.</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Profile ID Banner */}
        <div className="flex items-center gap-3 px-4 py-3 bg-card/50 rounded-xl border border-primary/30">
          <div className="w-10 h-10 bg-destructive rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">#Dilip Singh Rathore</p>
          </div>
          <div className="px-4 py-1 bg-primary rounded-full">
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-semibold text-primary-foreground">Royal Ambassador</span>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="space-y-3">
          <PhotoUploadGrid photos={photos} onPhotosChange={setPhotos} maxPhotos={10} />
          <p className="text-center text-sm text-primary">Profile Images</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Name with Title */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Name</label>
            <div className="flex gap-3">
              <Select value={formData.title} onValueChange={(value) => setFormData({ ...formData, title: value })}>
                <SelectTrigger className="w-24 gold-border bg-secondary text-foreground h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary">
                  <SelectItem value="mr">Mr.</SelectItem>
                  <SelectItem value="mrs">Mrs.</SelectItem>
                  <SelectItem value="ms">Ms.</SelectItem>
                  <SelectItem value="dr">Dr.</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="flex-1 gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Mobile Number</label>
            <Input
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none"
            />
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">WhatsApp Number</label>
            <Input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Role</label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary">
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
                <SelectItem value="ambassador">Ambassador</SelectItem>
                <SelectItem value="royal-ambassador">Royal Ambassador</SelectItem>
                <SelectItem value="crown-ambassador">Crown Ambassador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Language */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Default Language</label>
              <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                <SelectTrigger className="w-32 gold-border bg-secondary text-foreground h-10 border-b-2 border-t-0 border-x-0 rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary">
                  <SelectItem value="eng">Eng</SelectItem>
                  <SelectItem value="hin">Hindi</SelectItem>
                  <SelectItem value="mar">Marathi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gender */}
          <div className="gold-border bg-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Gender</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormData({ ...formData, gender: "male" })}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    formData.gender === "male"
                      ? "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-card"
                      : "bg-secondary border-2 border-primary/30"
                  }`}
                >
                  <span className="text-2xl">👨</span>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, gender: "female" })}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    formData.gender === "female"
                      ? "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-card"
                      : "bg-secondary border-2 border-primary/30"
                  }`}
                >
                  <span className="text-2xl">👩</span>
                </button>
              </div>
            </div>
          </div>

          {/* Married */}
          <div className="gold-border bg-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Are you married</label>
              <Switch
                checked={formData.married}
                onCheckedChange={(checked) => setFormData({ ...formData, married: checked })}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={loading || !userId}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "SAVE"}
        </Button>
      </div>
    </div>
  );
}