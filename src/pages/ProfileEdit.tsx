import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Award, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PhotoUploadGrid from "@/components/PhotoUploadGrid";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { supabase } from "@/integrations/supabase/client";
import ProfileCompletionBonusModal from "@/components/ProfileCompletionBonusModal";
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
  const {
    photos: profilePhotos
  } = useProfilePhotos(userId || undefined);

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
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [pendingBonusCredit, setPendingBonusCredit] = useState(false);
  
  // PIN state
  const [createPin, setCreatePin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      const predefinedRoles = ["bronze", "silver", "gold", "platinum", "emerald", "topaz", "ruby-star", "sapphire", "star-sapphire", "diamond", "blue-diamond", "black-diamond", "royal-diamond", "crown-diamond", "ambassador", "royal-ambassador", "crown-ambassador", "brand-ambassador"];
      const isCustomRole = profile.role && !predefinedRoles.includes(profile.role);
      setFormData({
        title: "mr",
        name: profile.name || "",
        mobile: profile.mobile || "",
        whatsapp: profile.whatsapp || "",
        role: isCustomRole ? "custom" : profile.role || "royal-ambassador",
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
      await supabase.from('profile_photos').update({
        is_primary: false
      }).eq('user_id', userId);

      // Then set the selected photo as primary
      const {
        error
      } = await supabase.from('profile_photos').update({
        is_primary: true
      }).eq('id', profilePhotos[index].id);
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
      const {
        error: deleteError
      } = await supabase.from('profile_photos').delete().eq('user_id', userId);
      if (deleteError) throw deleteError;

      // Upload new photos
      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i];

        // Convert base64 to blob
        const response = await fetch(photo);
        const blob = await response.blob();

        // Upload to storage with user folder structure
        const fileName = `${userId}/${Date.now()}_${i}.png`;
        const {
          data: uploadData,
          error: uploadError
        } = await supabase.storage.from('profile-photos').upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });
        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('profile-photos').getPublicUrl(fileName);

        // Insert into profile_photos table
        const {
          error: insertError
        } = await supabase.from('profile_photos').insert({
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

  // Check if profile is complete for bonus
  const isProfileComplete = () => {
    const hasName = formData.name.trim() !== '' && formData.name !== 'User';
    const hasMobile = formData.mobile && /^\d{10}$/.test(formData.mobile.replace(/\D/g, ''));
    const hasWhatsapp = formData.whatsapp && /^\d{10}$/.test(formData.whatsapp.replace(/\D/g, ''));
    const hasRole = formData.role && formData.role.trim() !== '';
    const hasPhotos = photos.length > 0;
    return hasName && hasMobile && hasWhatsapp && hasRole && hasPhotos;
  };

  // Check if profile completion bonus should be shown
  const checkAndShowBonusModal = async () => {
    if (!userId) return false;
    try {
      const {
        data: profileData
      } = await supabase.from('profiles').select('profile_completion_bonus_given').eq('user_id', userId).single();
      if (profileData?.profile_completion_bonus_given) {
        return false; // Bonus already given
      }

      // Show bonus modal
      setShowBonusModal(true);
      setPendingBonusCredit(true);
      return true;
    } catch (error) {
      console.error('Error checking bonus status:', error);
      return false;
    }
  };

  // Credit profile completion bonus after user confirms
  const creditProfileCompletionBonus = async () => {
    if (!userId) return;
    try {
      // Get current credits
      const {
        data: currentCredits
      } = await supabase.from('user_credits').select('balance, total_earned').eq('user_id', userId).single();
      if (currentCredits) {
        // Credit 199 to wallet
        await supabase.from('user_credits').update({
          balance: currentCredits.balance + 199,
          total_earned: currentCredits.total_earned + 199,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);
      }

      // Create transaction record
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: 199,
        transaction_type: 'admin_credit',
        description: 'Profile Completion Bonus - 199 Credits FREE!'
      });

      // Mark bonus as given
      await supabase.from('profiles').update({
        profile_completion_bonus_given: true
      }).eq('user_id', userId);
    } catch (error) {
      console.error('Error crediting profile completion bonus:', error);
    }
  };

  // Handle bonus modal confirmation
  const handleBonusConfirm = async () => {
    await creditProfileCompletionBonus();
    setShowBonusModal(false);
    setPendingBonusCredit(false);
    toast.success("199 Credits added to your wallet!");
    navigate("/dashboard");
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
    if (!formData.mobile || !/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!formData.whatsapp || !/^\d{10}$/.test(formData.whatsapp.replace(/\D/g, ''))) {
      toast.error("Please enter a valid 10-digit WhatsApp number");
      return;
    }
    if (formData.role === "custom" && !customRole.trim()) {
      toast.error("Please enter a custom role name");
      return;
    }
    
    // PIN validation (optional field, but if filled, must be complete and match)
    if (createPin.length > 0) {
      if (createPin.length !== 4) {
        toast.error("PIN must be 4 digits");
        return;
      }
      if (confirmPin !== createPin) {
        toast.error("PIN does not match");
        setPinError("PIN does not match");
        return;
      }
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
      
      // Save PIN if provided (hash it before saving)
      if (createPin.length === 4 && confirmPin === createPin && userId) {
        // Use simple hash for PIN (in production, use bcrypt on server-side)
        const pinHash = btoa(createPin); // Base64 encoding as simple obfuscation
        await supabase.auth.updateUser({
          data: { pin_hash: pinHash }
        });
        // Clear PIN fields after successful save
        setCreatePin("");
        setConfirmPin("");
        toast.success("PIN updated successfully!");
      }

      // Check if profile is now complete and show bonus modal if first time
      if (isProfileComplete()) {
        const showedModal = await checkAndShowBonusModal();
        if (showedModal) {
          toast.success("Profile updated successfully!");
          return; // Don't navigate yet, wait for modal confirmation
        }
      }
      toast.success("Profile updated successfully! Your banners will auto-update.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Unexpected error during profile update:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return <>
    <ProfileCompletionBonusModal open={showBonusModal} onConfirm={handleBonusConfirm} />
    <div className="min-h-screen bg-navy-dark pb-6">
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
          <PhotoUploadGrid photos={photos} onPhotosChange={handlePhotosChange} maxPhotos={5} primaryPhotoIndex={profilePhotos.findIndex(p => p.is_primary)} onSetPrimary={handleSetPrimaryPhoto} />
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
            })} className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none" placeholder="10 Digit Mobile Number" />
          </div>

          {/* WhatsApp Number */}
          

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
            
            {formData.role === "custom" && <Input value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="Enter custom role name" className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none mt-2" />}
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

          {/* Create PIN Section */}
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm text-foreground">Create PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={createPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCreatePin(value);
                  // Clear confirm PIN when create PIN changes
                  if (confirmPin) setConfirmPin("");
                  // Clear error when typing
                  if (pinError) setPinError("");
                }}
                placeholder="●●●●"
                className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none tracking-[0.5em] text-center text-lg"
              />
              {createPin.length > 0 && createPin.length < 4 && (
                <p className="text-sm text-destructive">PIN must be 4 digits</p>
              )}
            </div>

            {/* Confirm PIN - only show when Create PIN has 4 digits */}
            {createPin.length === 4 && (
              <div className="space-y-2">
                <label className="text-sm text-foreground">Confirm PIN</label>
                <div className="relative">
                  <Input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setConfirmPin(value);
                      // Validate PIN match
                      if (value.length === 4) {
                        if (value !== createPin) {
                          setPinError("PIN does not match");
                        } else {
                          setPinError("");
                        }
                      } else {
                        setPinError("");
                      }
                    }}
                    placeholder="●●●●"
                    className={`gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none tracking-[0.5em] text-center text-lg pr-10 ${
                      pinError ? "border-destructive" : confirmPin.length === 4 && confirmPin === createPin ? "border-green-500" : ""
                    }`}
                  />
                  {confirmPin.length === 4 && confirmPin === createPin && !pinError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {pinError && (
                  <p className="text-sm text-destructive">{pinError}</p>
                )}
              </div>
            )}
          </div>

          {/* Gender */}
          <div className="gold-border bg-card rounded-2xl p-5 py-0 px-[15px]">
            <div className="flex items-center justify-between py-[7px]">
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
          
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={loading || !userId} className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Saving..." : "SAVE"}
        </Button>
      </div>
    </div>
  </>;
}