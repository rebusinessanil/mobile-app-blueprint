import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Settings, Calendar, Sparkles, MoreVertical, Eye, EyeOff, Upload, Image, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useGeneratedStories, useStoriesEvents, useStoriesFestivals } from "@/hooks/useAutoStories";
import { useStoryBackgroundSlots, uploadStoryBackgroundSlot, removeStoryBackgroundSlot, toggleStoryBackgroundSlotActive } from "@/hooks/useStoryBackgroundSlots";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StoryType = "event" | "festival";
type TabType = "events" | "festivals" | "generated" | "backgrounds";

export default function AdminStories() {
  const {
    stories: generatedStories,
    loading: generatedLoading,
    refetch: refetchGenerated
  } = useGeneratedStories();
  const {
    events,
    loading: eventsLoading,
    refetch: refetchEvents
  } = useStoriesEvents();
  const {
    festivals,
    loading: festivalsLoading,
    refetch: refetchFestivals
  } = useStoriesFestivals();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [editingType, setEditingType] = useState<StoryType>("event");
  const [activeTab, setActiveTab] = useState<TabType>("events");
  
  // Background management state
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storySlotUploadProgress, setStorySlotUploadProgress] = useState<Record<number, number>>({});
  const [bulkUploading, setBulkUploading] = useState(false);
  
  // Fetch story background slots when story is selected
  const { slots: storySlots, loading: storySlotsLoading } = useStoryBackgroundSlots(
    selectedStory?.id
  );

  const allStories = [
    ...events.map(e => ({ ...e, type: 'event' as const })), 
    ...festivals.map(f => ({ ...f, type: 'festival' as const }))
  ];

  const [formData, setFormData] = useState({
    title: "",
    story_type: "event" as StoryType,
    event_type: "birthday" as "birthday" | "anniversary",
    event_date: "",
    person_name: "",
    festival_name: "",
    festival_date: "",
    description: "",
    is_active: true
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
          is_active: story.is_active ?? true
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
          is_active: story.is_active ?? true
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
        is_active: true
      });
    }
    setPosterFile(null);
    setIsDialogOpen(true);
  };

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
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
          is_active: formData.is_active
        };
        if (editingStory) {
          const { error } = await supabase.from("stories_events").update(eventData).eq("id", editingStory.id);
          if (error) throw error;
          toast.success("Event updated");
        } else {
          const { error } = await supabase.from("stories_events").insert([eventData]);
          if (error) throw error;
          toast.success("Event created");
        }
        refetchEvents();
      } else {
        const festivalData = {
          festival_name: formData.festival_name,
          festival_date: formData.festival_date,
          poster_url: posterUrl,
          description: formData.description || null,
          is_active: formData.is_active
        };
        if (editingStory) {
          const { error } = await supabase.from("stories_festivals").update(festivalData).eq("id", editingStory.id);
          if (error) throw error;
          toast.success("Festival updated");
        } else {
          const { error } = await supabase.from("stories_festivals").insert([festivalData]);
          if (error) throw error;
          toast.success("Festival created");
        }
        refetchFestivals();
      }
      setIsDialogOpen(false);
      refetchGenerated();
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
  };

  const handleDelete = async (id: string, type: StoryType) => {
    if (!confirm("Delete this story?")) return;
    try {
      const table = type === "event" ? "stories_events" : "stories_festivals";
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      if (type === "event") {
        refetchEvents();
      } else {
        refetchFestivals();
      }
      refetchGenerated();
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, type: StoryType) => {
    try {
      const table = type === "event" ? "stories_events" : "stories_festivals";
      const { error } = await supabase.from(table).update({ is_active: !currentStatus }).eq("id", id);
      if (error) throw error;
      toast.success("Status updated");
      if (type === "event") {
        refetchEvents();
      } else {
        refetchFestivals();
      }
      refetchGenerated();
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    }
  };

  const handleGenerateTestStories = async () => {
    try {
      setIsGenerating(true);
      toast.info("Generating stories...");
      const { data, error } = await supabase.functions.invoke('auto-story-generator', { body: {} });
      if (error) throw error;
      toast.success(`Generated ${data?.stats?.tomorrowEvents || 0} events, ${data?.stats?.tomorrowFestivals || 0} festivals`);
      refetchGenerated();
    } catch (error: any) {
      toast.error("Generation failed: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Background management handlers
  const handleStorySlotUpload = async (file: File, slotNumber: number) => {
    if (!selectedStory) {
      toast.error("Please select a story first");
      return;
    }

    setStorySlotUploadProgress((prev) => ({ ...prev, [slotNumber]: 0 }));

    const result = await uploadStoryBackgroundSlot(selectedStory.id, slotNumber, file);

    if (result.error) {
      toast.error(`Failed to upload background for slot ${slotNumber}`);
    } else {
      toast.success(`Background uploaded to slot ${slotNumber}`);
    }

    setStorySlotUploadProgress((prev) => ({ ...prev, [slotNumber]: 100 }));
    setTimeout(() => {
      setStorySlotUploadProgress((prev) => {
        const updated = { ...prev };
        delete updated[slotNumber];
        return updated;
      });
    }, 1000);
  };

  const handleStorySlotBulkUpload = async (files: FileList) => {
    if (!selectedStory) {
      toast.error("Please select a story first");
      return;
    }

    const filesArray = Array.from(files);
    const usedSlots = storySlots.map(s => s.slot_number);
    const availableSlots = Array.from({ length: 16 }, (_, i) => i + 1).filter(
      (slot) => !usedSlots.includes(slot)
    );

    if (availableSlots.length === 0) {
      toast.error("All 16 slots are filled. Delete some backgrounds first.");
      return;
    }

    if (filesArray.length > availableSlots.length) {
      toast.warning(`Only ${availableSlots.length} slots available. Uploading first ${availableSlots.length} images.`);
    }

    setBulkUploading(true);
    const filesToUpload = filesArray.slice(0, availableSlots.length);
    
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const slotNumber = availableSlots[i];
      await handleStorySlotUpload(file, slotNumber);
    }

    setBulkUploading(false);
    toast.success(`Uploaded ${filesToUpload.length} backgrounds`);
  };

  const handleSlotRemove = async (slotId: string, slotNumber: number) => {
    if (!confirm(`Remove background from slot ${slotNumber}?`)) return;
    
    const { error } = await removeStoryBackgroundSlot(slotId);
    if (error) {
      toast.error("Failed to remove background");
    } else {
      toast.success("Background removed");
    }
  };

  const handleSlotToggleActive = async (slotId: string, isActive: boolean, slotNumber: number) => {
    const { error } = await toggleStoryBackgroundSlotActive(slotId, !isActive);
    if (error) {
      toast.error("Failed to update slot status");
    } else {
      toast.success(`Slot ${slotNumber} ${!isActive ? 'activated' : 'deactivated'}`);
    }
  };

  const activeGenerated = generatedStories.filter(s => s.status === "active").length;
  const previewGenerated = generatedStories.filter(s => s.status === "preview_only").length;
  const totalStories = events.length + festivals.length + generatedStories.length;

  return (
    <AdminLayout>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-primary/20 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Admin Panel</p>
              <h1 className="text-lg font-bold text-foreground">Stories Management</h1>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleGenerateTestStories} disabled={isGenerating}>
              {isGenerating ? <Sparkles className="w-4 h-4 animate-spin text-primary" /> : <Settings className="w-4 h-4 text-primary" />}
            </Button>
          </div>
        </div>

        {/* Fixed Summary Stats Row */}
        <div className="flex-shrink-0 px-4 py-2">
          <div className="flex gap-2">
            <div className="flex-1 bg-card border border-primary/20 rounded-lg px-3 py-1.5">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Total</p>
              <p className="text-xl font-bold text-primary">{totalStories}</p>
            </div>
            <div className="flex-1 bg-card border border-green-500/20 rounded-lg px-3 py-1.5">
              <p className="text-[9px] font-semibold text-green-500 uppercase">Active</p>
              <p className="text-xl font-bold text-green-500">{activeGenerated}</p>
            </div>
            <div className="flex-1 bg-card border border-yellow-500/20 rounded-lg px-3 py-1.5">
              <p className="text-[9px] font-semibold text-yellow-500 uppercase">Preview</p>
              <p className="text-xl font-bold text-yellow-500">{previewGenerated}</p>
            </div>
            <div className="flex-1 bg-card border border-blue-400/20 rounded-lg px-3 py-1.5">
              <p className="text-[9px] font-semibold text-blue-400 uppercase">Source</p>
              <p className="text-xl font-bold text-blue-400">{events.length + festivals.length}</p>
            </div>
          </div>
        </div>

        {/* Fixed Filter Tabs */}
        <div className="flex-shrink-0 bg-background border-b border-primary/20 px-4 py-2">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab("events")} 
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-all ${activeTab === "events" ? "bg-blue-500 text-white shadow-lg" : "bg-card border border-primary/20 text-muted-foreground"}`}
            >
              Events ({events.length})
            </button>
            <button 
              onClick={() => setActiveTab("festivals")} 
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-all ${activeTab === "festivals" ? "bg-purple-500 text-white shadow-lg" : "bg-card border border-primary/20 text-muted-foreground"}`}
            >
              Festivals ({festivals.length})
            </button>
            <button 
              onClick={() => setActiveTab("generated")} 
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-all ${activeTab === "generated" ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg" : "bg-card border border-primary/20 text-muted-foreground"}`}
            >
              Auto ({generatedStories.length})
            </button>
            <button 
              onClick={() => { setActiveTab("backgrounds"); setSelectedStory(null); }} 
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-all ${activeTab === "backgrounds" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" : "bg-card border border-primary/20 text-muted-foreground"}`}
            >
              <Image className="w-3 h-3 inline mr-1" />
              BGs
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <>
              {/* Events Tab */}
              {activeTab === "events" && (
                <>
                  {events.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground mb-4">No events yet</p>
                      <Button onClick={() => handleOpenDialog(undefined, "event")} size="sm" className="bg-blue-500 hover:bg-blue-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {events.map(event => (
                        <div key={event.id} className="bg-card border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/40 transition-all animate-fade-in">
                          <div className="relative aspect-square bg-muted">
                            <img src={event.poster_url} alt={event.person_name} className="w-full h-full object-cover" />
                            <Badge className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 bg-blue-500/90 text-white border-0">
                              {event.event_type}
                            </Badge>
                            <div className="absolute top-2 right-2">
                              <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-lg ${event.is_active ?? true ? "bg-green-500" : "bg-gray-500"}`} />
                            </div>
                          </div>
                          <div className="p-2.5">
                            <h3 className="font-semibold text-foreground text-xs leading-tight line-clamp-1 mb-1">
                              {event.person_name}
                            </h3>
                            <p className="text-[10px] text-muted-foreground mb-2">
                              {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <div className="flex gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-full text-xs">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem onClick={() => handleOpenDialog(event, "event")}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleActive(event.id, event.is_active ?? true, "event")}>
                                    {event.is_active ?? true ? <><EyeOff className="w-3 h-3 mr-2" />Deactivate</> : <><Eye className="w-3 h-3 mr-2" />Activate</>}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(event.id, "event")} className="text-destructive focus:text-destructive">
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground mb-4">No festivals yet</p>
                      <Button onClick={() => handleOpenDialog(undefined, "festival")} size="sm" className="bg-purple-500 hover:bg-purple-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Festival
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {festivals.map(festival => (
                        <div key={festival.id} className="bg-card border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/40 transition-all animate-fade-in">
                          <div className="relative aspect-square bg-muted">
                            <img src={festival.poster_url} alt={festival.festival_name} className="w-full h-full object-cover" />
                            <Badge className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 bg-purple-500/90 text-white border-0">
                              Festival
                            </Badge>
                            <div className="absolute top-2 right-2">
                              <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-lg ${festival.is_active ?? true ? "bg-green-500" : "bg-gray-500"}`} />
                            </div>
                          </div>
                          <div className="p-2.5">
                            <h3 className="font-semibold text-foreground text-xs leading-tight line-clamp-1 mb-1">
                              {festival.festival_name}
                            </h3>
                            <p className="text-[10px] text-muted-foreground mb-2">
                              {new Date(festival.festival_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <div className="flex gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-full text-xs">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem onClick={() => handleOpenDialog(festival, "festival")}>
                                    <Edit className="w-3 h-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleActive(festival.id, festival.is_active ?? true, "festival")}>
                                    {festival.is_active ?? true ? <><EyeOff className="w-3 h-3 mr-2" />Deactivate</> : <><Eye className="w-3 h-3 mr-2" />Activate</>}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(festival.id, "festival")} className="text-destructive focus:text-destructive">
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">No auto-generated stories</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {generatedStories.map(story => (
                        <div key={story.id} className="bg-card border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/40 transition-all animate-fade-in">
                          <div className="relative aspect-square bg-muted">
                            <img src={story.poster_url} alt={story.title} className="w-full h-full object-cover" />
                            <Badge className={`absolute top-2 left-2 text-[9px] px-1.5 py-0.5 border-0 text-white ${story.status === "active" ? "bg-green-500/90" : "bg-yellow-500/90"}`}>
                              {story.status === "active" ? "Active" : "Preview"}
                            </Badge>
                            <Badge className={`absolute top-2 right-2 text-[9px] px-1.5 py-0.5 border-0 text-white ${story.source_type === "event" ? "bg-blue-500/90" : "bg-purple-500/90"}`}>
                              {story.source_type}
                            </Badge>
                          </div>
                          <div className="p-2.5">
                            <h3 className="font-semibold text-foreground text-xs leading-tight line-clamp-1 mb-1">
                              {story.title}
                            </h3>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(story.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Backgrounds Tab */}
              {activeTab === "backgrounds" && (
                <div className="space-y-4">
                  {/* Story Selection Card */}
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm">Select Story ({allStories.length})</CardTitle>
                      <CardDescription className="text-xs">Choose an event or festival to manage its 16 background slots</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {eventsLoading || festivalsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : allStories.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4 text-center">No stories found. Create events or festivals first.</p>
                      ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {allStories.map((story: any) => {
                            const isEvent = story.type === 'event';
                            const storyId = story.id;
                            const storyTitle = isEvent ? story.person_name : story.festival_name;
                            const storyDate = isEvent ? story.event_date : story.festival_date;
                            const isActive = story.is_active ?? true;
                            
                            return (
                              <button
                                key={storyId}
                                onClick={() => setSelectedStory(story)}
                                className={`text-left bg-card border rounded-xl overflow-hidden transition-all ${
                                  selectedStory?.id === storyId ? 'border-primary ring-2 ring-primary/30 shadow-lg' : 'border-primary/20 hover:border-primary/40'
                                }`}
                              >
                                <div className="relative aspect-square bg-muted">
                                  <img src={story.poster_url} alt={storyTitle} className="w-full h-full object-cover" />
                                  <Badge className={`absolute top-1 left-1 text-[8px] px-1 py-0 border-0 ${
                                    isEvent ? 'bg-blue-500/90' : 'bg-purple-500/90'
                                  } text-white`}>
                                    {isEvent ? story.event_type : 'Festival'}
                                  </Badge>
                                  <div className="absolute top-1 right-1">
                                    <div className={`w-2 h-2 rounded-full border border-white shadow ${
                                      isActive ? 'bg-green-500' : 'bg-gray-500'
                                    }`} />
                                  </div>
                                </div>
                                <div className="p-1.5">
                                  <h3 className="font-medium text-foreground text-[10px] leading-tight line-clamp-1">
                                    {storyTitle}
                                  </h3>
                                  <p className="text-[9px] text-muted-foreground">
                                    {new Date(storyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Background Slots Management */}
                  {selectedStory && (
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm">Background Slots (16 Max)</CardTitle>
                            <CardDescription className="text-xs">
                              {selectedStory.type === 'event' ? selectedStory.person_name : selectedStory.festival_name} • {storySlots.length}/16 filled
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => e.target.files && handleStorySlotBulkUpload(e.target.files)}
                              className="hidden"
                              id="story-bulk-upload"
                              disabled={bulkUploading}
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => document.getElementById("story-bulk-upload")?.click()}
                              disabled={bulkUploading || storySlots.length >= 16}
                            >
                              {bulkUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="h-3 w-3 mr-1" />
                                  Bulk
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        {storySlotsLoading ? (
                          <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 16 }, (_, i) => i + 1).map((slotNumber) => {
                              const slot = storySlots.find((s) => s.slot_number === slotNumber);
                              const progress = storySlotUploadProgress[slotNumber];

                              return (
                                <div 
                                  key={slotNumber} 
                                  className={`relative border rounded-lg p-2 bg-card transition-colors ${
                                    slot ? (slot.is_active ? 'border-primary/30' : 'border-muted opacity-50') : 'border-dashed border-primary/20'
                                  }`}
                                >
                                  <div className="aspect-square bg-muted rounded overflow-hidden mb-1.5">
                                    {slot ? (
                                      <img src={slot.image_url} alt={`Slot ${slotNumber}`} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        <Upload className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-medium">#{slotNumber}</span>
                                    {slot && (
                                      <div className="flex gap-0.5">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0"
                                          onClick={() => handleSlotToggleActive(slot.id, slot.is_active, slotNumber)}
                                        >
                                          {slot.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                          onClick={() => handleSlotRemove(slot.id, slotNumber)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>

                                  {progress !== undefined && progress < 100 && (
                                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    </div>
                                  )}

                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleStorySlotUpload(file, slotNumber);
                                      e.target.value = '';
                                    }}
                                    className="hidden"
                                    id={`story-slot-${slotNumber}`}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-6 text-[10px]"
                                    onClick={() => document.getElementById(`story-slot-${slotNumber}`)?.click()}
                                  >
                                    {slot ? "Replace" : "Upload"}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Fixed Floating Add Button - Hide on backgrounds tab */}
        {activeTab !== "backgrounds" && (
          <div className="absolute bottom-24 left-6 z-40">
            <Button onClick={() => handleOpenDialog(undefined, activeTab === "festivals" ? "festival" : "event")} className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStory ? "Edit" : "Add"} {formData.story_type === "event" ? "Event" : "Festival"}</DialogTitle>
            <DialogDescription>Fill in the details for the story</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Story Type</Label>
              <Select value={formData.story_type} onValueChange={(value: StoryType) => setFormData({
                ...formData,
                story_type: value
              })} disabled={!!editingStory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.story_type === "event" ? (
              <>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={formData.event_type} onValueChange={(value: "birthday" | "anniversary") => setFormData({
                    ...formData,
                    event_type: value
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Person Name</Label>
                  <Input value={formData.person_name} onChange={e => setFormData({
                    ...formData,
                    person_name: e.target.value
                  })} placeholder="Enter person name" />
                </div>

                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Input type="date" value={formData.event_date} onChange={e => setFormData({
                    ...formData,
                    event_date: e.target.value
                  })} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Festival Name</Label>
                  <Input value={formData.festival_name} onChange={e => setFormData({
                    ...formData,
                    festival_name: e.target.value
                  })} placeholder="Enter festival name" />
                </div>

                <div className="space-y-2">
                  <Label>Festival Date</Label>
                  <Input type="date" value={formData.festival_date} onChange={e => setFormData({
                    ...formData,
                    festival_date: e.target.value
                  })} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Poster Image</Label>
              <Input type="file" accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] || null)} />
              {editingStory && !posterFile && <p className="text-xs text-muted-foreground">Leave empty to keep existing image</p>}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({
                ...formData,
                is_active: e.target.checked
              })} className="h-4 w-4" />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              {editingStory ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
