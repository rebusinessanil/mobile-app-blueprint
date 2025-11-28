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
import { Plus, Trash2, Edit, Eye, EyeOff, RefreshCw, Sparkles, Calendar, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

type StoryType = "event" | "festival";

export default function AdminStories() {
  const { stories: generatedStories, loading: generatedLoading, refetch: refetchGenerated } = useGeneratedStories();
  const { events, loading: eventsLoading, refetch: refetchEvents } = useStoriesEvents();
  const { festivals, loading: festivalsLoading, refetch: refetchFestivals } = useStoriesFestivals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [editingType, setEditingType] = useState<StoryType>("event");
  const [activeTab, setActiveTab] = useState<"events" | "festivals" | "generated">("events");
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

  const activeGenerated = generatedStories.filter((s) => s.status === "active").length;
  const previewGenerated = generatedStories.filter((s) => s.status === "preview_only").length;
  const totalStories = events.length + festivals.length + generatedStories.length;

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 space-y-6 px-6 py-6">
          {/* Title and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Stories Management</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage manual stories & auto-generated daily stories
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  refetchEvents();
                  refetchFestivals();
                  refetchGenerated();
                }} 
                variant="outline" 
                size="icon"
                className="h-10 w-10"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button 
                onClick={handleGenerateTestStories} 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                disabled={isGenerating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Auto Generate"}
              </Button>
              <Button 
                onClick={() => handleOpenDialog(undefined, "event")}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Story
              </Button>
            </div>
          </div>

          {/* Stats Summary Bar */}
          <div className="grid grid-cols-4 gap-4">
            <div className="gold-border bg-card rounded-xl p-4 shadow-lg">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Stories</p>
              <p className="text-3xl font-bold text-primary mt-2">{totalStories}</p>
              <p className="text-xs text-muted-foreground mt-1">All active + preview</p>
            </div>
            <div className="gold-border bg-card rounded-xl p-4 shadow-lg">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-wide">Active Generated</p>
              <p className="text-3xl font-bold text-green-500 mt-2">{activeGenerated}</p>
              <p className="text-xs text-muted-foreground mt-1">Live now</p>
            </div>
            <div className="gold-border bg-card rounded-xl p-4 shadow-lg">
              <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wide">Preview Stories</p>
              <p className="text-3xl font-bold text-yellow-500 mt-2">{previewGenerated}</p>
              <p className="text-xs text-muted-foreground mt-1">Coming tomorrow</p>
            </div>
            <div className="gold-border bg-card rounded-xl p-4 shadow-lg">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Source Data</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{events.length + festivals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Events & festivals</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveTab("events")}
              variant={activeTab === "events" ? "default" : "outline"}
              className={activeTab === "events" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
            >
              Events ({events.length})
            </Button>
            <Button
              onClick={() => setActiveTab("festivals")}
              variant={activeTab === "festivals" ? "default" : "outline"}
              className={activeTab === "festivals" ? "bg-purple-500 hover:bg-purple-600 text-white" : ""}
            >
              Festivals ({festivals.length})
            </Button>
            <Button
              onClick={() => setActiveTab("generated")}
              variant={activeTab === "generated" ? "default" : "outline"}
              className={activeTab === "generated" ? "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white" : ""}
            >
              Auto-Generated ({generatedStories.length})
            </Button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading stories...</div>
          ) : (
            <>
              {/* Events Tab */}
              {activeTab === "events" && (
                <>
                  {events.length === 0 ? (
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="gold-border bg-card rounded-2xl overflow-hidden hover:gold-glow transition-all shadow-lg group"
                        >
                          {/* Image */}
                          <div className="relative w-full aspect-square bg-muted">
                            <img
                              src={event.poster_url}
                              alt={event.person_name}
                              className="w-full h-full object-cover"
                            />
                            {/* Status Indicator */}
                            <div className="absolute top-2 right-2">
                              {(event.is_active ?? true) ? (
                                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg" />
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-gray-500/90 text-white">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            {/* Category Label */}
                            <Badge 
                              className="absolute bottom-2 left-2 text-xs bg-blue-500/90 text-white"
                            >
                              {event.event_type}
                            </Badge>
                          </div>
                          
                          {/* Content */}
                          <div className="p-3">
                            <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                              {event.person_name}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                              {new Date(event.event_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            
                            {/* Actions */}
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => handleOpenDialog(event, "event")}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(event.id, "event")}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(event.id, event.is_active ?? true, "event")}
                                className="h-8 w-8 p-0"
                              >
                                {(event.is_active ?? true) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Festivals Tab */}
              {activeTab === "festivals" && (
                <>
                  {festivals.length === 0 ? (
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {festivals.map((festival) => (
                        <div
                          key={festival.id}
                          className="gold-border bg-card rounded-2xl overflow-hidden hover:gold-glow transition-all shadow-lg group"
                        >
                          {/* Image */}
                          <div className="relative w-full aspect-square bg-muted">
                            <img
                              src={festival.poster_url}
                              alt={festival.festival_name}
                              className="w-full h-full object-cover"
                            />
                            {/* Status Indicator */}
                            <div className="absolute top-2 right-2">
                              {festival.is_active ? (
                                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg" />
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-gray-500/90 text-white">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            {/* Category Label */}
                            <Badge 
                              className="absolute bottom-2 left-2 text-xs bg-purple-500/90 text-white"
                            >
                              Festival
                            </Badge>
                          </div>
                          
                          {/* Content */}
                          <div className="p-3">
                            <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
                              {festival.festival_name}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                              {new Date(festival.festival_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            
                            {/* Actions */}
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => handleOpenDialog(festival, "festival")}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(festival.id, "festival")}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(festival.id, festival.is_active ?? true, "festival")}
                                className="h-8 w-8 p-0"
                              >
                                {festival.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Auto-Generated Tab */}
              {activeTab === "generated" && (
                <>
                  {generatedStories.length === 0 ? (
                    <div className="gold-border bg-card rounded-xl p-12 text-center">
                      <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Generated Stories</h3>
                      <p className="text-muted-foreground mb-6">
                        Click "Auto Generate" to create stories from your events and festivals
                      </p>
                      <Button onClick={handleGenerateTestStories} disabled={isGenerating}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {isGenerating ? "Generating..." : "Auto Generate"}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {generatedStories.map((story) => (
                        <div
                          key={story.id}
                          className="gold-border bg-card rounded-2xl overflow-hidden hover:gold-glow transition-all shadow-lg group"
                        >
                          {/* Image */}
                          <div className="relative w-full aspect-square bg-muted">
                            <img
                              src={story.poster_url}
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                            {/* Status Badge Overlay */}
                            {story.status === "preview_only" && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="secondary" className="text-xs px-2 py-1 bg-yellow-500/90 text-white">
                                  Tomorrow
                                </Badge>
                              </div>
                            )}
                            {/* Status Indicator */}
                            <div className="absolute top-2 right-2">
                              {story.status === "active" ? (
                                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg" />
                              ) : (
                                <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-lg" />
                              )}
                            </div>
                            {/* Category Label */}
                            <Badge 
                              className="absolute bottom-2 left-2 text-xs bg-gradient-to-r from-green-500 to-teal-500 text-white"
                            >
                              {story.source_type}
                            </Badge>
                          </div>
                          
                          {/* Content */}
                          <div className="p-3">
                            <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">
                              {story.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(story.event_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Full-Screen Create/Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingStory ? "Edit Story" : "Create New Story"}
            </DialogTitle>
            <DialogDescription>
              {formData.story_type === "event" 
                ? "Add event details to generate personalized birthday or anniversary stories"
                : "Add festival details to generate celebratory stories"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Story Type */}
            <div className="space-y-2">
              <Label>Story Type *</Label>
              <Select
                value={formData.story_type}
                onValueChange={(value: StoryType) => {
                  setFormData({ ...formData, story_type: value });
                }}
                disabled={!!editingStory}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Event (Birthday/Anniversary)</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event Fields */}
            {formData.story_type === "event" && (
              <>
                <div className="space-y-2">
                  <Label>Event Type *</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value: "birthday" | "anniversary") => {
                      setFormData({ ...formData, event_type: value });
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Person Name *</Label>
                  <Input
                    value={formData.person_name}
                    onChange={(e) =>
                      setFormData({ ...formData, person_name: e.target.value })
                    }
                    placeholder="Enter person's name"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Event Date *</Label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData({ ...formData, event_date: e.target.value })
                    }
                    className="bg-background"
                  />
                </div>
              </>
            )}

            {/* Festival Fields */}
            {formData.story_type === "festival" && (
              <>
                <div className="space-y-2">
                  <Label>Festival Name *</Label>
                  <Input
                    value={formData.festival_name}
                    onChange={(e) =>
                      setFormData({ ...formData, festival_name: e.target.value })
                    }
                    placeholder="Enter festival name"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Festival Date *</Label>
                  <Input
                    type="date"
                    value={formData.festival_date}
                    onChange={(e) =>
                      setFormData({ ...formData, festival_date: e.target.value })
                    }
                    className="bg-background"
                  />
                </div>
              </>
            )}

            {/* Common Fields */}
            <div className="space-y-2">
              <Label>Title (Optional)</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Auto-generated if left empty"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Additional details"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label>Poster Image *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                className="bg-background"
              />
              {editingStory?.poster_url && !posterFile && (
                <p className="text-xs text-muted-foreground">
                  Current poster will be kept if no new file is selected
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label className="cursor-pointer">Active</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {editingStory ? "Update Story" : "Create Story"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
