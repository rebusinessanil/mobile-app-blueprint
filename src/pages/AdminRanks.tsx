import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRanks } from "@/hooks/useTemplates";
import { supabase } from "@/integrations/supabase/client";

export default function AdminRanks() {
  const navigate = useNavigate();
  const { ranks, refetch } = useRanks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "",
    gradient: "",
    icon: "",
  });

  const handleOpenDialog = (rank?: any) => {
    if (rank) {
      setEditingRank(rank);
      setFormData({
        name: rank.name,
        color: rank.color,
        gradient: rank.gradient,
        icon: rank.icon,
      });
    } else {
      setEditingRank(null);
      setFormData({ name: "", color: "", gradient: "", icon: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.color || !formData.gradient || !formData.icon) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (editingRank) {
        // Update existing rank
        const { error } = await supabase
          .from("ranks")
          .update({
            name: formData.name,
            color: formData.color,
            gradient: formData.gradient,
            icon: formData.icon,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingRank.id);

        if (error) throw error;
        toast.success("Rank updated successfully!");
      } else {
        // Create new rank
        const { error } = await supabase.from("ranks").insert({
          id: formData.name.toLowerCase().replace(/\s+/g, "-"),
          name: formData.name,
          color: formData.color,
          gradient: formData.gradient,
          icon: formData.icon,
          is_active: true,
          display_order: ranks.length,
        });

        if (error) throw error;
        toast.success("Rank created successfully!");
      }

      refetch();
      setIsDialogOpen(false);
      setFormData({ name: "", color: "", gradient: "", icon: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to save rank");
      console.error(error);
    }
  };

  const handleDelete = async (rankId: string) => {
    if (!confirm("Are you sure you want to delete this rank? This will affect all templates linked to it.")) return;

    try {
      const { error } = await supabase.from("ranks").delete().eq("id", rankId);

      if (error) throw error;
      toast.success("Rank deleted successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete rank");
    }
  };

  const handleToggleActive = async (rankId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("ranks")
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq("id", rankId);

      if (error) throw error;
      toast.success(`Rank ${!isActive ? "activated" : "deactivated"} successfully!`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update rank status");
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-primary">Rank Management</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingRank ? "Edit Rank" : "Create New Rank"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Rank Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Diamond"
                    className="gold-border bg-secondary text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Color (HSL) *</Label>
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., from-blue-500 to-blue-700"
                    className="gold-border bg-secondary text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Gradient (HSL) *</Label>
                  <Input
                    value={formData.gradient}
                    onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                    placeholder="e.g., bg-gradient-to-br from-blue-500 to-blue-700"
                    className="gold-border bg-secondary text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Icon Emoji *</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="e.g., 💎"
                    className="gold-border bg-secondary text-foreground"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {editingRank ? "Update Rank" : "Create Rank"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="px-6 py-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-primary">
            All Ranks ({ranks.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage all ranks. Changes sync instantly across the entire app.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ranks.map((rank) => (
            <div key={rank.id} className="gold-border bg-card rounded-xl overflow-hidden">
              <div className={`aspect-video ${rank.gradient} flex items-center justify-center`}>
                <span className="text-6xl">{rank.icon}</span>
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground truncate">{rank.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{rank.color}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-primary text-primary hover:bg-primary/10"
                    onClick={() => handleOpenDialog(rank)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`flex-1 ${
                      rank.is_active
                        ? "border-primary text-primary hover:bg-primary/10"
                        : "border-muted text-muted-foreground"
                    }`}
                    onClick={() => handleToggleActive(rank.id, rank.is_active)}
                  >
                    {rank.is_active ? "Active" : "Inactive"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(rank.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
