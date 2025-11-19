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
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { supabase } from "@/integrations/supabase/client";
export default function ProfileEdit() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    updateProfile
  } = useProfile(userId || undefined);
  const { photos: profilePhotos } = useProfilePhotos(userId || undefined);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to edit your profile");
        navigate("/login");
        return;
      }
      setUserId(user.id);
    };
    getUser();
  }, [navigate]);
  const [formData, setFormData] = useState({
    title: "mr",
    name: "",
    mobile: "",
    whatsapp: "",
    role: "royal-ambassador",
    language: "eng",
    gender: "male",
    married: false
  });
  const [customRole, setCustomRole] = useState("");

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      const predefinedRoles = ["bronze", "silver", "gold", "platinum", "emerald", "topaz", 
        "ruby-star", "sapphire", "star-sapphire", "diamond", "blue-diamond", "black-diamond",
        "royal-diamond", "crown-diamond", "ambassador", "royal-ambassador", 
        "crown-ambassador", "brand-ambassador"];
      
      const isCustomRole = profile.role && !predefinedRoles.includes(profile.role);
      
      setFormData({
        title: "mr",
        name: profile.name || "",
        mobile: profile.mobile || "",
        whatsapp: profile.whatsapp || "",
        role: isCustomRole ? "custom" : (profile.role || "royal-ambassador"),
        language: "eng",
        gender: "male",
        married: false
      });
      
      if (isCustomRole && profile.role) {
        setCustomRole(profile.role);
      }
    }
  }, [profile]);

  // Load profile photos - always sync with backend data
  useEffect(() => {
    if (profilePhotos && profilePhotos.length > 0) {
      setPhotos(profilePhotos.map(p => p.photo_url));
    } else if (profilePhotos && profilePhotos.length === 0) {
      // Clear photos if backend has none
      setPhotos([]);
    }
  }, [profilePhotos]);
  
  const handleSetPrimaryPhoto = async (index: number) => {
    if (!userId || !profilePhotos[index]) return;
    
    try {
      // First, unset all photos as primary
      await supabase
        .from('profile_photos')
        .update({ is_primary: false })
        .eq('user_id', userId);
      
      // Then set the selected photo as primary
      const { error } = await supabase
        .from('profile_photos')
        .update({ is_primary: true })
        .eq('id', profilePhotos[index].id);
      
      if (error) throw error;
      
      toast.success("Primary photo updated!");
    } catch (error) {
      console.error("Error setting primary photo:", error);
      toast.error("Failed to set primary photo");
    }
  };
  
  const handlePhotosChange = async (newPhotos: string[]) => {
    if (!userId) return;
    
    // Optimistically update UI
    setPhotos(newPhotos);
    
    try {
      // Delete all existing photos
      const { error: deleteError } = await supabase
        .from('profile_photos')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      
      // Upload new photos
      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i];
        
        // Convert base64 to blob
        const response = await fetch(photo);
        const blob = await response.blob();
        
        // Upload to storage
        const fileName = `${userId}_${Date.now()}_${i}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);
        
        // Insert into profile_photos table
        const { error: insertError } = await supabase
          .from('profile_photos')
          .insert({
            user_id: userId,
            photo_url: publicUrl,
            display_order: i,
            is_primary: i === 0
          });
        
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error saving photos:", error);
      toast.error("Failed to save photos. Please try again.");
    }
  };

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
    if (photos.length > 5) {
      toast.error("You can upload only 5 photos.");
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
    if (formData.role === "custom" && !customRole.trim()) {
      toast.error("Please enter a custom role name");
      return;
    }
    
    setLoading(true);
    try {
      const finalRole = formData.role === "custom" ? customRole.trim() : formData.role;
      
      const {
        error
      } = await updateProfile({
        name: formData.name.trim(),
        mobile: formData.mobile || null,
        whatsapp: formData.whatsapp || null,
        role: finalRole,
        rank: finalRole,
        profile_photo: photos[0]
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
  return <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors">
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
            <p className="text-xs text-muted-foreground">Update Profile</p>
          </div>
          <div className="px-4 py-1 bg-primary rounded-full">
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-semibold text-primary-foreground">RE BUSINESS</span>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="space-y-3">
          <PhotoUploadGrid 
            photos={photos} 
            onPhotosChange={handlePhotosChange} 
            maxPhotos={5}
            primaryPhotoIndex={profilePhotos.findIndex(p => p.is_primary)}
            onSetPrimary={handleSetPrimaryPhoto}
          />
          <p className="text-center text-sm text-primary">Profile Images (Max 5)</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Name with Title */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Name</label>
            <div className="flex gap-3">
              <Select value={formData.title} onValueChange={value => setFormData({
              ...formData,
              title: value
            })}>
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
              <Input value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} className="flex-1 gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none" />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Mobile Number</label>
            <Input type="tel" value={formData.mobile} onChange={e => setFormData({
            ...formData,
            mobile: e.target.value
          })} className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none" />
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">WhatsApp Number</label>
            <Input type="tel" value={formData.whatsapp} onChange={e => setFormData({
            ...formData,
            whatsapp: e.target.value
          })} className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none" />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Role</label>
            <Select value={formData.role} onValueChange={value => setFormData({
            ...formData,
            role: value
          })}>
              <SelectTrigger className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary">
                <SelectItem value="custom">Custom Name</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="emerald">Emerald</SelectItem>
                <SelectItem value="topaz">Topaz</SelectItem>
                <SelectItem value="ruby-star">Ruby Star</SelectItem>
                <SelectItem value="sapphire">Sapphire</SelectItem>
                <SelectItem value="star-sapphire">Star Sapphire</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
                <SelectItem value="blue-diamond">Blue Diamond</SelectItem>
                <SelectItem value="black-diamond">Black Diamond</SelectItem>
                <SelectItem value="royal-diamond">Royal Diamond</SelectItem>
                <SelectItem value="crown-diamond">Crown Diamond</SelectItem>
                <SelectItem value="ambassador">Ambassador</SelectItem>
                <SelectItem value="royal-ambassador">Royal Ambassador</SelectItem>
                <SelectItem value="crown-ambassador">Crown Ambassador</SelectItem>
                <SelectItem value="brand-ambassador">Brand Ambassador</SelectItem>
              </SelectContent>
            </Select>
            
            {formData.role === "custom" && (
              <Input 
                value={customRole} 
                onChange={e => setCustomRole(e.target.value)}
                placeholder="Enter custom role name"
                className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none mt-2"
              />
            )}
          </div>

          {/* Default Language */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Default Language</label>
              <Select value={formData.language} onValueChange={value => setFormData({
              ...formData,
              language: value
            })}>
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
                <button onClick={() => setFormData({
                ...formData,
                gender: "male"
              })} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${formData.gender === "male" ? "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-card" : "bg-secondary border-2 border-primary/30"}`}>
                  <span className="text-2xl">👨</span>
                </button>
                <button onClick={() => setFormData({
                ...formData,
                gender: "female"
              })} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${formData.gender === "female" ? "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-card" : "bg-secondary border-2 border-primary/30"}`}>
                  <span className="text-2xl">👩</span>
                </button>
              </div>
            </div>
          </div>

          {/* Married */}
          <div className="gold-border bg-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Are you married</label>
              <Switch checked={formData.married} onCheckedChange={checked => setFormData({
              ...formData,
              married: checked
            })} className="data-[state=checked]:bg-primary" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={loading || !userId} className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Saving..." : "SAVE"}
        </Button>
      </div>
    </div>;
}