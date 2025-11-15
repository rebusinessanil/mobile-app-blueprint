import { useState } from "react";
import { ImagePlus, X, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ImageCropper from "./ImageCropper";

interface PhotoUploadGridProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoUploadGrid({ photos, onPhotosChange, maxPhotos = 10 }: PhotoUploadGridProps) {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setEditingIndex(photos.length);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    if (editingIndex !== null) {
      const newPhotos = [...photos];
      if (editingIndex < photos.length) {
        newPhotos[editingIndex] = croppedImage;
      } else {
        newPhotos.push(croppedImage);
      }
      onPhotosChange(newPhotos);
    }
    setCropModalOpen(false);
    setSelectedImage(null);
    setEditingIndex(null);
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

  const emptySlots = Array(maxPhotos - photos.length).fill(null);

  return (
    <>
      <div className="grid grid-cols-5 gap-3">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square gold-border bg-card rounded-2xl overflow-hidden group">
            <img src={photo} alt={`Profile ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1 flex gap-1">
              <button
                onClick={() => handleEditPhoto(index)}
                className="w-6 h-6 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="w-3 h-3 text-primary-foreground" />
              </button>
              <button
                onClick={() => handleRemovePhoto(index)}
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
              accept="image/*"
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
    </>
  );
}