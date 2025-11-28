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
import { Plus, Trash2, Edit, Eye, EyeOff, RefreshCw, Sparkles, Calendar, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/admin/AdminLayout";
import { useStories, useTemplateCategories } from "@/hooks/useTemplates";
import { useGeneratedStories, useStoriesEvents, useStoriesFestivals } from "@/hooks/useAutoStories";
import { AdminGuard } from "@/components/AdminGuard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminStoriesUnified() {
  const { stories, loading, refetch } = useStories();
  const { stories: generatedStories, refetch: refetchGenerated } = useGeneratedStories();
  const { events, refetch: refetchEvents } = useStoriesEvents();
  const { festivals, refetch: refetchFestivals } = useStoriesFestivals();
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

    const { error: uploadError } = await supabase.storage
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

  const handleRunAutoGenerator = async () => {
    try {
      setIsGenerating(true);
      toast.info("Running auto-story generator...");

      const { data, error } = await supabase.functions.invoke('auto-story-generator', {
        body: {}
      });

      if (error) throw error;

      toast.success(`Auto-generation completed! ${data?.stats?.tomorrowEvents || 0} events, ${data?.stats?.tomorrowFestivals || 0} festivals processed`);
      refetchGenerated();
      refetchEvents();
      refetchFestivals();
    } catch (error: any) {
      toast.error("Failed to run auto-generator: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalStories = stories.length + generatedStories.length;
  const activeStories = stories.filter(s => s.is_active).length + 
                       generatedStories.filter(s => s.status === "active").length;
  const previewStories = generatedStories.filter(s => s.status === "preview_only").length;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Stories Management</h1>
              <p className="text-muted-foreground mt-1">
                Unified control for all stories - manual & auto-generated
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={handleRunAutoGenerator} variant="secondary" disabled={isGenerating}>
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Run Auto-Generator"}
              </Button>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Story
              </Button>
            </div>
          </div>

          {/* System Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Auto-generator runs daily at midnight IST. It creates preview stories for tomorrow's events/festivals, 
              activates today's stories, and expires old ones. Manual stories are always under your control.
            </AlertDescription>
          </Alert>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="gold-border bg-card rounded-xl p-6">
              <p className="text-sm text-muted-foreground">Total Stories</p>
              <p className="text-3xl font-bold text-primary mt-2">{totalStories}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stories.length} manual + {generatedStories.length} auto
              </p>
            </div>
            <div className="gold-border bg-card rounded-xl p-6">
              <p className="text-sm text-muted-foreground">Active Stories</p>
              <p className="text-3xl font-bold text-green-500 mt-2">{activeStories}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Live on dashboard now
              </p>
            </div>
            <div className="gold-border bg-card rounded-xl p-6">
              <p className="text-sm text-muted-foreground">Preview Stories</p>
              <p className="text-3xl font-bold text-yellow-500 mt-2">{previewStories}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Coming tomorrow
              </p>
            </div>
            <div className="gold-border bg-card rounded-xl p-6">
              <p className="text-sm text-muted-foreground">Events/Festivals</p>
              <p className="text-3xl font-bold text-primary mt-2">
                {events.length + festivals.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sources for auto-generation
              </p>
            </div>
          </div>

          {/* Stories Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Stories</TabsTrigger>
              <TabsTrigger value="manual">Manual Stories</TabsTrigger>
              <TabsTrigger value="generated">Auto-Generated</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Manual Stories */}
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
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary">Manual</Badge>
                      </div>
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
                          {story.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(story.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Generated Stories */}
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
                      <div className="absolute top-2 left-2">
                        <Badge variant={story.status === "active" ? "default" : "secondary"}>
                          {story.status === "active" ? "Active" : "Preview"}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="bg-black/50">
                          Auto
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">{story.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Type: {story.source_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Event: {new Date(story.event_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(story.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              {stories.length === 0 ? (
                <div className="gold-border bg-card rounded-xl p-12 text-center">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Manual Stories</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first manual story
                  </p>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Story
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
                          {story.type} • {story.is_active ? "Active" : "Inactive"}
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
                            {story.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(story.id)}
                            className="text-destructive"
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
              {generatedStories.length === 0 ? (
                <div className="gold-border bg-card rounded-xl p-12 text-center">
                  <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Generated Stories</h3>
                  <p className="text-muted-foreground mb-6">
                    Run the auto-generator to create stories from events and festivals
                  </p>
                  <Button onClick={handleRunAutoGenerator} disabled={isGenerating}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isGenerating ? "Generating..." : "Run Auto-Generator"}
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
                          <Badge variant={story.status === "active" ? "default" : "secondary"}>
                            {story.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground mb-2">{story.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Source: {story.source_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Event: {new Date(story.event_date).toLocaleDateString()}
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
                <DialogTitle>{editingStory ? "Edit Story" : "Create Manual Story"}</DialogTitle>
                <DialogDescription>
                  {editingStory ? "Update story details" : "Add a new manual story"}
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
    </AdminGuard>
  );
}
