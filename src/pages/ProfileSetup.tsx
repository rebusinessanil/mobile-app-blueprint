import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Award, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PhotoUploadGrid from "@/components/PhotoUploadGrid";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ProfileCompletionBonusModal from "@/components/ProfileCompletionBonusModal";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showBonusModal, setShowBonusModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "mr",
    name: "",
    mobile: "",
    role: "royal-ambassador",
    language: "eng",
    gender: "male"
  });
  const [customRole, setCustomRole] = useState("");

  // PIN state
  const [createPin, setCreatePin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showCreatePin, setShowCreatePin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Initialize user from session on mount
  useEffect(() => {
    const initializeUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/register", { replace: true });
        return;
      }

      const user = session.user;
      setUserId(user.id);
      
      // Pre-fill from user metadata
      const userName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || "";
      
      const userMobile = user.user_metadata?.mobile || 
                         user.phone || 
                         user.user_metadata?.phone || "";
      const cleanMobile = userMobile.replace(/^\+?\d{0,2}/, '').slice(-10);
      
      setFormData(prev => ({
        ...prev,
        name: userName,
        mobile: cleanMobile.length === 10 ? cleanMobile : ""
      }));
      
      setInitialLoading(false);
    };

    initializeUser();
  }, [navigate]);

  const handlePhotosChange = async (newPhotos: string[]) => {
    if (!userId) return;
    setPhotos(newPhotos);
  };

  const handleSetPrimaryPhoto = (index: number) => {
    if (photos[index]) {
      const newPhotos = [...photos];
      const [selected] = newPhotos.splice(index, 1);
      newPhotos.unshift(selected);
      setPhotos(newPhotos);
    }
  };

  const isProfileComplete = () => {
    const hasName = formData.name.trim() !== '';
    const hasMobile = formData.mobile && /^\d{10}$/.test(formData.mobile.replace(/\D/g, ''));
    const hasRole = formData.role && formData.role.trim() !== '';
    const hasPhotos = photos.length > 0;
    return hasName && hasMobile && hasRole && hasPhotos;
  };

  const creditProfileCompletionBonus = async () => {
    if (!userId) return;
    try {
      const { data: existingBonus } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', userId)
        .ilike('description', '%Welcome Bonus%')
        .limit(1);

      if (existingBonus && existingBonus.length > 0) return;

      const { data: currentCredits } = await supabase
        .from('user_credits')
        .select('balance, total_earned')
        .eq('user_id', userId)
        .single();

      if (currentCredits) {
        await supabase
          .from('user_credits')
          .update({
            balance: currentCredits.balance + 199,
            total_earned: currentCredits.total_earned + 199,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_credits')
          .insert({ user_id: userId, balance: 199, total_earned: 199 });
      }

      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: 199,
        transaction_type: 'admin_credit',
        description: 'Welcome Bonus Credited (199 Credits)'
      });

      await supabase
        .from('profiles')
        .update({
          profile_completion_bonus_given: true,
          welcome_bonus_given: true,
          welcome_popup_seen: true
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error crediting bonus:', error);
    }
  };

  const handleBonusConfirm = async () => {
    await creditProfileCompletionBonus();
    setShowBonusModal(false);
    toast.success("199 Credits added to your wallet!");
    navigate("/dashboard", { replace: true });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (photos.length === 0) {
      toast.error("Please upload at least 1 profile photo");
      return;
    }
    if (!formData.mobile || !/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (formData.role === "custom" && !customRole.trim()) {
      toast.error("Please enter a custom role name");
      return;
    }
    
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
      const formattedMobile = `+91${formData.mobile.replace(/\D/g, '')}`;

      const uploadedPhotoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.startsWith('http')) {
          uploadedPhotoUrls.push(photo);
          continue;
        }
        
        const response = await fetch(photo);
        const blob = await response.blob();
        const fileName = `${userId}/${Date.now()}_${i}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, blob, { contentType: 'image/png', upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        uploadedPhotoUrls.push(publicUrl);
      }

      for (let i = 0; i < uploadedPhotoUrls.length; i++) {
        await supabase.from('profile_photos').insert({
          user_id: userId,
          photo_url: uploadedPhotoUrls[i],
          display_order: i,
          is_primary: i === 0
        });
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          mobile: formattedMobile,
          role: finalRole,
          rank: finalRole,
          profile_photo: uploadedPhotoUrls[0],
          profile_completed: true
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      if (createPin.length === 4 && confirmPin === createPin) {
        const PIN_PREFIX = "pin_";
        const paddedPassword = PIN_PREFIX + createPin;
        await supabase.auth.updateUser({ password: paddedPassword });
        await supabase.auth.updateUser({ data: { pin_hash: btoa(createPin) } });
      }

      toast.success("Profile setup complete!");
      setShowBonusModal(true);
    } catch (error: any) {
      console.error("Profile setup error:", error);
      toast.error(error.message || "Failed to complete profile setup");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground text-lg">Loading Profile Setup...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProfileCompletionBonusModal open={showBonusModal} onConfirm={handleBonusConfirm} />
      <div className="min-h-screen bg-navy-dark pb-6">
        <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-primary">Complete Your Profile</h1>
              <p className="text-sm text-foreground">Set up your profile to get started</p>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          <div className="flex items-center gap-3 px-4 py-3 bg-card/50 rounded-xl border border-primary/30">
            <div className="w-10 h-10 bg-destructive rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">New User Setup</p>
            </div>
            <div className="px-4 py-1 bg-primary rounded-full">
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground">RE BUSINESS</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <PhotoUploadGrid 
              photos={photos} 
              onPhotosChange={handlePhotosChange} 
              maxPhotos={5} 
              primaryPhotoIndex={0}
              onSetPrimary={handleSetPrimaryPhoto} 
            />
            <p className="text-center text-sm text-primary">Profile Images (Max 5)</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-foreground">Name</label>
              <div className="flex gap-3">
                <Select value={formData.title} onValueChange={value => setFormData({ ...formData, title: value })}>
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
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  className="flex-1 gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Mobile Number</label>
              <Input 
                type="tel" 
                value={formData.mobile} 
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, mobile: value });
                }}
                className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none" 
                placeholder="Enter mobile number" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Role</label>
              <Select value={formData.role} onValueChange={value => setFormData({ ...formData, role: value })}>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-foreground">Default Language</label>
                <Select value={formData.language} onValueChange={value => setFormData({ ...formData, language: value })}>
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

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm text-foreground">Create PIN</label>
                <div className="relative">
                  <Input
                    type={showCreatePin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={createPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCreatePin(value);
                      if (confirmPin) setConfirmPin("");
                      if (pinError) setPinError("");
                    }}
                    placeholder="●●●●"
                    className="gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none tracking-[0.5em] text-center text-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePin(!showCreatePin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCreatePin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {createPin.length > 0 && createPin.length < 4 && (
                  <p className="text-sm text-destructive">PIN must be 4 digits</p>
                )}
              </div>

              {createPin.length === 4 && (
                <div className="space-y-2">
                  <label className="text-sm text-foreground">Confirm PIN</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPin ? "text" : "password"}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setConfirmPin(value);
                        if (value.length === 4) {
                          setPinError(value !== createPin ? "PIN does not match" : "");
                        } else {
                          setPinError("");
                        }
                      }}
                      placeholder="●●●●"
                      className={`gold-border bg-secondary text-foreground h-12 border-b-2 border-t-0 border-x-0 rounded-none tracking-[0.5em] text-center text-lg pr-10 ${
                        pinError ? "border-destructive" : confirmPin.length === 4 && confirmPin === createPin ? "border-green-500" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {confirmPin.length === 4 && confirmPin === createPin && !pinError && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {pinError && <p className="text-sm text-destructive">{pinError}</p>}
                </div>
              )}
            </div>

            <div className="gold-border bg-card rounded-2xl p-5 py-0 px-[15px]">
              <div className="flex items-center justify-between py-[7px]">
                <label className="text-sm text-foreground">Gender</label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setFormData({ ...formData, gender: "male" })} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${formData.gender === "male" ? "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-card" : "bg-secondary border-2 border-primary/30"}`}
                  >
                    <span className="text-2xl">👨</span>
                  </button>
                  <button 
                    onClick={() => setFormData({ ...formData, gender: "female" })} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${formData.gender === "female" ? "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-card" : "bg-secondary border-2 border-primary/30"}`}
                  >
                    <span className="text-2xl">👩</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={loading || !userId} 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up..." : "SAVE"}
          </Button>
        </div>
      </div>
    </>
  );
}
