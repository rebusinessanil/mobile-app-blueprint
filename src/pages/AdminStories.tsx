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
import { Plus, Trash2, Edit, Eye, EyeOff, RefreshCw, Sparkles, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/admin/AdminLayout";
import { useGeneratedStories, useStoriesEvents, useStoriesFestivals } from "@/hooks/useAutoStories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StoryType = "event" | "festival";

export default function AdminStories() {
  const { stories: generatedStories, loading: generatedLoading, refetch: refetchGenerated } = useGeneratedStories();
  const { events, loading: eventsLoading, refetch: refetchEvents } = useStoriesEvents();
  const { festivals, loading: festivalsLoading, refetch: refetchFestivals } = useStoriesFestivals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [editingType, setEditingType] = useState<StoryType>("event");
  const [formData, setFormData] = useState({
    title: "",
    story_type: "event" as StoryType,
    event_type: "birthday" as "birthday" | "anniversary",
    event_date: "",
    person_name: "",
    festival_name: "",
    festival_date: "",
    description: "",
    is_active: true,
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);

  const loading = generatedLoading || eventsLoading || festivalsLoading;

  const handleOpenDialog = (story?: any, type?: StoryType) => {
    if (story) {
      setEditingStory(story);
      setEditingType(type || "event");
      if (type === "event") {
        setFormData({
          title: story.title || "",
          story_type: "event",
          event_type: story.event_type || "birthday",
          event_date: story.event_date || "",
          person_name: story.person_name || "",
          festival_name: "",
          festival_date: "",
          description: story.description || "",
          is_active: story.is_active ?? true,
        });
      } else {
        setFormData({
          title: story.festival_name || "",
          story_type: "festival",
          event_type: "birthday",
          event_date: "",
          person_name: "",
          festival_name: story.festival_name || "",
          festival_date: story.festival_date || "",
          description: story.description || "",
          is_active: story.is_active ?? true,
        });
      }
    } else {
      setEditingStory(null);
      setEditingType(type || "event");
      setFormData({
        title: "",
        story_type: type || "event",
        event_type: "birthday",
        event_date: "",
        person_name: "",
        festival_name: "",
        festival_date: "",
        description: "",
        is_active: true,
      });
    }
    setPosterFile(null);
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
      if (formData.story_type === "event") {
        if (!formData.person_name || !formData.event_date) {
          toast.error("Person name and event date are required");
          return;
        }
      } else {
        if (!formData.festival_name || !formData.festival_date) {
          toast.error("Festival name and date are required");
          return;
        }
      }

      if (!editingStory && !posterFile) {
        toast.error("Poster image is required");
        return;
      }

      let posterUrl = editingStory?.poster_url || "";

      if (posterFile) {
        posterUrl = await uploadFile(posterFile, "template-covers");
      }

      if (formData.story_type === "event") {
        const eventData = {
          event_type: formData.event_type,
          event_date: formData.event_date,
          person_name: formData.person_name,
          poster_url: posterUrl,
          description: formData.description || null,
          title: formData.title || `${formData.event_type} - ${formData.person_name}`,
          is_active: formData.is_active,
        };

        if (editingStory) {
          const { error } = await supabase
            .from("stories_events")
            .update(eventData)
            .eq("id", editingStory.id);

          if (error) throw error;
          toast.success("Event story updated successfully");
        } else {
          const { error } = await supabase
            .from("stories_events")
            .insert([eventData]);

          if (error) throw error;
          toast.success("Event story created successfully");
        }
        refetchEvents();
      } else {
        const festivalData = {
          festival_name: formData.festival_name,
          festival_date: formData.festival_date,
          poster_url: posterUrl,
          description: formData.description || null,
          is_active: formData.is_active,
        };

        if (editingStory) {
          const { error } = await supabase
            .from("stories_festivals")
            .update(festivalData)
            .eq("id", editingStory.id);

          if (error) throw error;
          toast.success("Festival story updated successfully");
        } else {
          const { error } = await supabase
            .from("stories_festivals")
            .insert([festivalData]);

          if (error) throw error;
          toast.success("Festival story created successfully");
        }
        refetchFestivals();
      }

      setIsDialogOpen(false);
      refetchGenerated();
    } catch (error: any) {
      toast.error("Failed to save story: " + error.message);
    }
  };

  const handleDelete = async (id: string, type: StoryType) => {
    if (!confirm("Are you sure you want to delete this story?")) return;

    try {
      const table = type === "event" ? "stories_events" : "stories_festivals";
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Story deleted successfully");
      if (type === "event") {
        refetchEvents();
      } else {
        refetchFestivals();
      }
      refetchGenerated();
    } catch (error: any) {
      toast.error("Failed to delete story: " + error.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, type: StoryType) => {
    try {
      const table = type === "event" ? "stories_events" : "stories_festivals";
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success("Story status updated");
      if (type === "event") {
        refetchEvents();
      } else {
        refetchFestivals();
      }
      refetchGenerated();
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
            <Button onClick={() => {
              refetchEvents();
              refetchFestivals();
              refetchGenerated();
            }} variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={handleGenerateTestStories} variant="secondary" disabled={isGenerating}>
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Create Test Stories"}
            </Button>
            <Button onClick={() => handleOpenDialog(undefined, "event")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Event/Festival
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="gold-border bg-card rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Total Stories</p>
            <p className="text-3xl font-bold text-primary mt-2">
              {events.length + festivals.length + generatedStories.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {events.length} events + {festivals.length} festivals + {generatedStories.length} auto
            </p>
          </div>
          <div className="gold-border bg-card rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Active Generated</p>
            <p className="text-3xl font-bold text-green-500 mt-2">
              {generatedStories.filter((s) => s.status === "active").length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Live on dashboard now
            </p>
          </div>
          <div className="gold-border bg-card rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Preview Stories</p>
            <p className="text-3xl font-bold text-yellow-500 mt-2">
              {generatedStories.filter((s) => s.status === "preview_only").length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Coming tomorrow
            </p>
          </div>
          <div className="gold-border bg-card rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Source Data</p>
            <p className="text-3xl font-bold text-primary mt-2">
              {events.length + festivals.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Events & festivals configured
            </p>
          </div>
        </div>

        {/* Stories Tabs */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="festivals">Festivals</TabsTrigger>
            <TabsTrigger value="generated">Auto-Generated Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : events.length === 0 ? (
              <div className="gold-border bg-card rounded-xl p-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Events Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first event (birthday/anniversary) to generate stories
                </p>
                <Button onClick={() => handleOpenDialog(undefined, "event")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="gold-border bg-card rounded-xl overflow-hidden hover:gold-glow transition-all"
                  >
                    <div className="relative aspect-[9/16] bg-muted">
                      <img
                        src={event.poster_url}
                        alt={event.person_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">{event.person_name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Type: {event.event_type}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Date: {new Date(event.event_date).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenDialog(event, "event")}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id, "event")}
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

          <TabsContent value="festivals" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : festivals.length === 0 ? (
              <div className="gold-border bg-card rounded-xl p-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Festivals Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first festival to generate stories
                </p>
                <Button onClick={() => handleOpenDialog(undefined, "festival")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Festival
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {festivals.map((festival) => (
                  <div
                    key={festival.id}
                    className="gold-border bg-card rounded-xl overflow-hidden hover:gold-glow transition-all"
                  >
                    <div className="relative aspect-[9/16] bg-muted">
                      <img
                        src={festival.poster_url}
                        alt={festival.festival_name}
                        className="w-full h-full object-cover"
                      />
                      {!festival.is_active && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <EyeOff className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">{festival.festival_name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Status: {festival.is_active ? "Active" : "Inactive"}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Date: {new Date(festival.festival_date).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenDialog(festival, "festival")}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(festival.id, festival.is_active, "festival")}
                        >
                          {festival.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(festival.id, "festival")}
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
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStory ? "Edit" : "Create"} {formData.story_type === "event" ? "Event" : "Festival"}
              </DialogTitle>
              <DialogDescription>
                {editingStory ? "Update" : "Add a new"} {formData.story_type === "event" ? "birthday/anniversary event" : "festival"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Story Type</Label>
                <Select
                  value={formData.story_type}
                  onValueChange={(value: StoryType) =>
                    setFormData({ ...formData, story_type: value })
                  }
                  disabled={!!editingStory}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event (Birthday/Anniversary)</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.story_type === "event" ? (
                <>
                  <div>
                    <Label>Event Type</Label>
                    <Select
                      value={formData.event_type}
                      onValueChange={(value: "birthday" | "anniversary") =>
                        setFormData({ ...formData, event_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="anniversary">Anniversary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Person Name*</Label>
                    <Input
                      value={formData.person_name}
                      onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                      placeholder="Enter person name"
                    />
                  </div>
                  <div>
                    <Label>Event Date*</Label>
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Festival Name*</Label>
                    <Input
                      value={formData.festival_name}
                      onChange={(e) => setFormData({ ...formData, festival_name: e.target.value })}
                      placeholder="Enter festival name"
                    />
                  </div>
                  <div>
                    <Label>Festival Date*</Label>
                    <Input
                      type="date"
                      value={formData.festival_date}
                      onChange={(e) => setFormData({ ...formData, festival_date: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Description (Optional)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>

              <div>
                <Label>Poster Image*</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
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
