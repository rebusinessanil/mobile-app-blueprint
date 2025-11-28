import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/admin/AdminLayout";
import { useTemplateCategories } from "@/hooks/useTemplates";
import { AdminGuard } from "@/components/AdminGuard";
import { useStoriesFestivals } from "@/hooks/useAutoStories";
import { useStoriesEvents } from "@/hooks/useStoriesEvents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminStoriesEvents() {
  const { stories, loading, refetch } = useStoriesEvents();
  const { categories } = useTemplateCategories();
  const { festivals } = useStoriesFestivals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    story_type: "event" as "festival" | "category" | "event" | "offer",
    festival_id: undefined as string | undefined,
    category_id: undefined as string | undefined,
    priority: 0,
    is_active: true,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleOpenDialog = (story?: any) => {
    if (story) {
      setEditingStory(story);
      setFormData({
        title: story.title,
        story_type: story.story_type || "event",
        festival_id: story.festival_id || undefined,
        category_id: story.category_id || undefined,
        priority: story.priority || 0,
        is_active: story.is_active,
        start_date: story.start_date,
        end_date: story.end_date,
      });
    } else {
      setEditingStory(null);
      setFormData({
        title: "",
        story_type: "event",
        festival_id: undefined,
        category_id: undefined,
        priority: 0,
        is_active: true,
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
    }
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("template-covers")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("template-covers")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSave = async () => {
    try {
      if (!formData.title) {
        toast.error("Title is required");
        return;
      }

      if (!editingStory && !imageFile) {
        toast.error("Story image is required");
        return;
      }

      let imageUrl = editingStory?.image_url || "";

      if (imageFile) {
        imageUrl = await uploadFile(imageFile);
      }

      const storyData = {
        title: formData.title,
        image_url: imageUrl,
        story_type: formData.story_type,
        festival_id: formData.festival_id || null,
        category_id: formData.category_id || null,
        priority: formData.priority,
        is_active: formData.is_active,
        start_date: formData.start_date,
        end_date: formData.end_date,
        poster_url: imageUrl, // Keep backward compatibility
        event_date: formData.start_date, // Use start_date as event_date for compatibility
        event_type: formData.story_type, // Map story_type to event_type
        person_name: formData.title, // Use title as person_name for compatibility
      };

      if (editingStory) {
        const { error } = await supabase
          .from("stories_events")
          .update(storyData)
          .eq("id", editingStory.id);

        if (error) throw error;
        toast.success("Story updated successfully");
      } else {
        const { error } = await supabase
          .from("stories_events")
          .insert([storyData]);

        if (error) throw error;
        toast.success("Story created successfully");
      }

      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error("Failed to save story: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;

    try {
      const { error } = await supabase
        .from("stories_events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Story deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error("Failed to delete story: " + error.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("stories_events")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success("Story status updated");
      refetch();
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Stories Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage unified stories for Dashboard (16-slot max display)
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Story
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="gold-border bg-card rounded-xl p-6">
              <p className="text-sm text-muted-foreground">Total Stories</p>
              <p className="text-3xl font-bold text-primary mt-2">{stories.length}</p>
            </div>
            <div className="gold-border bg-card rounded-xl p-6">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-bold text-primary mt-2">
                {stories.filter((s) => s.is_active).length}
              </p>
            </div>
            <div className="gold-border bg-card rounded-xl p-6">
              <p className="text-sm text-muted-foreground">Festival Stories</p>
              <p className="text-3xl font-bold text-primary mt-2">
                {stories.filter((s) => s.story_type === "festival").length}
              </p>
            </div>
            <div className="gold-border bg-card rounded-xl p-6">
              <p className="text-sm text-muted-foreground">Category Stories</p>
              <p className="text-3xl font-bold text-primary mt-2">
                {stories.filter((s) => s.story_type === "category").length}
              </p>
            </div>
          </div>

          {/* Stories List */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : stories.length === 0 ? (
            <div className="gold-border bg-card rounded-xl p-12 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">No Stories Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first story to display on Dashboard
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Story
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="gold-border bg-card rounded-xl overflow-hidden hover:gold-glow transition-all"
                >
                  <div className="relative aspect-square bg-muted">
                    <img
                      src={story.image_url}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                    {!story.is_active && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <EyeOff className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                        {story.story_type}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
                        Priority: {story.priority}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-2 truncate">{story.title}</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {new Date(story.start_date).toLocaleDateString()} - {new Date(story.end_date).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenDialog(story)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(story.id, story.is_active)}
                      >
                        {story.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(story.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStory ? "Edit Story" : "Create Story"}</DialogTitle>
                <DialogDescription>
                  {editingStory ? "Update story details" : "Add a new story to the Dashboard"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Story title"
                  />
                </div>
                <div>
                  <Label>Story Type *</Label>
                  <Select
                    value={formData.story_type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, story_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="festival">Festival</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.story_type === "festival" && (
                  <div>
                    <Label>Festival</Label>
                    <Select
                      value={formData.festival_id || undefined}
                      onValueChange={(value) =>
                        setFormData({ ...formData, festival_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select festival" />
                      </SelectTrigger>
                      <SelectContent>
                        {festivals.map((festival) => (
                          <SelectItem key={festival.id} value={festival.id}>
                            {festival.festival_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.story_type === "category" && (
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category_id || undefined}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Priority (higher = shows first)</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Story Image *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {editingStory && !imageFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to keep current image
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  {editingStory ? "Update" : "Create"} Story
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
