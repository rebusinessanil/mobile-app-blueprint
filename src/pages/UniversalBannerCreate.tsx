import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Gift, Cake, Heart, Users, PartyPopper, Zap, LucideIcon } from "lucide-react";
import BannerCreateLayout from "@/components/BannerCreateLayout";
import BackgroundRemoverModal from "@/components/BackgroundRemoverModal";
import ImageCropper from "@/components/ImageCropper";
import { toast } from "sonner";
import { useBackgroundRemovalFast } from "@/hooks/useBackgroundRemovalFast";
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
    title: 'BONANZA',
    subtitle: 'Trip Achievement Details',
    categoryType: 'bonanza',
    rankName: 'Bonanza Achievement',
    additionalFields: [
      { name: 'tripName', label: 'Trip Name', placeholder: 'Enter trip name', optional: true }
    ]
  },
  'birthday': {
    icon: '🎂',
    IconComponent: Cake,
    title: 'BIRTHDAY',
    subtitle: 'Celebration Details',
    categoryType: 'birthday',
    rankName: 'Birthday Celebration'
  },
  'anniversary': {
    icon: '💞',
    IconComponent: Heart,
    title: 'ANNIVERSARY',
    subtitle: 'Celebration Details',
    categoryType: 'anniversary',
    rankName: 'Anniversary Celebration',
    additionalFields: [
      { name: 'years', label: 'Years', placeholder: 'Enter number of years', optional: true, type: 'number' }
    ]
  },
  'meeting': {
    icon: '📊',
    IconComponent: Users,
    title: 'MEETING',
    subtitle: 'Event Details',
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
    title: 'FESTIVAL',
    subtitle: 'Celebration Details',
    categoryType: 'festival',
    rankName: 'Festival Greetings',
    additionalFields: [
      { name: 'festivalName', label: 'Festival Name', placeholder: 'Enter festival name', optional: true }
    ]
  },
  'motivational': {
    icon: '⚡',
    IconComponent: Zap,
    title: 'MOTIVATIONAL',
    subtitle: 'Inspiration Message',
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
  
  const [userId, setUserId] = useState<string | null>(null);
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

  const bgRemoval = useBackgroundRemovalFast({
    onSuccess: (processedUrl) => setPhoto(processedUrl)
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
    if (formData.name.length > 50) {
      toast.error("Name can't exceed 50 characters");
      return;
    }
    if (!photo) {
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
        slotStickers
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

  const handleFormChange = (fieldName: string, value: string) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  // Build form fields
  const formFields = [
    {
      name: 'name',
      label: 'Name',
      placeholder: 'Enter Name',
      maxLength: 50,
      showCounter: true
    },
    {
      name: 'teamCity',
      label: 'Team Name',
      placeholder: 'Enter Team Name',
      optional: true
    },
    ...(config.additionalFields?.map(field => ({
      name: field.name,
      label: field.label,
      placeholder: field.placeholder,
      optional: field.optional,
      type: field.type
    })) || [])
  ];

  return (
    <BannerCreateLayout
      title={config.title}
      subtitle={config.subtitle}
      uplines={uplines}
      onUplinesChange={setUplines}
      formFields={formFields}
      formData={formData}
      onFormChange={handleFormChange}
      photo={photo}
      onPhotoUpload={handlePhotoUpload}
      onReset={handleReset}
      onCreate={handleCreate}
      isProcessing={bgRemoval.isProcessing}
    >
      {showCropper && tempPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0E15] rounded-2xl p-6 w-full max-w-2xl border-2 border-[#FFD700] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Crop Your Photo</h3>
            <p className="text-sm text-gray-400 mb-4">Adjust to 3:4 portrait ratio for perfect banner fit</p>
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
    </BannerCreateLayout>
  );
}
