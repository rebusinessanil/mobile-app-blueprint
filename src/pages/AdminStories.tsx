import { useState, useEffect } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Eye, EyeOff, RefreshCw, Sparkles, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/admin/AdminLayout";
import { useStories, useTemplateCategories } from "@/hooks/useTemplates";
import { useGeneratedStories } from "@/hooks/useAutoStories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminStories() {
  const { stories, loading, refetch } = useStories();
  const { stories: generatedStories, refetch: refetchGenerated } = useGeneratedStories();
  const { categories } = useTemplateCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    category_id: undefined as string | undefined,
    type: "image" as "image" | "video",
    is_active: true,
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);

  const handleOpenDialog = (story?: any) => {
    if (story) {
      setEditingStory(story);
      setFormData({
        title: story.title,
        category_id: story.category_id || undefined,
        type: story.type || "image",
        is_active: story.is_active,
      });
    } else {
      setEditingStory(null);
      setFormData({
        title: "",
        category_id: undefined,
        type: "image",
        is_active: true,
      });
    }
    setCoverFile(null);
    setContentFile(null);
    setIsDialogOpen(true);
  };

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSave = async () => {
    try {
      if (!formData.title) {
        toast.error("Title is required");
        return;
      }

      if (!editingStory && !coverFile) {
        toast.error("Cover image is required");
        return;
      }

      let coverUrl = editingStory?.cover_image_url || "";
      let contentUrl = editingStory?.content_url || "";

      if (coverFile) {
        coverUrl = await uploadFile(coverFile, "template-covers");
      }

      if (contentFile) {
        contentUrl = await uploadFile(contentFile, "template-covers");
      }

      const storyData = {
        title: formData.title,
        category_id: formData.category_id || null,
        type: formData.type,
        cover_image_url: coverUrl,
        content_url: contentUrl || null,
        is_active: formData.is_active,
      };

      if (editingStory) {
        const { error } = await supabase
          .from("stories")
          .update(storyData)
          .eq("id", editingStory.id);

        if (error) throw error;
        toast.success("Story updated successfully");
      } else {
        const { error } = await supabase
          .from("stories")
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
        .from("stories")
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
        .from("stories")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success("Story status updated");
      refetch();
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const handleGenerateTestStories = async () => {
    try {
      setIsGenerating(true);
      toast.info("Generating test stories...");

      const { data, error } = await supabase.functions.invoke('auto-story-generator', {
        body: {}
      });

      if (error) throw error;

      toast.success(`Test stories generated successfully! ${data?.stats?.tomorrowEvents || 0} events, ${data?.stats?.tomorrowFestivals || 0} festivals`);
      refetchGenerated();
    } catch (error: any) {
      toast.error("Failed to generate test stories: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stories Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage manual stories & auto-generated daily stories
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={handleGenerateTestStories} variant="secondary" disabled={isGenerating}>
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Create Test Stories"}
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
            <p className="text-sm text-muted-foreground">Manual Stories</p>
            <p className="text-3xl font-bold text-primary mt-2">{stories.length}</p>
          </div>
          <div className="gold-border bg-card rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Active Manual</p>
            <p className="text-3xl font-bold text-primary mt-2">
              {stories.filter((s) => s.is_active).length}
            </p>
          </div>
          <div className="gold-border bg-card rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Generated Stories</p>
            <p className="text-3xl font-bold text-primary mt-2">
              {generatedStories.length}
            </p>
          </div>
          <div className="gold-border bg-card rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Active Generated</p>
            <p className="text-3xl font-bold text-primary mt-2">
              {generatedStories.filter((s) => s.status === "active").length}
            </p>
          </div>
        </div>

        {/* Stories Tabs */}
        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manual">Manual Stories</TabsTrigger>
            <TabsTrigger value="generated">Auto-Generated Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : stories.length === 0 ? (
              <div className="gold-border bg-card rounded-xl p-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Manual Stories Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first manual story to get started
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Story
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="gold-border bg-card rounded-xl overflow-hidden hover:gold-glow transition-all"
                  >
                    <div className="relative aspect-[9/16] bg-muted">
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                      {!story.is_active && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <EyeOff className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">{story.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Type: {story.type} • Status: {story.is_active ? "Active" : "Inactive"}
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
          </TabsContent>

          <TabsContent value="generated" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : generatedStories.length === 0 ? (
              <div className="gold-border bg-card rounded-xl p-12 text-center">
                <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Generated Stories Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Click "Create Test Stories" to generate stories from events and festivals
                </p>
                <Button onClick={handleGenerateTestStories} disabled={isGenerating}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Create Test Stories"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedStories.map((story) => (
                  <div
                    key={story.id}
                    className="gold-border bg-card rounded-xl overflow-hidden hover:gold-glow transition-all"
                  >
                    <div className="relative aspect-[9/16] bg-muted">
                      <img
                        src={story.poster_url}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          story.status === 'active' ? 'bg-green-500' : 
                          story.status === 'preview_only' ? 'bg-yellow-500' : 'bg-gray-500'
                        } text-white`}>
                          {story.status === 'active' ? 'Active' : 
                           story.status === 'preview_only' ? 'Preview' : 'Expired'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">{story.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Type: {story.source_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Date: {new Date(story.event_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(story.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingStory ? "Edit Story" : "Create Story"}</DialogTitle>
              <DialogDescription>
                {editingStory ? "Update story details" : "Add a new story to the app"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Story title"
                />
              </div>
              <div>
                <Label>Category (Optional)</Label>
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
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "image" | "video") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cover Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label>Content File (Optional)</Label>
                <Input
                  type="file"
                  accept={formData.type === "video" ? "video/*" : "image/*"}
                  onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                />
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
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingStory ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
