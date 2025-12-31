import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Gift, Cake, Heart, Users, PartyPopper, Zap, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UplineCarousel from "@/components/UplineCarousel";
import BackgroundRemoverModal from "@/components/BackgroundRemoverModal";
import ImageCropper from "@/components/ImageCropper";
import { toast } from "sonner";
import { useBackgroundRemovalFast } from "@/hooks/useBackgroundRemovalFast";
import { useProfile } from "@/hooks/useProfile";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { supabase } from "@/integrations/supabase/client";

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

interface CategoryConfig {
  icon: string;
  IconComponent: LucideIcon;
  title: string;
  subtitle: string;
  gradient: string;
  categoryType: string;
  rankName: string;
  additionalFields?: Array<{
    name: string;
    label: string;
    placeholder: string;
    optional?: boolean;
    type?: 'text' | 'number';
  }>;
}

const categoryConfigs: Record<string, CategoryConfig> = {
  'bonanza': {
    icon: '🎁',
    IconComponent: Gift,
    title: 'Bonanza Promotion',
    subtitle: 'Trip Achievement Details',
    gradient: 'from-red-600 to-orange-600',
    categoryType: 'bonanza',
    rankName: 'Bonanza Achievement',
    additionalFields: [
      { name: 'tripName', label: 'Trip Name', placeholder: 'Enter trip name', optional: true }
    ]
  },
  'birthday': {
    icon: '🎂',
    IconComponent: Cake,
    title: 'Birthday Banner',
    subtitle: 'Celebration Details',
    gradient: 'from-teal-600 to-blue-600',
    categoryType: 'birthday',
    rankName: 'Birthday Celebration'
  },
  'anniversary': {
    icon: '💞',
    IconComponent: Heart,
    title: 'Anniversary Banner',
    subtitle: 'Celebration Details',
    gradient: 'from-blue-600 to-purple-600',
    categoryType: 'anniversary',
    rankName: 'Anniversary Celebration',
    additionalFields: [
      { name: 'years', label: 'Years', placeholder: 'Enter number of years', optional: true, type: 'number' }
    ]
  },
  'meeting': {
    icon: '📊',
    IconComponent: Users,
    title: 'Meeting Banner',
    subtitle: 'Event Details',
    gradient: 'from-green-600 to-teal-600',
    categoryType: 'meeting',
    rankName: 'Meeting Event',
    additionalFields: [
      { name: 'eventTitle', label: 'Event Title', placeholder: 'Enter event title', optional: true },
      { name: 'eventDate', label: 'Event Date', placeholder: 'Enter event date', optional: true },
      { name: 'eventVenue', label: 'Venue', placeholder: 'Enter venue', optional: true }
    ]
  },
  'festival': {
    icon: '🎉',
    IconComponent: PartyPopper,
    title: 'Festival Banner',
    subtitle: 'Celebration Details',
    gradient: 'from-pink-600 to-purple-600',
    categoryType: 'festival',
    rankName: 'Festival Greetings',
    additionalFields: [
      { name: 'festivalName', label: 'Festival Name', placeholder: 'Enter festival name', optional: true }
    ]
  },
  'motivational': {
    icon: '⚡',
    IconComponent: Zap,
    title: 'Motivational Banner',
    subtitle: 'Inspiration Message',
    gradient: 'from-orange-600 to-yellow-600',
    categoryType: 'motivational',
    rankName: 'Motivational Quote',
    additionalFields: [
      { name: 'quote', label: 'Quote', placeholder: 'Enter motivational quote', optional: true }
    ]
  }
};

export default function UniversalBannerCreate() {
  const navigate = useNavigate();
  const { category = 'bonanza' } = useParams<{ category: string }>();
  const config = categoryConfigs[category] || categoryConfigs['bonanza'];
  
  const [mode, setMode] = useState<"myPhoto" | "others">("myPhoto");
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId || undefined);
  const { settings: bannerSettings } = useBannerSettings(userId || undefined);
  
  const [uplines, setUplines] = useState<Upline[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: "",
    teamCity: "",
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [slotStickers, setSlotStickers] = useState<Record<number, string[]>>({});
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);

  // Fast backend background removal hook
  const bgRemoval = useBackgroundRemovalFast({
    onSuccess: (processedUrl) => {
      setPhoto(processedUrl);
      setBackgroundRemoved(true);
    }
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    if (bannerSettings && uplines.length === 0) {
      const defaultUplines = bannerSettings.upline_avatars.map((upline, index) => ({
        id: `upline-${index}`,
        name: upline.name,
        avatar: upline.avatar_url
      }));
      setUplines(defaultUplines);
    }

    const channel = supabase
      .channel('banner-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_banner_settings',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Banner settings updated:', payload);
          if (payload.new && 'upline_avatars' in payload.new) {
            const updatedUplines = (payload.new.upline_avatars as any[]).map((upline, index) => ({
              id: `upline-${index}`,
              name: upline.name,
              avatar: upline.avatar_url
            }));
            setUplines(updatedUplines);
            toast.success('Upline settings updated');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, bannerSettings]);

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
    bgRemoval.openModal(croppedImage);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempPhoto(null);
  };

  const handleKeepBackground = () => {
    bgRemoval.closeModal();
    setBackgroundRemoved(false);
  };

  const handleRemoveBackground = async () => {
    await bgRemoval.processRemoval();
  };

  const handleCreate = async () => {
    if (bgRemoval.isProcessing) {
      toast.warning("Please wait for background removal to complete");
      return;
    }
    if (!formData.name) {
      toast.error("Please enter Name");
      return;
    }
    if (formData.name.length > 20) {
      toast.error("Name can't exceed 20 characters");
      return;
    }
    if (mode === "myPhoto" && !photo) {
      toast.error("Please upload your photo");
      return;
    }

    navigate("/banner-preview", {
      state: {
        categoryType: config.categoryType,
        rankName: config.rankName,
        ...formData,
        photo,
        uplines,
        slotStickers,
        backgroundRemoved
      }
    });
  };

  const handleReset = () => {
    if (bgRemoval.isProcessing) {
      toast.warning("Please wait for background removal to complete");
      return;
    }
    const resetData: Record<string, string> = {
      name: "",
      teamCity: "",
    };
    
    config.additionalFields?.forEach(field => {
      resetData[field.name] = "";
    });
    
    setFormData(resetData);
    setPhoto(null);
    setTempPhoto(null);
    setBackgroundRemoved(false);
    
    if (bannerSettings) {
      const defaultUplines = bannerSettings.upline_avatars.map((upline, index) => ({
        id: `upline-${index}`,
        name: upline.name,
        avatar: upline.avatar_url
      }));
      setUplines(defaultUplines);
    } else {
      setUplines([]);
    }
    setSlotStickers({});
    toast.success("Form reset to default values");
  };

  const handleFieldChange = (fieldName: string, value: string, type?: 'text' | 'number') => {
    let processedValue = value;
    if (type === 'number') {
      processedValue = value.replace(/[^0-9]/g, '');
    }
    setFormData({ ...formData, [fieldName]: processedValue });
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => !bgRemoval.isProcessing && navigate("/dashboard")} 
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
            disabled={bgRemoval.isProcessing}
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className={`bg-gradient-to-br ${config.gradient} rounded-3xl p-6 flex items-center justify-center gold-border flex-shrink-0 w-32 h-32`}>
            <config.IconComponent className="w-16 h-16 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 pt-2">
            <p className="text-sm text-muted-foreground mb-1">Please fill up</p>
            <h1 className="text-3xl font-bold text-primary mb-1">{config.title}</h1>
            <p className="text-lg text-blue-400">{config.subtitle}</p>
          </div>
        </div>

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
          </div>
        </div>

        <div className="space-y-3">
          <div className="gold-border bg-card/30 rounded-2xl p-4">
            <UplineCarousel uplines={uplines} onUplinesChange={setUplines} maxUplines={5} />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-foreground">Name (Max 20 characters)</label>
              <Input 
                value={formData.name} 
                onChange={e => {
                  const value = e.target.value;
                  if (value.length <= 20) {
                    handleFieldChange('name', value);
                  }
                }} 
                placeholder="Enter Name" 
                maxLength={20}
                className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-12 focus-visible:ring-0 focus-visible:border-primary" 
              />
              <p className="text-xs text-muted-foreground">{formData.name.length}/20 characters</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Team Name <span className="text-muted-foreground">(Optional)</span></label>
              <Input 
                value={formData.teamCity || ''} 
                onChange={e => handleFieldChange('teamCity', e.target.value)} 
                placeholder="Team Name (Optional)" 
                className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-12 focus-visible:ring-0 focus-visible:border-primary" 
              />
            </div>

            {config.additionalFields?.map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="text-sm text-foreground">
                  {field.label} {field.optional && <span className="text-muted-foreground">(optional)</span>}
                </label>
                <Input 
                  value={formData[field.name] || ''} 
                  onChange={e => handleFieldChange(field.name, e.target.value, field.type)} 
                  placeholder={field.placeholder} 
                  className="bg-transparent border-0 border-b-2 border-muted rounded-none text-foreground h-12 focus-visible:ring-0 focus-visible:border-primary" 
                />
              </div>
            ))}
          </div>

          {mode === "myPhoto" && (
            <div className="w-48 flex-shrink-0">
              {photo ? (
                <div className="relative w-full h-48 gold-border rounded-2xl overflow-hidden bg-secondary">
                  <img src={photo} alt="Uploaded" className="w-full h-full object-cover" />
                </div>
              ) : (
                <label className="w-full h-48 gold-border bg-secondary/50 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:gold-glow transition-all">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-primary" />
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleReset} 
            variant="outline" 
            className="flex-1 h-12 border-2 border-primary text-foreground hover:bg-primary/10"
            disabled={bgRemoval.isProcessing}
          >
            RESET
          </Button>
          <Button 
            onClick={handleCreate} 
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            disabled={bgRemoval.isProcessing}
          >
            CREATE
          </Button>
        </div>
      </div>

      {showCropper && tempPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0E15] rounded-2xl p-6 w-full max-w-2xl border-2 border-primary shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Crop Your Photo</h3>
            <p className="text-sm text-muted-foreground mb-4">Adjust to 3:4 portrait ratio for perfect banner fit</p>
            <ImageCropper
              image={tempPhoto}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              aspect={0.75}
            />
          </div>
        </div>
      )}

      <BackgroundRemoverModal 
        open={bgRemoval.showModal} 
        onKeep={handleKeepBackground} 
        onRemove={handleRemoveBackground} 
        onClose={bgRemoval.closeModal}
        isProcessing={bgRemoval.isProcessing}
        progress={bgRemoval.progress}
        progressText={bgRemoval.progressText}
      />
    </div>
  );
}
