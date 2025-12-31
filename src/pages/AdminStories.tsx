import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calendar, Sparkles, Eye, EyeOff, Upload, Image, Loader2, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import { useGeneratedStories, useStoriesEvents, useStoriesFestivals } from "@/hooks/useAutoStories";
import { useStoryBackgroundSlots, uploadStoryBackgroundSlot, removeStoryBackgroundSlot, toggleStoryBackgroundSlotActive } from "@/hooks/useStoryBackgroundSlots";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";
import StoryCard, { StoryCardData, getStatusFromDates } from "@/components/admin/StoryCard";
import ISTTimeSheet from "@/components/admin/ISTTimeSheet";
import { getStoryStatusIST } from "@/lib/istUtils";

type StoryType = "event" | "festival";
type TabType = "events" | "festivals" | "generated" | "backgrounds";
type StatusFilter = "all" | "active" | "preview_only" | "sources";

export default function AdminStories() {
  const {
    stories: generatedStories,
    loading: generatedLoading,
    refetch: refetchGenerated
  } = useGeneratedStories(true);
  const {
    events,
    loading: eventsLoading,
    refetch: refetchEvents
  } = useStoriesEvents(true);
  const {
    festivals,
    loading: festivalsLoading,
    refetch: refetchFestivals
  } = useStoriesFestivals(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [editingType, setEditingType] = useState<StoryType>("event");
  const [activeTab, setActiveTab] = useState<TabType>("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  
  // Background management state
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storySlotUploadProgress, setStorySlotUploadProgress] = useState<Record<number, number>>({});
  const [bulkUploading, setBulkUploading] = useState(false);
  
  // Fetch story background slots when story is selected
  const { slots: storySlots, loading: storySlotsLoading } = useStoryBackgroundSlots(selectedStory?.id);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchEvents(), refetchFestivals(), refetchGenerated()]);
    setRefreshing(false);
  };

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
      if (type === "event") refetchEvents();
      else refetchFestivals();
      refetchGenerated();
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, type: StoryType) => {
    try {
      const table = type === "event" ? "stories_events" : "stories_festivals";
      // When deactivating: set is_active=false AND story_status=null (hides from user dashboard)
      // When activating: set is_active=true AND story_status=false (shows as upcoming)
      const updateData = currentStatus 
        ? { is_active: false, story_status: null } 
        : { is_active: true, story_status: false };
      const { error } = await supabase.from(table).update(updateData).eq("id", id);
      if (error) throw error;
      toast.success(currentStatus ? "Story hidden from users" : "Story visible to users");
      if (type === "event") refetchEvents();
      else refetchFestivals();
      refetchGenerated();
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    }
  };

  // Generated stories handlers
  const handleToggleGenerated = async (id: string, currentStatus: boolean) => {
    try {
      // When deactivating: set story_status=null (hides from user dashboard)
      // When activating: set story_status=false (shows as upcoming)
      const newStoryStatus = currentStatus ? null : false;
      const newStatus = currentStatus ? "preview_only" : "active";
      const { error } = await supabase.from("stories_generated").update({ 
        status: newStatus,
        story_status: newStoryStatus
      }).eq("id", id);
      if (error) throw error;
      toast.success(currentStatus ? "Story hidden from users" : "Story visible to users");
      refetchGenerated();
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    }
  };

  const handleDeleteGenerated = async (id: string) => {
    if (!confirm("Delete this generated story?")) return;
    try {
      const { error } = await supabase.from("stories_generated").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      refetchGenerated();
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  const handleOpenGeneratedDialog = (story: any) => {
    toast.info("Generated stories are auto-created. Edit the source event/festival instead.");
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

  // Manual trigger for IST status update (runs the same function as midnight cron)
  const handleManualStatusUpdate = async () => {
    try {
      setIsGenerating(true);
      toast.info("Updating story statuses (IST)...");
      const { error } = await supabase.rpc('update_story_status_ist' as any);
      if (error) throw error;
      toast.success("Story statuses updated based on IST date");
      await handleRefresh();
    } catch (error: any) {
      toast.error("Status update failed: " + error.message);
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
    if (result.error) toast.error(`Failed to upload background for slot ${slotNumber}`);
    else toast.success(`Background uploaded to slot ${slotNumber}`);
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
    const availableSlots = Array.from({ length: 16 }, (_, i) => i + 1).filter((slot) => !usedSlots.includes(slot));
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
    if (error) toast.error("Failed to remove background");
    else toast.success("Background removed");
  };

  const handleSlotToggleActive = async (slotId: string, isActive: boolean, slotNumber: number) => {
    const { error } = await toggleStoryBackgroundSlotActive(slotId, !isActive);
    if (error) toast.error("Failed to update slot status");
    else toast.success(`Slot ${slotNumber} ${!isActive ? 'activated' : 'deactivated'}`);
  };

  const activeGenerated = generatedStories.filter(s => s.status === "active").length;
  const previewGenerated = generatedStories.filter(s => s.status === "preview_only").length;
  const totalSources = events.length + festivals.length;
  const totalStories = totalSources + generatedStories.length;

  // Filter stories based on search and status filter using IST
  const filteredEvents = useMemo(() => {
    let filtered = events.filter(e => 
      e.person_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (statusFilter === "active") {
      filtered = filtered.filter(e => {
        const status = getStoryStatusIST(e.event_date, e.story_status);
        return status.isLive;
      });
    } else if (statusFilter === "preview_only") {
      filtered = filtered.filter(e => {
        const status = getStoryStatusIST(e.event_date, e.story_status);
        return status.isUpcoming;
      });
    }
    
    return filtered;
  }, [events, searchQuery, statusFilter]);

  const filteredFestivals = useMemo(() => {
    let filtered = festivals.filter(f => 
      f.festival_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (statusFilter === "active") {
      filtered = filtered.filter(f => {
        const status = getStoryStatusIST(f.festival_date, f.story_status);
        return status.isLive;
      });
    } else if (statusFilter === "preview_only") {
      filtered = filtered.filter(f => {
        const status = getStoryStatusIST(f.festival_date, f.story_status);
        return status.isUpcoming;
      });
    }
    
    return filtered;
  }, [festivals, searchQuery, statusFilter]);

  const filteredGenerated = useMemo(() => {
    let filtered = generatedStories;
    
    if (statusFilter === "active") {
      filtered = filtered.filter(s => s.status === "active");
    } else if (statusFilter === "preview_only") {
      filtered = filtered.filter(s => s.status === "preview_only");
    }
    
    return filtered;
  }, [generatedStories, statusFilter]);

  // Handle stats card click for filtering
  const handleStatsClick = (filter: StatusFilter) => {
    setStatusFilter(prev => prev === filter ? "all" : filter);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <PremiumGlobalLoader size="lg" message="Loading stories..." fullScreen={false} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader 
        title="Stories Management" 
        subtitle={`${totalStories} stories`} 
        onRefresh={handleRefresh} 
        isRefreshing={refreshing} 
      />

      <div className="p-4 space-y-4">
        {/* IST Time Sheet */}
        <ISTTimeSheet showCountdown={true} />

        {/* Stats Cards - Clickable Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => handleStatsClick("all")} 
            className={`cursor-pointer transition-all ${statusFilter === "all" ? "ring-2 ring-primary" : ""}`}
          >
            <AdminStatsCard icon={<Calendar className="w-5 h-5" />} value={totalStories} label="Total Stories" />
          </div>
          <div 
            onClick={() => handleStatsClick("active")} 
            className={`cursor-pointer transition-all ${statusFilter === "active" ? "ring-2 ring-green-500" : ""}`}
          >
            <AdminStatsCard icon={<Eye className="w-5 h-5" />} value={activeGenerated} label="Active (Live)" iconColor="text-green-500" />
          </div>
          <div 
            onClick={() => handleStatsClick("preview_only")} 
            className={`cursor-pointer transition-all ${statusFilter === "preview_only" ? "ring-2 ring-yellow-500" : ""}`}
          >
            <AdminStatsCard icon={<EyeOff className="w-5 h-5" />} value={previewGenerated} label="Upcoming" iconColor="text-yellow-500" />
          </div>
          <div 
            onClick={() => handleStatsClick("sources")} 
            className={`cursor-pointer transition-all ${statusFilter === "sources" ? "ring-2 ring-blue-500" : ""}`}
          >
            <AdminStatsCard icon={<Sparkles className="w-5 h-5" />} value={totalSources} label="Source Events" iconColor="text-blue-500" />
          </div>
        </div>
        
        {/* Active Filter Badge */}
        {statusFilter !== "all" && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40">
              Filter: {statusFilter === "active" ? "Live" : statusFilter === "preview_only" ? "Upcoming" : "Sources"}
            </Badge>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStatusFilter("all")}>
              Clear
            </Button>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search stories..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10 bg-card border-primary/20" 
            />
          </div>
          <Button 
            onClick={handleManualStatusUpdate} 
            disabled={isGenerating}
            variant="outline"
            className="border-primary/30"
            title="Update statuses based on IST date"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
          </Button>
          <Button 
            onClick={handleGenerateTestStories} 
            disabled={isGenerating}
            variant="outline"
            className="border-primary/30"
            title="Generate preview stories"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab("events")} 
            className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all ${
              activeTab === "events" 
                ? "bg-[#E5B80B] text-black shadow-lg" 
                : "bg-card border border-primary/20 text-muted-foreground hover:border-primary/40"
            }`}
          >
            Events ({events.length})
          </button>
          <button 
            onClick={() => setActiveTab("festivals")} 
            className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all ${
              activeTab === "festivals" 
                ? "bg-[#E5B80B] text-black shadow-lg" 
                : "bg-card border border-primary/20 text-muted-foreground hover:border-primary/40"
            }`}
          >
            Festivals ({festivals.length})
          </button>
          <button 
            onClick={() => setActiveTab("generated")} 
            className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all ${
              activeTab === "generated" 
                ? "bg-[#E5B80B] text-black shadow-lg" 
                : "bg-card border border-primary/20 text-muted-foreground hover:border-primary/40"
            }`}
          >
            Auto ({generatedStories.length})
          </button>
          <button 
            onClick={() => { setActiveTab("backgrounds"); setSelectedStory(null); }} 
            className={`py-2.5 px-3 rounded-xl font-semibold text-xs transition-all ${
              activeTab === "backgrounds" 
                ? "bg-[#E5B80B] text-black shadow-lg" 
                : "bg-card border border-primary/20 text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Image className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        {activeTab === "events" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenDialog(undefined, "event")} size="sm" className="bg-[#E5B80B] hover:bg-[#E5B80B]/90 text-black">
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </Button>
            </div>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 bg-card border border-primary/20 rounded-2xl">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No events found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map(event => {
                  const storyCardData: StoryCardData = {
                    id: event.id,
                    title: event.person_name,
                    subtitle: event.event_type,
                    poster_url: event.poster_url,
                    is_active: event.is_active,
                    start_date: event.start_date,
                    end_date: event.end_date,
                    story_status: event.story_status,
                    event_date: event.event_date
                  };
                  
                  return (
                    <StoryCard
                      key={event.id}
                      story={storyCardData}
                      onToggleActive={(id, current) => handleToggleActive(id, current, "event")}
                      onEdit={() => handleOpenDialog(event, "event")}
                      onDelete={(id) => handleDelete(id, "event")}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "festivals" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button onClick={() => handleOpenDialog(undefined, "festival")} size="sm" className="bg-[#E5B80B] hover:bg-[#E5B80B]/90 text-black">
                <Plus className="w-4 h-4 mr-1" />
                Add Festival
              </Button>
            </div>
            {filteredFestivals.length === 0 ? (
              <div className="text-center py-12 bg-card border border-primary/20 rounded-2xl">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No festivals found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFestivals.map(festival => {
                  const storyCardData: StoryCardData = {
                    id: festival.id,
                    title: festival.festival_name,
                    poster_url: festival.poster_url,
                    is_active: festival.is_active,
                    start_date: festival.start_date,
                    end_date: festival.end_date,
                    story_status: festival.story_status
                  };
                  
                  return (
                    <StoryCard
                      key={festival.id}
                      story={storyCardData}
                      onToggleActive={(id, current) => handleToggleActive(id, current, "festival")}
                      onEdit={() => handleOpenDialog(festival, "festival")}
                      onDelete={(id) => handleDelete(id, "festival")}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "generated" && (
          <div className="space-y-2">
            {filteredGenerated.length === 0 ? (
              <div className="text-center py-12 bg-card border border-primary/20 rounded-2xl">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No auto-generated stories yet</p>
              </div>
            ) : (
              filteredGenerated.map(story => {
                const storyCardData: StoryCardData = {
                  id: story.id,
                  title: story.title,
                  subtitle: story.source_type,
                  poster_url: story.poster_url,
                  is_active: story.status === "active",
                  start_date: story.event_date,
                  end_date: story.expires_at,
                  story_status: story.story_status
                };
                
                return (
                  <StoryCard
                    key={story.id}
                    story={storyCardData}
                    onToggleActive={(id, current) => handleToggleGenerated(id, current)}
                    onEdit={() => handleOpenGeneratedDialog(story)}
                    onDelete={(id) => handleDeleteGenerated(id)}
                  />
                );
              })
            )}
          </div>
        )}

        {activeTab === "backgrounds" && (
          <div className="space-y-3">
            <div className="bg-card border border-primary/20 rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-3">Select a Story</h3>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {[...events, ...festivals].map((story: any) => {
                  const isEvent = 'person_name' in story;
                  const storyTitle = isEvent ? story.person_name : story.festival_name;
                  return (
                    <button
                      key={story.id}
                      onClick={() => setSelectedStory(story)}
                      className={`text-left rounded-xl overflow-hidden border transition-all ${
                        selectedStory?.id === story.id ? 'border-primary shadow-lg' : 'border-primary/20 hover:border-primary/40'
                      }`}
                    >
                      <div className="aspect-square bg-muted">
                        <img src={story.poster_url} alt={storyTitle} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 bg-card">
                        <p className="text-xs font-medium truncate">{storyTitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedStory && (
              <div className="bg-card border border-primary/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Background Slots ({storySlots.length}/16)</h3>
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => e.target.files && handleStorySlotBulkUpload(e.target.files)}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" className="border-primary/30" asChild>
                      <span><Upload className="w-4 h-4 mr-1" />Bulk Upload</span>
                    </Button>
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map(slotNum => {
                    const slot = storySlots.find(s => s.slot_number === slotNum);
                    return (
                      <div key={slotNum} className={`aspect-square rounded-lg border-2 border-dashed ${slot ? 'border-primary/40' : 'border-primary/20'} overflow-hidden relative`}>
                        {slot ? (
                          <>
                            <img src={slot.image_url} alt={`Slot ${slotNum}`} className={`w-full h-full object-cover ${!slot.is_active ? 'opacity-50' : ''}`} />
                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSlotToggleActive(slot.id, slot.is_active ?? true, slotNum)}>
                                {slot.is_active ? <Eye className="w-3 h-3 text-white" /> : <EyeOff className="w-3 h-3 text-white" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSlotRemove(slot.id, slotNum)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleStorySlotUpload(e.target.files[0], slotNum)}
                            />
                            <span className="text-xs text-muted-foreground">{slotNum}</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-primary/20 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStory ? 'Edit' : 'Create'} {formData.story_type === 'event' ? 'Event' : 'Festival'}</DialogTitle>
            <DialogDescription>Fill in the story details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formData.story_type === "event" ? (
              <>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={formData.event_type} onValueChange={(v: "birthday" | "anniversary") => setFormData({ ...formData, event_type: v })}>
                    <SelectTrigger className="bg-card border-primary/20">
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
                  <Input value={formData.person_name} onChange={(e) => setFormData({ ...formData, person_name: e.target.value })} className="bg-card border-primary/20" />
                </div>
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Input type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} className="bg-card border-primary/20" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Festival Name</Label>
                  <Input value={formData.festival_name} onChange={(e) => setFormData({ ...formData, festival_name: e.target.value })} className="bg-card border-primary/20" />
                </div>
                <div className="space-y-2">
                  <Label>Festival Date</Label>
                  <Input type="date" value={formData.festival_date} onChange={(e) => setFormData({ ...formData, festival_date: e.target.value })} className="bg-card border-primary/20" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Poster Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} className="bg-card border-primary/20" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" />
              <Label>Active</Label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 bg-[#E5B80B] hover:bg-[#E5B80B]/90 text-black">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
