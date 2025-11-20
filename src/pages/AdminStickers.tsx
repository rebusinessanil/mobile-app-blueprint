import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useStickerCategories, useStickers, useAdminStickers } from "@/hooks/useStickers";
import { supabase } from "@/integrations/supabase/client";

interface Rank {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function AdminStickers() {
  const navigate = useNavigate();
  const { categories } = useStickerCategories();
  const [ranks, setRanks] = useState<Rank[]>([]);
  
  // Upload form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rankId, setRankId] = useState("");
  const [slotNumber, setSlotNumber] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Preview state
  const [previewCategoryId, setPreviewCategoryId] = useState("");
  const [previewRankId, setPreviewRankId] = useState("");
  const [previewSlotNumber, setPreviewSlotNumber] = useState("");
  const [previewSticker, setPreviewSticker] = useState<any>(null);
  
  const { stickers, loading } = useStickers(
    previewCategoryId || undefined, 
    previewRankId || undefined, 
    previewSlotNumber ? parseInt(previewSlotNumber) : undefined
  );
  const { uploadSticker, deleteSticker } = useAdminStickers();

  // Fetch ranks
  useEffect(() => {
    const fetchRanks = async () => {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching ranks:', error);
        return;
      }
      setRanks(data || []);
    };
    fetchRanks();
  }, []);

  // Update preview when stickers change
  useEffect(() => {
    if (stickers && stickers.length > 0) {
      setPreviewSticker(stickers[0]);
    } else {
      setPreviewSticker(null);
    }
  }, [stickers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !name || !categoryId || !rankId || !slotNumber) {
      toast.error("Please fill all required fields (category, rank, slot, name, and image)");
      return;
    }

    const slotNum = parseInt(slotNumber);
    if (isNaN(slotNum) || slotNum < 1 || slotNum > 16) {
      toast.error("Slot number must be between 1 and 16");
      return;
    }

    const { data, error } = await uploadSticker(file, name, categoryId, rankId, slotNum, description);

    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return;
    }

    toast.success("Sticker uploaded/updated successfully!");

    // Reset form
    setName("");
    setCategoryId("");
    setRankId("");
    setSlotNumber("");
    setDescription("");
    setFile(null);
    setDialogOpen(false);
    
    // Update preview if same slot
    if (previewCategoryId === categoryId && previewRankId === rankId && previewSlotNumber === slotNumber) {
      setPreviewSticker(data);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this sticker?")) return;

    const { error } = await deleteSticker(id, imageUrl);

    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }

    toast.success("Sticker deleted successfully!");
    
    // Clear preview if deleted
    if (previewSticker?.id === id) {
      setPreviewSticker(null);
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Sticker Management</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Upload className="w-4 h-4 mr-2" />
                Upload Sticker
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/20">
              <DialogHeader>
                <DialogTitle className="text-foreground">Upload New Sticker</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Upload a sticker for a specific category, rank, and slot (1-16)
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-foreground">Category *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="bg-background border-primary/20">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-primary/20">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rank" className="text-foreground">Rank *</Label>
                  <Select value={rankId} onValueChange={setRankId}>
                    <SelectTrigger className="bg-background border-primary/20">
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-primary/20">
                      {ranks.map((rank) => (
                        <SelectItem key={rank.id} value={rank.id}>
                          {rank.icon} {rank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="slot" className="text-foreground">Slot Number (1-16) *</Label>
                  <Input
                    id="slot"
                    type="number"
                    min="1"
                    max="16"
                    value={slotNumber}
                    onChange={(e) => setSlotNumber(e.target.value)}
                    placeholder="Enter slot (1-16)"
                    className="bg-background border-primary/20 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="name" className="text-foreground">Sticker Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter sticker name"
                    className="bg-background border-primary/20 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-foreground">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description"
                    className="bg-background border-primary/20 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="file" className="text-foreground">Sticker Image *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-background border-primary/20 text-foreground"
                  />
                </div>

                <Button onClick={handleUpload} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Upload Sticker
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Preview Section */}
      <div className="px-6 py-6 space-y-6">
        <div className="gold-border bg-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Preview Sticker
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <Label className="text-foreground mb-2 block">Category</Label>
              <Select value={previewCategoryId} onValueChange={setPreviewCategoryId}>
                <SelectTrigger className="bg-background border-primary/20">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground mb-2 block">Rank</Label>
              <Select value={previewRankId} onValueChange={setPreviewRankId}>
                <SelectTrigger className="bg-background border-primary/20">
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  {ranks.map((rank) => (
                    <SelectItem key={rank.id} value={rank.id}>
                      {rank.icon} {rank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground mb-2 block">Slot (1-16)</Label>
              <Input
                type="number"
                min="1"
                max="16"
                value={previewSlotNumber}
                onChange={(e) => setPreviewSlotNumber(e.target.value)}
                placeholder="Slot"
                className="bg-background border-primary/20 text-foreground"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading preview...</div>
          ) : previewSticker ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-primary/20">
                <img
                  src={previewSticker.image_url}
                  alt={previewSticker.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">{previewSticker.name}</h3>
                {previewSticker.description && (
                  <p className="text-sm text-muted-foreground mt-1">{previewSticker.description}</p>
                )}
                <p className="text-xs text-primary mt-2">
                  Slot {previewSticker.slot_number}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(previewSticker.id, previewSticker.image_url)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Sticker
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {previewCategoryId && previewRankId && previewSlotNumber
                ? "No sticker found for this combination"
                : "Select category, rank, and slot to preview"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
