import { useState } from "react";
import { Plus, Pencil, Trash2, Image as ImageIcon, Plane } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAllBonanzaTrips, useCreateBonanzaTrip, useUpdateBonanzaTrip, useDeleteBonanzaTrip, BonanzaTrip } from "@/hooks/useBonanzaTrips";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminBonanzaTrips() {
  const { data: trips = [], isLoading } = useAllBonanzaTrips();
  const createMutation = useCreateBonanzaTrip();
  const updateMutation = useUpdateBonanzaTrip();
  const deleteMutation = useDeleteBonanzaTrip();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<BonanzaTrip | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    short_title: "",
    trip_image_url: "",
    description: "",
    display_order: 0,
    is_active: true,
  });

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `bonanza-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('template-covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('template-covers')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, trip_image_url: publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.trip_image_url) {
      toast.error("Title and image are required");
      return;
    }

    try {
      if (editingTrip) {
        await updateMutation.mutateAsync({
          id: editingTrip.id,
          ...formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving trip:", error);
    }
  };

  const handleEdit = (trip: BonanzaTrip) => {
    setEditingTrip(trip);
    setFormData({
      title: trip.title,
      short_title: trip.short_title || "",
      trip_image_url: trip.trip_image_url,
      description: trip.description || "",
      display_order: trip.display_order,
      is_active: trip.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTrip(null);
    setFormData({
      title: "",
      short_title: "",
      trip_image_url: "",
      description: "",
      display_order: 0,
      is_active: true,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Plane className="w-8 h-8 text-primary" />
              Bonanza Trips Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage trip banners and destinations
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTrip(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTrip ? "Edit Trip" : "Add New Trip"}</DialogTitle>
                <DialogDescription>
                  {editingTrip ? "Update trip details" : "Create a new bonanza trip banner"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Trip Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Jaisalmer Trip"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="short_title">Short Title</Label>
                    <Input
                      id="short_title"
                      value={formData.short_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, short_title: e.target.value }))}
                      placeholder="e.g., Jaisalmer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the trip"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="trip_image">Trip Banner Image *</Label>
                    <div className="mt-2 space-y-4">
                      {formData.trip_image_url && (
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-primary/20">
                          <img
                            src={formData.trip_image_url}
                            alt="Trip banner preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <Input
                        id="trip_image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        disabled={isUploading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_active">Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Show this trip in the user interface
                      </p>
                    </div>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading || createMutation.isPending || updateMutation.isPending}>
                    {isUploading ? "Uploading..." : editingTrip ? "Update Trip" : "Create Trip"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading trips...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="overflow-hidden">
                <div className="aspect-[3/4] relative">
                  <img
                    src={trip.trip_image_url}
                    alt={trip.title}
                    className="w-full h-full object-cover"
                  />
                  {!trip.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">Inactive</span>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{trip.title}</span>
                    {trip.is_active && (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded-full">
                        Active
                      </span>
                    )}
                  </CardTitle>
                  {trip.description && (
                    <CardDescription>{trip.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(trip)}
                      className="flex-1"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(trip.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {trips.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Plane className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-4">No trips created yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Trip
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
