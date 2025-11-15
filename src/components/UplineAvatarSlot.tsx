import { User, X, Camera, Upload } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ImageCropper from "./ImageCropper";
import BackgroundRemoverModal from "./BackgroundRemoverModal";
import { removeBackground, loadImage } from "@/lib/backgroundRemover";
import { toast } from "sonner";
interface UplineAvatarSlotProps {
  avatar?: string;
  name?: string;
  index: number;
  onUpdate: (avatar: string, name: string) => void;
  onRemove: () => void;
  adminPresets?: {
    id: string;
    name: string;
    avatar: string;
  }[];
}
export default function UplineAvatarSlot({
  avatar,
  name,
  index,
  onUpdate,
  onRemove,
  adminPresets = []
}: UplineAvatarSlotProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [showBgRemover, setShowBgRemover] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result as string);
        setShowOptions(false);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleCropComplete = (croppedImage: string) => {
    setTempImage(croppedImage);
    setShowCrop(false);
    setShowBgRemover(true);
  };
  const handleKeepBackground = () => {
    if (tempImage) {
      onUpdate(tempImage, name || `Upline ${index + 1}`);
      toast.success("Avatar updated successfully!");
    }
    setShowBgRemover(false);
    setTempImage(null);
  };
  const handleRemoveBackground = async () => {
    if (!tempImage) return;
    setShowBgRemover(false);
    setProcessing(true);
    try {
      const img = await loadImage(await fetch(tempImage).then(r => r.blob()));
      const processedBlob = await removeBackground(img);
      const reader = new FileReader();
      reader.onload = () => {
        const processedImage = reader.result as string;
        onUpdate(processedImage, name || `Upline ${index + 1}`);
        toast.success("Background removed and avatar updated!");
      };
      reader.readAsDataURL(processedBlob);
    } catch (error) {
      console.error("Background removal error:", error);
      toast.error("Failed to remove background. Using original image.");
      if (tempImage) {
        onUpdate(tempImage, name || `Upline ${index + 1}`);
      }
    } finally {
      setProcessing(false);
      setTempImage(null);
    }
  };
  const handlePresetSelect = (preset: {
    id: string;
    name: string;
    avatar: string;
  }) => {
    onUpdate(preset.avatar, preset.name);
    setShowPresets(false);
    toast.success(`${preset.name} added as upline!`);
  };
  return <>
      <div className="relative flex-shrink-0 group">
        <button onClick={() => avatar ? null : setShowOptions(true)} className={`w-16 h-16 rounded-full gold-border flex items-center justify-center overflow-hidden transition-all ${avatar ? 'bg-secondary' : 'bg-secondary/50 hover:gold-glow'}`}>
          {processing ? <div className="text-xs text-primary">Processing...</div> : avatar ? <img src={avatar} alt={name || `Upline ${index + 1}`} className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-primary" />}
        </button>
        
        {avatar && <>
            <button onClick={() => setShowOptions(true)} className="absolute top-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3 h-3 text-primary-foreground" />
            </button>
            <button onClick={onRemove} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3 text-white" />
            </button>
          </>}
        
        {name && <p className="text-xs text-center text-muted-foreground mt-1 max-w-[64px] truncate">
            {name}
          </p>}
      </div>

      {/* Upload Options Modal */}
      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="bg-card border-2 border-primary max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Change Avatar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="w-full">
              <input type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
              <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2" asChild>
                <span>
                  <Camera className="w-5 h-5" />
                  Take Photo
                </span>
              </Button>
            </label>
            
            <label className="w-full">
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <Button variant="outline" className="w-full h-12 border-primary gap-2" asChild>
                <span>
                  <Upload className="w-5 h-5" />
                  Choose from Gallery
                </span>
              </Button>
            </label>
            
            {adminPresets.length > 0}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Presets Modal */}
      <Dialog open={showPresets} onOpenChange={setShowPresets}>
        <DialogContent className="bg-card border-2 border-primary max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Select Upline</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {adminPresets.map(preset => <button key={preset.id} onClick={() => handlePresetSelect(preset)} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors">
                <div className="w-16 h-16 rounded-full gold-border overflow-hidden mx-0 px-0 my-0 py-0">
                  <img src={preset.avatar} alt={preset.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-foreground text-center line-clamp-2">{preset.name}</span>
              </button>)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Modal */}
      <Dialog open={showCrop} onOpenChange={setShowCrop}>
        <DialogContent className="max-w-2xl bg-card border-2 border-primary">
          <DialogHeader>
            <DialogTitle className="text-foreground">Crop Avatar</DialogTitle>
          </DialogHeader>
          {tempImage && <ImageCropper image={tempImage} onCropComplete={handleCropComplete} onCancel={() => {
          setShowCrop(false);
          setTempImage(null);
        }} className="mx-0 px-0 my-0 py-0" />}
        </DialogContent>
      </Dialog>

      {/* Background Remover Modal */}
      <BackgroundRemoverModal open={showBgRemover} onKeep={handleKeepBackground} onRemove={handleRemoveBackground} onClose={() => {
      setShowBgRemover(false);
      setTempImage(null);
    }} />
    </>;
}