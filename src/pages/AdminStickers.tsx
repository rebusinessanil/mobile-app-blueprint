import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Upload, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStickers, useStickerCategories, useAdminStickers } from "@/hooks/useStickers";
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminStickers() {
  const navigate = useNavigate();
  const { categories } = useStickerCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { stickers, loading } = useStickers(selectedCategory);
  const { uploadSticker, deleteSticker } = useAdminStickers();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    categoryId: undefined as string | undefined,
    description: "",
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name || !uploadForm.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await uploadSticker(
      uploadForm.file,
      uploadForm.name,
      uploadForm.categoryId,
      uploadForm.description
    );

    if (error) {
      toast.error("Failed to upload sticker");
      return;
    }

    toast.success("Sticker uploaded successfully!");
    setIsUploadOpen(false);
    setUploadForm({ name: "", categoryId: undefined, description: "", file: null });
    window.location.reload();
  };

  const handleDelete = async (stickerId: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this sticker?")) return;

    const { error } = await deleteSticker(stickerId, imageUrl);

    if (error) {
      toast.error("Failed to delete sticker");
      return;
    }

    toast.success("Sticker deleted successfully!");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-primary">Sticker Management</h1>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary">
              <DialogHeader>
                <DialogTitle className="text-foreground">Upload New Sticker</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Sticker Name *</Label>
                  <Input
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="e.g., Andaman Trip"
                    className="gold-border bg-secondary text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Category *</Label>
                  <Select
                    value={uploadForm.categoryId || undefined}
                    onValueChange={(value) => setUploadForm({ ...uploadForm, categoryId: value })}
                  >
                    <SelectTrigger className="gold-border bg-secondary text-foreground">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-primary">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Description</Label>
                  <Input
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Optional description"
                    className="gold-border bg-secondary text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Image *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="gold-border bg-secondary text-foreground"
                    />
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  {uploadForm.file && (
                    <p className="text-sm text-muted-foreground">{uploadForm.file.name}</p>
                  )}
                </div>

                <Button
                  onClick={handleUpload}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Upload Sticker
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Category Filter */}
        <div className="space-y-2">
          <Label className="text-foreground">Filter by Category</Label>
          <Select value={selectedCategory || undefined} onValueChange={(value) => setSelectedCategory(value === "all" ? undefined : value)}>
            <SelectTrigger className="gold-border bg-secondary text-foreground">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-card border-primary">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stickers Grid */}
        {loading ? (
          <p className="text-center text-muted-foreground">Loading stickers...</p>
        ) : stickers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No stickers found. Upload your first sticker!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stickers.map((sticker) => (
              <div key={sticker.id} className="gold-border bg-card rounded-xl overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={sticker.image_url}
                    alt={sticker.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-semibold text-foreground truncate">{sticker.name}</h3>
                  {sticker.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {sticker.description}
                    </p>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDelete(sticker.id, sticker.image_url)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
