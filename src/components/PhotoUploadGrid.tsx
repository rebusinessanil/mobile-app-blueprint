import { useState } from "react";
import { ImagePlus, X, Edit, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ImageCropper from "./ImageCropper";
import BackgroundRemoverModal from "./BackgroundRemoverModal";
import { removeBackground, loadImage } from "@/lib/backgroundRemover";
import { logger } from "@/lib/logger";

interface PhotoUploadGridProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  primaryPhotoIndex?: number;
  onSetPrimary?: (index: number) => void;
}

export default function PhotoUploadGrid({ photos, onPhotosChange, maxPhotos = 5, primaryPhotoIndex, onSetPrimary }: PhotoUploadGridProps) {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [bgRemovalModalOpen, setBgRemovalModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingText, setProcessingText] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (photos.length >= maxPhotos) {
      toast.error(`You can upload only ${maxPhotos} photos.`);
      e.target.value = "";
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        toast.error("Upload JPG or PNG only.");
        e.target.value = "";
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setEditingIndex(photos.length);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleCropComplete = (croppedImageData: string) => {
    setCroppedImage(croppedImageData);
    setCropModalOpen(false);
    setBgRemovalModalOpen(true);
  };

  const handleKeepOriginal = () => {
    if (editingIndex !== null) {
      const newPhotos = [...photos];
      if (editingIndex < photos.length) {
        newPhotos[editingIndex] = croppedImage;
      } else {
        newPhotos.push(croppedImage);
      }
      onPhotosChange(newPhotos);
    }
    setBgRemovalModalOpen(false);
    setCroppedImage("");
    setSelectedImage(null);
    setEditingIndex(null);
  };

  const handleRemoveBackground = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingText('Starting...');
    
    try {
      // Convert base64 to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      
      // Load image
      const img = await loadImage(blob);
      
      // Remove background with progress callback
      const processedBlob = await removeBackground(img, (stage, percent) => {
        setProcessingProgress(percent);
        setProcessingText(stage);
      });
      
      // Convert back to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const processedImage = reader.result as string;
        
        if (editingIndex !== null) {
          const newPhotos = [...photos];
          if (editingIndex < photos.length) {
            newPhotos[editingIndex] = processedImage;
          } else {
            newPhotos.push(processedImage);
          }
          onPhotosChange(newPhotos);
        }
        
        setBgRemovalModalOpen(false);
        setCroppedImage("");
        setSelectedImage(null);
        setEditingIndex(null);
        setIsProcessing(false);
        setProcessingProgress(0);
        setProcessingText('');
        toast.success("Background removed successfully!");
      };
      reader.readAsDataURL(processedBlob);
    } catch (error) {
      logger.error("Background removal error:", error);
      toast.error("Image processing failed. Try another photo.");
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingText('');
      setBgRemovalModalOpen(false);
      setCroppedImage("");
      setSelectedImage(null);
      setEditingIndex(null);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const handleEditPhoto = (index: number) => {
    setSelectedImage(photos[index]);
    setEditingIndex(index);
    setCropModalOpen(true);
  };

  const handleCancelBgRemoval = () => {
    setBgRemovalModalOpen(false);
    setCroppedImage("");
    setSelectedImage(null);
    setEditingIndex(null);
  };

  const emptySlots = Array(maxPhotos - photos.length).fill(null);

  return (
    <>
      <div className="grid grid-cols-5 gap-3">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="relative aspect-square gold-border bg-card rounded-2xl overflow-hidden group cursor-pointer"
            onClick={() => onSetPrimary?.(index)}
          >
            <img src={photo} alt={`Profile ${index + 1}`} className="w-full h-full object-cover" />
            
            {/* Primary Star Badge */}
            {primaryPhotoIndex === index && (
              <div className="absolute top-2 left-2 w-7 h-7 bg-[#FFD700] rounded-full flex items-center justify-center shadow-lg z-10">
                <Star className="w-4 h-4 text-[#111827] fill-[#111827]" />
              </div>
            )}
            
            <div className="absolute top-1 right-1 flex gap-1 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPhoto(index);
                }}
                className="w-6 h-6 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="w-3 h-3 text-primary-foreground" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePhoto(index);
                }}
                className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        ))}
        
        {photos.length < maxPhotos && (
          <label className="aspect-square gold-border bg-secondary rounded-2xl flex items-center justify-center cursor-pointer hover:gold-glow transition-all">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <ImagePlus className="w-8 h-8 text-primary" />
          </label>
        )}
        
        {emptySlots.slice(0, maxPhotos - photos.length - 1).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="aspect-square gold-border bg-secondary/50 rounded-2xl flex items-center justify-center"
          >
            <ImagePlus className="w-6 h-6 text-muted-foreground" />
          </div>
        ))}
      </div>

      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-2 border-primary">
          <DialogHeader>
            <DialogTitle className="text-foreground">Crop Photo</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <ImageCropper
              image={selectedImage}
              onCropComplete={handleCropComplete}
              onCancel={() => {
                setCropModalOpen(false);
                setSelectedImage(null);
                setEditingIndex(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <BackgroundRemoverModal
        open={bgRemovalModalOpen}
        onKeep={handleKeepOriginal}
        onRemove={handleRemoveBackground}
        onClose={handleCancelBgRemoval}
        isProcessing={isProcessing}
        progress={processingProgress}
        progressText={processingText}
      />
    </>
  );
}
