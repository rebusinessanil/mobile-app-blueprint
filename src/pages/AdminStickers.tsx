import { useState } from "react";
import { Plus, Trash2, Upload, Search, Sticker, Eye, EyeOff, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStickers, useStickerCategories, useAdminStickers } from "@/hooks/useStickers";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import GoldCoinLoader from "@/components/GoldCoinLoader";
import { AdminGuard } from "@/components/AdminGuard";
import { Badge } from "@/components/ui/badge";

export default function AdminStickers() {
  const { categories } = useStickerCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { stickers, loading } = useStickers(selectedCategory);
  const { uploadSticker, deleteSticker } = useAdminStickers();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    categoryId: undefined as string | undefined,
    description: "",
    file: null as File | null,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    window.location.reload();
  };

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

    toast.success("Sticker uploaded");
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

    toast.success("Sticker deleted");
    window.location.reload();
  };

  const filteredStickers = stickers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeStickers = stickers.filter(s => s.is_active !== false).length;

  if (loading && stickers.length === 0) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <GoldCoinLoader size="lg" message="Loading stickers..." />
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <AdminHeader 
          title="Stickers" 
          subtitle={`${stickers.length} stickers`} 
          onRefresh={handleRefresh} 
          isRefreshing={refreshing} 
        />
        
        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <AdminStatsCard 
              icon={<Sticker className="w-5 h-5" />} 
              value={stickers.length} 
              label="Total Stickers" 
            />
            <AdminStatsCard 
              icon={<Layers className="w-5 h-5" />} 
              value={categories.length} 
              label="Categories" 
              iconColor="text-blue-500"
            />
            <AdminStatsCard 
              icon={<Eye className="w-5 h-5" />} 
              value={activeStickers} 
              label="Active" 
              iconColor="text-green-500"
            />
            <AdminStatsCard 
              icon={<Upload className="w-5 h-5" />} 
              value="16" 
              label="Max Slots" 
              iconColor="text-purple-500"
            />
          </div>

          {/* Filter + Add */}
          <div className="flex gap-2">
            <Select value={selectedCategory || undefined} onValueChange={(value) => setSelectedCategory(value === "all" ? undefined : value)}>
              <SelectTrigger className="flex-1 bg-card border-primary/20">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button size="icon">
                  <Plus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/20 max-w-sm">
                <DialogHeader>
                  <DialogTitle>Upload New Sticker</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Sticker Name *</Label>
                    <Input
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                      placeholder="e.g., Gold Star"
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={uploadForm.categoryId || undefined}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, categoryId: value })}
                    >
                      <SelectTrigger className="bg-background border-primary/20">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Optional description"
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image *</Label>
                    <Input type="file" accept="image/*" onChange={handleFileChange} className="bg-background border-primary/20" />
                    {uploadForm.file && (
                      <p className="text-xs text-muted-foreground">{uploadForm.file.name}</p>
                    )}
                  </div>
                  <Button onClick={handleUpload} className="w-full">Upload Sticker</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search stickers..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10 bg-card border-primary/20" 
            />
          </div>

          {/* Stickers Grid */}
          {filteredStickers.length === 0 ? (
            <div className="text-center py-12">
              <Sticker className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No stickers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredStickers.map((sticker) => (
                <div key={sticker.id} className="bg-card border border-primary/20 rounded-xl overflow-hidden hover:border-primary/40 transition-all">
                  <div className="aspect-square relative bg-muted">
                    <img
                      src={sticker.image_url}
                      alt={sticker.name}
                      className="w-full h-full object-cover"
                    />
                    {sticker.is_active === false && (
                      <Badge className="absolute top-2 left-2 bg-muted text-muted-foreground text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm truncate">{sticker.name}</h3>
                    {sticker.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{sticker.description}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
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
      </AdminLayout>
    </AdminGuard>
  );
}
