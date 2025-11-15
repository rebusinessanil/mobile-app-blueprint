import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ImageCropper from "@/components/ImageCropper";

interface Photo {
  id: string;
  url: string;
  file?: File;
}

export default function ProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  const userName = location.state?.name || "";

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [name, setName] = useState(userName);
  const [teamCity, setTeamCity] = useState("");
  const [role, setRole] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  useEffect(() => {
    if (!userId) {
      toast.error("Invalid session. Please register again.");
      navigate("/register");
    }
  }, [userId, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Check max photos
    if (photos.length >= 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }

    // Open cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      setCurrentImage(e.target?.result as string);
      setCurrentFile(file);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    // Convert base64 to blob
    fetch(croppedImageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], currentFile?.name || "photo.jpg", {
          type: "image/jpeg",
        });

        const newPhoto: Photo = {
          id: crypto.randomUUID(),
          url: croppedImageUrl,
          file: file,
        };

        setPhotos([...photos, newPhoto]);
        setCropperOpen(false);
        setCurrentImage(null);
        setCurrentFile(null);
        toast.success("Photo added!");
      });
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleComplete = async () => {
    // Validation
    if (photos.length === 0) {
      toast.error("Please upload at least 1 profile photo");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsUploading(true);

    try {
      // Upload photos to storage
      const uploadedPhotoUrls: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo.file) continue;

        const fileExt = photo.file.name.split(".").pop();
        const fileName = `${userId}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(filePath, photo.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(filePath);

        uploadedPhotoUrls.push(publicUrl);
      }

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          name: name.trim(),
          role: role.trim() || null,
          profile_photo: uploadedPhotoUrls[0], // Primary photo
        });

      if (profileError) throw profileError;

      // Create profile_photos entries
      const photoInserts = uploadedPhotoUrls.map((url, index) => ({
        user_id: userId,
        photo_url: url,
        display_order: index,
        is_primary: index === 0,
      }));

      const { error: photosError } = await supabase
        .from("profile_photos")
        .insert(photoInserts);

      if (photosError) throw photosError;

      toast.success("Profile setup complete!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Profile setup error:", error);
      toast.error(error.message || "Failed to complete profile setup");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark to-navy flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="gold-border bg-card/95 backdrop-blur-sm p-8 rounded-3xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Complete Your Profile</h1>
            <p className="text-muted-foreground">
              Upload 1-5 profile photos and add your details
            </p>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Profile Photos * <span className="text-muted-foreground">(1-5 photos)</span>
              </label>
              <span className="text-xs text-muted-foreground">
                {photos.length}/5 uploaded
              </span>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square gold-border rounded-2xl overflow-hidden group"
                >
                  <img
                    src={photo.url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              {photos.length < 5 && (
                <label className="aspect-square gold-border bg-secondary/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/70 transition-colors">
                  <Upload className="w-8 h-8 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground text-center px-2">
                    Add Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {photos.length === 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
                <p className="text-sm text-destructive">
                  ⚠️ At least 1 profile photo is required to continue
                </p>
              </div>
            )}
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Full Name *</label>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="gold-border bg-background h-12"
            />
          </div>

          {/* Team/City Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Team / City</label>
            <Input
              type="text"
              placeholder="e.g., Mumbai Team or New Delhi"
              value={teamCity}
              onChange={(e) => setTeamCity(e.target.value)}
              className="gold-border bg-background h-12"
            />
          </div>

          {/* Role Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Role</label>
            <Input
              type="text"
              placeholder="e.g., Team Leader, Business Partner"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="gold-border bg-background h-12"
            />
          </div>

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            disabled={photos.length === 0 || !name.trim() || isUploading}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold"
          >
            {isUploading ? "Setting up your profile..." : "Complete Profile"}
          </Button>

          {/* Info */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground text-center">
              💡 Your profile photo will be used in all your promotional banners
            </p>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {cropperOpen && currentImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="gold-border bg-card rounded-3xl p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold text-foreground mb-4">Crop Your Photo</h2>
            <ImageCropper
              image={currentImage}
              onCropComplete={handleCropComplete}
              onCancel={() => {
                setCropperOpen(false);
                setCurrentImage(null);
                setCurrentFile(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
