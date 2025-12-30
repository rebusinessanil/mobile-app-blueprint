import { useState } from "react";
import { Plus, Edit, Trash2, Award, Eye, EyeOff, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRanks } from "@/hooks/useTemplates";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";
import { AdminGuard } from "@/components/AdminGuard";
import { Badge } from "@/components/ui/badge";

export default function AdminRanks() {
  const { ranks, loading, refetch } = useRanks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    color: "",
    gradient: "",
    icon: "",
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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
        toast.success("Rank updated");
      } else {
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
        toast.success("Rank created");
      }

      refetch();
      setIsDialogOpen(false);
      setFormData({ name: "", color: "", gradient: "", icon: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to save rank");
    }
  };

  const handleDelete = async (rankId: string) => {
    if (!confirm("Are you sure? This will affect all linked templates.")) return;

    try {
      const { error } = await supabase.from("ranks").delete().eq("id", rankId);
      if (error) throw error;
      toast.success("Rank deleted");
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
      toast.success(`Rank ${!isActive ? "activated" : "deactivated"}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update rank status");
    }
  };

  const filteredRanks = ranks.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRanks = ranks.filter(r => r.is_active).length;
  const inactiveRanks = ranks.length - activeRanks;

  if (loading) {
    return (
      <AdminGuard>
        <PremiumGlobalLoader message="Loading ranks..." />
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <AdminHeader 
          title="Ranks" 
          subtitle={`${ranks.length} ranks`} 
          onRefresh={handleRefresh} 
          isRefreshing={refreshing} 
        />
        
        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <AdminStatsCard 
              icon={<Award className="w-5 h-5" />} 
              value={ranks.length} 
              label="Total Ranks" 
            />
            <AdminStatsCard 
              icon={<Eye className="w-5 h-5" />} 
              value={activeRanks} 
              label="Active" 
              iconColor="text-green-500"
            />
            <AdminStatsCard 
              icon={<EyeOff className="w-5 h-5" />} 
              value={inactiveRanks} 
              label="Inactive" 
              iconColor="text-muted-foreground"
            />
            <AdminStatsCard 
              icon={<Star className="w-5 h-5" />} 
              value={ranks[0]?.name || "-"} 
              label="Top Rank" 
              iconColor="text-primary"
            />
          </div>

          {/* Search + Add */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search ranks..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10 bg-card border-primary/20" 
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" onClick={() => handleOpenDialog()}>
                  <Plus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/20 max-w-sm">
                <DialogHeader>
                  <DialogTitle>{editingRank ? "Edit Rank" : "Create New Rank"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Rank Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Diamond"
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color (Tailwind) *</Label>
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="e.g., from-blue-500 to-blue-700"
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gradient *</Label>
                    <Input
                      value={formData.gradient}
                      onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                      placeholder="e.g., bg-gradient-to-br from-blue-500 to-blue-700"
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon Emoji *</Label>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="e.g., 💎"
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <Button onClick={handleSave} className="w-full">
                    {editingRank ? "Update Rank" : "Create Rank"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Ranks List */}
          <div className="grid grid-cols-1 gap-3">
            {filteredRanks.map((rank) => (
              <div 
                key={rank.id} 
                className={`bg-card border rounded-xl p-3 transition-all ${
                  rank.is_active ? 'border-primary/20 hover:border-primary/40' : 'border-muted opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-xl ${rank.gradient} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-3xl">{rank.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{rank.name}</h3>
                      {rank.is_active ? (
                        <Badge className="bg-green-500/20 text-green-500 text-[10px] px-1.5 py-0">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{rank.color}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(rank)}
                    >
                      <Edit className="w-4 h-4 text-primary" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(rank.id, rank.is_active)}
                    >
                      {rank.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(rank.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
