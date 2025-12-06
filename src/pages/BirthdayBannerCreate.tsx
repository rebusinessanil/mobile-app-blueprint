import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BannerCreateLayout from "@/components/BannerCreateLayout";
import BackgroundRemoverModal from "@/components/BackgroundRemoverModal";
import ImageCropper from "@/components/ImageCropper";
import { toast } from "sonner";
import { useBackgroundRemovalFast } from "@/hooks/useBackgroundRemovalFast";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { useBirthday } from "@/hooks/useBirthdays";
import { useTemplates } from "@/hooks/useTemplates";
import { supabase } from "@/integrations/supabase/client";

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

export default function BirthdayBannerCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const birthdayId = searchParams.get('birthdayId');
  
  const { birthday, loading: birthdayLoading } = useBirthday(birthdayId || undefined);
  const { templates, loading: templatesLoading } = useTemplates(undefined, undefined, undefined, birthdayId || undefined);
  
  const [userId, setUserId] = useState<string | null>(null);
  const { settings: bannerSettings } = useBannerSettings(userId || undefined);
  
  const [uplines, setUplines] = useState<Upline[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: "",
    teamCity: ""
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
    if (bannerSettings && uplines.length === 0) {
      const defaultUplines = bannerSettings.upline_avatars.map((upline, index) => ({
        id: `upline-${index}`,
        name: upline.name,
        avatar: upline.avatar_url
      }));
      setUplines(defaultUplines);
    }
  }, [bannerSettings]);

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

    const templateId = templates.length > 0 ? templates[0].id : undefined;

    navigate("/banner-preview", {
      state: {
        categoryType: "birthday",
        rankName: birthday?.title || "Birthday Celebration",
        name: formData.name,
        teamCity: formData.teamCity,
        photo,
        uplines,
        slotStickers,
        templateId,
        birthdayId
      }
    });
  };

  const handleReset = () => {
    if (bgRemoval.isProcessing) {
      toast.warning("Please wait for background removal to complete");
      return;
    }
    setFormData({
      name: "",
      teamCity: ""
    });
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

  if (birthdayLoading || templatesLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

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
    }
  ];

  return (
    <BannerCreateLayout
      title="BIRTHDAY"
      subtitle="Celebration Details"
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
