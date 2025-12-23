import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, FileText, Award, Check, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PhotoUploadGrid from "@/components/PhotoUploadGrid";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { supabase } from "@/integrations/supabase/client";
import DeleteAccountModal from "@/components/DeleteAccountModal";
const PROFILE_GATE_BYPASS_KEY = "rebusiness_profile_completed";
export default function ProfileEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get prefilled data from registration flow
  const prefillName = location.state?.prefillName;
  const prefillMobile = location.state?.prefillMobile;
  const prefillPin = location.state?.prefillPin;
  
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
    // Empty by default - user must enter
    role: "",
    // Empty by default - user must select
    language: "eng",
    gender: "male",
    married: false
  });
  const [customRole, setCustomRole] = useState("");
  const [roleConfirmed, setRoleConfirmed] = useState(false); // Track if user manually selected role

  // PIN state
  const [createPin, setCreatePin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showCreatePin, setShowCreatePin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  
  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load profile data when available, with prefill from registration
  useEffect(() => {
    if (profile) {
      const predefinedRoles = ["bronze", "silver", "gold", "platinum", "emerald", "topaz", "ruby-star", "sapphire", "star-sapphire", "diamond", "blue-diamond", "black-diamond", "royal-diamond", "crown-diamond", "ambassador", "royal-ambassador", "crown-ambassador", "brand-ambassador"];
      const isCustomRole = profile.role && !predefinedRoles.includes(profile.role);

      // Extract 10-digit mobile from stored format (e.g., +919876543210 -> 9876543210)
      // Only load if it's a real number (not default placeholder)
      let extractedMobile = '';
      if (profile.mobile && profile.mobile !== '+000000000000') {
        const cleaned = profile.mobile.replace(/^\+91/, '').replace(/\D/g, '');
        // Only use if it's a valid 10-digit number
        if (cleaned.length >= 10) {
          extractedMobile = cleaned.slice(-10);
        }
      }

      // Use prefilled data from registration if available, otherwise use profile data
      const finalName = prefillName || (profile.name && profile.name !== 'User' ? profile.name : "");
      
      // For mobile, prefer prefill, then extracted profile mobile
      let finalMobile = extractedMobile;
      if (prefillMobile) {
        const cleanedPrefill = prefillMobile.replace(/^\+91/, '').replace(/\D/g, '');
        if (cleanedPrefill.length >= 10) {
          finalMobile = cleanedPrefill.slice(-10);
        }
      }

      // Determine if user has previously selected a role
      const hasValidRole = profile.role && profile.role.trim() !== '' && profile.role !== 'User';
      setFormData({
        title: "mr",
        name: finalName,
        mobile: finalMobile,
        role: hasValidRole ? isCustomRole ? "custom" : profile.role : "",
        language: "eng",
        gender: "male",
        married: false
      });

      // Only mark role as confirmed if user previously had a valid role
      if (hasValidRole) {
        setRoleConfirmed(true);
        if (isCustomRole && profile.role) {
          setCustomRole(profile.role);
        }
      }
    }
  }, [profile, prefillName, prefillMobile]);

  // Pre-fill PIN from registration
  useEffect(() => {
    if (prefillPin && prefillPin.length === 4) {
      setCreatePin(prefillPin);
      setConfirmPin(prefillPin);
    }
  }, [prefillPin]);

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

  // Check if PIN is valid
  const isPinValid = () => {
    return createPin.length === 4 && /^\d{4}$/.test(createPin) && confirmPin === createPin;
  };

  // Check if profile is complete - requires manual selection of all fields + valid PIN
  const isProfileComplete = () => {
    const hasName = formData.name.trim() !== '' && formData.name !== 'User';
    const hasMobile = formData.mobile && /^\d{10}$/.test(formData.mobile.replace(/\D/g, ''));
    const hasRole = roleConfirmed && formData.role && formData.role.trim() !== '';
    const hasPhotos = photos.length > 0;
    const hasValidPin = isPinValid();
    return hasName && hasMobile && hasRole && hasPhotos && hasValidPin;
  };

  // Check if save button should be disabled
  const isSaveDisabled = () => {
    return loading || !userId || !isProfileComplete();
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
    if (!roleConfirmed || !formData.role || formData.role.trim() === '') {
      toast.error("Please select a role");
      return;
    }
    if (formData.role === "custom" && !customRole.trim()) {
      toast.error("Please enter a custom role name");
      return;
    }

    // PIN validation - MANDATORY for profile completion
    if (createPin.length !== 4 || !/^\d{4}$/.test(createPin)) {
      toast.error("Please set a valid 4-digit PIN");
      setPinError("PIN must be exactly 4 digits");
      return;
    }
    if (confirmPin !== createPin) {
      toast.error("PIN does not match");
      setPinError("PIN does not match");
      return;
    }
    setLoading(true);
    try {
      const finalRole = formData.role === "custom" ? customRole.trim() : formData.role;
      // Format mobile number with country code
      const formattedMobile = `+91${formData.mobile.replace(/\D/g, '')}`;
      const {
        error
      } = await updateProfile({
        name: formData.name.trim(),
        mobile: formattedMobile,
        whatsapp: null,
        role: finalRole,
        rank: finalRole,
        profile_photo: photos[0]
      });
      if (error) {
        console.error("Profile update error:", error);
        toast.error(error.message || "Failed to update profile. Please try again.");
        return;
      }

      // Save PIN if provided - updates auth password for login to work with new PIN
      if (createPin.length === 4 && confirmPin === createPin && userId) {
        // Pad PIN with prefix to meet Supabase 6+ character password requirement
        const PIN_PREFIX = "pin_";
        const paddedPassword = PIN_PREFIX + createPin;

        // Update the actual auth password so signInWithPassword works with new PIN
        const {
          error: passwordError
        } = await supabase.auth.updateUser({
          password: paddedPassword
        });
        if (passwordError) {
          console.error("Error updating PIN password:", passwordError);
          toast.error("Failed to update PIN. Please try again.");
          return;
        }

        // Also store PIN hash in metadata for reference/verification
        const pinHash = btoa(createPin);
        await supabase.auth.updateUser({
          data: {
            pin_hash: pinHash
          }
        });

        // Clear PIN fields after successful save
        setCreatePin("");
        setConfirmPin("");
        toast.success("PIN updated successfully!");
      }

      // If profile is complete, credit welcome bonus via atomic edge function
      if (isProfileComplete() && userId) {
        try {
          // Call atomic edge function for welcome bonus
          const { data: bonusResult, error: bonusError } = await supabase.functions.invoke(
            'credit-welcome-bonus',
            { body: { user_id: userId } }
          );

          if (bonusError) {
            console.error("Error calling welcome bonus function:", bonusError);
          } else {
            console.log("Welcome bonus result:", bonusResult);
          }
          
          localStorage.setItem(PROFILE_GATE_BYPASS_KEY, "true");
        } catch (e) {
          console.error("Error setting up welcome bonus:", e);
        }
      }
      toast.success("Profile updated successfully!");
      navigate("/dashboard", {
        replace: true
      });
    } catch (err) {
      console.error("Unexpected error during profile update:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return <>
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
            <Input 
              type="tel" 
              inputMode="numeric"
              maxLength={10}
              value={formData.mobile} 
              onChange={e => {
                // Only allow digits, max 10
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({
                  ...formData,
                  mobile: value
                });
              }} 
              className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none" 
              placeholder="Enter 10-digit mobile number" 
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Role</label>
            <Select value={formData.role} onValueChange={value => {
              setFormData({
                ...formData,
                role: value
              });
              setRoleConfirmed(true); // Mark as confirmed when user manually selects
            }}>
              <SelectTrigger className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none">
                <SelectValue placeholder="Select Role" />
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

          {/* Create PIN Section - REQUIRED */}
          <div className="space-y-4 pt-4 border-t border-primary/20">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-foreground">Create PIN</label>
                <span className="text-xs text-destructive font-medium">* Required</span>
              </div>
              <div className="relative">
                <Input type={showCreatePin ? "text" : "password"} inputMode="numeric" pattern="[0-9]*" maxLength={4} value={createPin} onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCreatePin(value);
                  // Clear confirm PIN when create PIN changes
                  if (confirmPin) setConfirmPin("");
                  // Clear error when typing
                  if (pinError) setPinError("");
                }} placeholder="●●●●" className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none tracking-[0.5em] text-center text-lg pr-10" />
                <button type="button" onClick={() => setShowCreatePin(!showCreatePin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showCreatePin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {createPin.length > 0 && createPin.length < 4 && <p className="text-sm text-destructive">PIN must be 4 digits</p>}
            </div>

            {/* Confirm PIN - only show when Create PIN has 4 digits */}
            {createPin.length === 4 && <div className="space-y-2">
                <label className="text-sm text-foreground">Confirm PIN</label>
                <div className="relative">
                  <Input type={showConfirmPin ? "text" : "password"} inputMode="numeric" pattern="[0-9]*" maxLength={4} value={confirmPin} onChange={e => {
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
                }} placeholder="●●●●" className={`gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none tracking-[0.5em] text-center text-lg pr-10 ${pinError ? "border-destructive" : confirmPin.length === 4 && confirmPin === createPin ? "border-green-500" : ""}`} />
                  <button type="button" onClick={() => setShowConfirmPin(!showConfirmPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {confirmPin.length === 4 && confirmPin === createPin && !pinError && <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>}
                </div>
                {pinError && <p className="text-sm text-destructive">{pinError}</p>}
              </div>}
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
        <Button onClick={handleSave} disabled={isSaveDisabled()} className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Saving..." : "SAVE"}
        </Button>
        
        {/* Validation hints when button is disabled */}
        {!loading && userId && !isProfileComplete() && <div className="text-center mt-3 space-y-1">
            {!formData.name.trim() && <p className="text-sm text-destructive">• Name is required</p>}
            {(!formData.mobile || !/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) && <p className="text-sm text-destructive">• Valid 10-digit mobile required</p>}
            {(!roleConfirmed || !formData.role) && <p className="text-sm text-destructive">• Please select a role</p>}
            {photos.length === 0 && <p className="text-sm text-destructive">• At least 1 profile photo required</p>}
            {!isPinValid() && <p className="text-sm text-destructive">• Valid 4-digit PIN required</p>}
          </div>}

        {/* Danger Zone - Delete Account - Only show for completed profiles */}
        {profile?.profile_completed && profile?.welcome_bonus_given && (
          <div className="mt-12 pt-6 border-t border-destructive/30">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                className="w-full h-12 font-semibold"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Permanently Delete Account
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Delete Account Modal */}
    <DeleteAccountModal 
      open={showDeleteModal} 
      onOpenChange={setShowDeleteModal} 
    />
  </>;
}