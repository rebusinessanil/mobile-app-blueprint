import { useState } from "react";
import { Upload, X, User } from "lucide-react";
import { Button } from "./ui/button";
import ImageCropper from "./ImageCropper";
import BackgroundRemoverModal from "./BackgroundRemoverModal";
import { removeBackground, loadImage } from "@/lib/backgroundRemover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Upline {
  name: string;
  avatar_url: string;
}

interface UplineManagerProps {
  uplines: Upline[];
  onUplinesChange: (uplines: Upline[]) => void;
  maxUplines?: number;
}

export default function UplineManager({ uplines, onUplinesChange, maxUplines = 5 }: UplineManagerProps) {
  const [showCrop, setShowCrop] = useState(false);
  const [showBgRemover, setShowBgRemover] = useState(false);
  const [tempImage, setTempImage] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImage(reader.result as string);
      setEditingIndex(index);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string) => {
    setTempImage(croppedImage);
    setShowCrop(false);
    setShowBgRemover(true);
  };

  const handleKeepBackground = async () => {
    setShowBgRemover(false);
    await uploadAvatar(tempImage);
  };

  const handleRemoveBackground = async () => {
    setProcessing(true);
    setShowBgRemover(false);
    
    try {
      const img = await loadImage(await fetch(tempImage).then(r => r.blob()));
      const processedBlob = await removeBackground(img);
      const processedDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(processedBlob);
      });
      
      await uploadAvatar(processedDataUrl);
    } catch (error) {
      console.error("Background removal failed:", error);
      toast.error("Background removal failed. Using original image.");
      await uploadAvatar(tempImage);
    } finally {
      setProcessing(false);
    }
  };

  const uploadAvatar = async (dataUrl: string) => {
    if (editingIndex === null) return;

    try {
      const blob = await fetch(dataUrl).then(r => r.blob());
      const fileName = `upline_${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(uploadData.path);

      const newUplines = [...uplines];
      if (newUplines[editingIndex]) {
        newUplines[editingIndex] = { ...newUplines[editingIndex], avatar_url: publicUrl };
      } else {
        newUplines[editingIndex] = { name: `Upline ${editingIndex + 1}`, avatar_url: publicUrl };
      }
      
      onUplinesChange(newUplines);
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setEditingIndex(null);
      setTempImage("");
    }
  };

  const handleRemoveUpline = (index: number) => {
    const newUplines = uplines.filter((_, i) => i !== index);
    onUplinesChange(newUplines);
  };

  // Fill slots up to maxUplines
  const slots = Array(maxUplines).fill(null).map((_, i) => uplines[i] || null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {slots.map((upline, index) => (
          <div key={index} className="relative">
            <div className="aspect-square rounded-full border-2 border-primary bg-card overflow-hidden flex items-center justify-center">
              {upline?.avatar_url ? (
                <img src={upline.avatar_url} alt={upline.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>
            
            {upline?.avatar_url ? (
              <button
                onClick={() => handleRemoveUpline(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            ) : (
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90">
                <Upload className="w-4 h-4 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, index)}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      {showCrop && (
        <ImageCropper
          image={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCrop(false);
            setTempImage("");
            setEditingIndex(null);
          }}
        />
      )}

      <BackgroundRemoverModal
        open={showBgRemover}
        onKeep={handleKeepBackground}
        onRemove={handleRemoveBackground}
        onClose={() => {
          setShowBgRemover(false);
          setTempImage("");
          setEditingIndex(null);
        }}
      />

      {processing && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl border-2 border-primary">
            <p className="text-foreground">Processing image...</p>
          </div>
        </div>
      )}
    </div>
  );
}
