import { useState } from "react";
import { Plus, X, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

interface UplineCarouselProps {
  uplines: Upline[];
  onUplinesChange: (uplines: Upline[]) => void;
}

export default function UplineCarousel({ uplines, onUplinesChange }: UplineCarouselProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newUplineName, setNewUplineName] = useState("");

  const handleRemoveUpline = (id: string) => {
    onUplinesChange(uplines.filter(u => u.id !== id));
  };

  const handleAddUpline = () => {
    if (newUplineName.trim()) {
      const newUpline: Upline = {
        id: Date.now().toString(),
        name: newUplineName.trim(),
      };
      onUplinesChange([...uplines, newUpline]);
      setNewUplineName("");
      setAddModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {uplines.map((upline) => (
          <div key={upline.id} className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full gold-border bg-secondary flex items-center justify-center overflow-hidden">
              {upline.avatar ? (
                <img src={upline.avatar} alt={upline.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <button
              onClick={() => handleRemoveUpline(upline.id)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            <p className="text-xs text-center text-muted-foreground mt-1 max-w-[64px] truncate">
              {upline.name}
            </p>
          </div>
        ))}
        
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex-shrink-0 w-16 h-16 rounded-full gold-border bg-secondary flex items-center justify-center hover:gold-glow transition-all"
        >
          <Plus className="w-8 h-8 text-primary" />
        </button>
      </div>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="bg-card border-2 border-primary max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Upline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter upline name"
              value={newUplineName}
              onChange={(e) => setNewUplineName(e.target.value)}
              className="gold-border bg-secondary text-foreground"
              onKeyDown={(e) => e.key === "Enter" && handleAddUpline()}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setAddModalOpen(false);
                  setNewUplineName("");
                }}
                className="flex-1 border-primary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUpline}
                disabled={!newUplineName.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}