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
import { Plus, Trash2, Edit, RefreshCw, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/admin/AdminLayout";
import { useStoriesEvents, useStoriesFestivals, useGeneratedStories } from "@/hooks/useAutoStories";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminAutoStories() {
  const { events, loading: eventsLoading, refetch: refetchEvents } = useStoriesEvents();
  const { festivals, loading: festivalsLoading, refetch: refetchFestivals } = useStoriesFestivals();
  const { stories: generatedStories, loading: storiesLoading, refetch: refetchStories } = useGeneratedStories();

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isFestivalDialogOpen, setIsFestivalDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingFestival, setEditingFestival] = useState<any>(null);

  const [eventFormData, setEventFormData] = useState({
    event_type: "birthday" as string,
    event_date: "",
    person_name: "",
    poster_url: "",
    description: "",
  });

  const [festivalFormData, setFestivalFormData] = useState({
    festival_name: "",
    festival_date: "",
    poster_url: "",
    description: "",
    is_active: true,
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);

  const uploadPoster = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError, data } = await supabase.storage
      .from("template-covers")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("template-covers")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSaveEvent = async () => {
    try {
      if (!eventFormData.person_name || !eventFormData.event_date) {
        toast.error("Name and date are required");
        return;
      }

      let posterUrl = editingEvent?.poster_url || "";

      if (posterFile) {
        posterUrl = await uploadPoster(posterFile);
      } else if (!editingEvent) {
        toast.error("Poster is required");
        return;
      }

      const eventData = {
        ...eventFormData,
        poster_url: posterUrl,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from("stories_events")
          .update(eventData)
          .eq("id", editingEvent.id);

        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        const { error } = await supabase
          .from("stories_events")
          .insert([eventData]);

        if (error) throw error;
        toast.success("Event created successfully");
      }

      setIsEventDialogOpen(false);
      refetchEvents();
    } catch (error: any) {
      toast.error("Failed to save event: " + error.message);
    }
  };

  const handleSaveFestival = async () => {
    try {
      if (!festivalFormData.festival_name || !festivalFormData.festival_date) {
        toast.error("Name and date are required");
        return;
      }

      let posterUrl = editingFestival?.poster_url || "";

      if (posterFile) {
        posterUrl = await uploadPoster(posterFile);
      } else if (!editingFestival) {
        toast.error("Poster is required");
        return;
      }

      const festivalData = {
        ...festivalFormData,
        poster_url: posterUrl,
      };

      if (editingFestival) {
        const { error } = await supabase
          .from("stories_festivals")
          .update(festivalData)
          .eq("id", editingFestival.id);

        if (error) throw error;
        toast.success("Festival updated successfully");
      } else {
        const { error } = await supabase
          .from("stories_festivals")
          .insert([festivalData]);

        if (error) throw error;
        toast.success("Festival created successfully");
      }

      setIsFestivalDialogOpen(false);
      refetchFestivals();
    } catch (error: any) {
      toast.error("Failed to save festival: " + error.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;

    try {
      const { error } = await supabase.from("stories_events").delete().eq("id", id);
      if (error) throw error;
      toast.success("Event deleted");
      refetchEvents();
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  const handleDeleteFestival = async (id: string) => {
    if (!confirm("Delete this festival?")) return;

    try {
      const { error } = await supabase.from("stories_festivals").delete().eq("id", id);
      if (error) throw error;
      toast.success("Festival deleted");
      refetchFestivals();
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  const triggerAutoGeneration = async () => {
    try {
      const { error } = await supabase.functions.invoke("auto-story-generator");
      if (error) throw error;
      toast.success("Auto-generation triggered successfully");
      setTimeout(() => refetchStories(), 2000);
    } catch (error: any) {
      toast.error("Failed to trigger: " + error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Auto Stories Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage events, festivals, and auto-generated stories
            </p>
          </div>
          <Button onClick={triggerAutoGeneration} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Run Auto-Generator
          </Button>
        </div>

        <Tabs defaultValue="generated" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generated">Generated Stories</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="festivals">Festivals</TabsTrigger>
          </TabsList>

          <TabsContent value="generated" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Auto-Generated Stories</h2>
              <Button onClick={() => refetchStories()} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {storiesLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {generatedStories.map((story) => (
                  <div key={story.id} className="gold-border bg-card rounded-xl overflow-hidden">
                    <div className="relative aspect-[9/16] bg-muted">
                      <img src={story.poster_url} alt={story.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <Badge variant={story.status === "active" ? "default" : "secondary"}>
                          {story.status === "active" ? "Active" : "Preview"}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground">{story.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Event: {new Date(story.event_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(story.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Birthday & Anniversary Events</h2>
              <Button onClick={() => {
                setEditingEvent(null);
                setEventFormData({
                  event_type: "birthday",
                  event_date: "",
                  person_name: "",
                  poster_url: "",
                  description: "",
                });
                setPosterFile(null);
                setIsEventDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>

            {eventsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="gold-border bg-card rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={event.poster_url} alt={event.person_name} className="w-16 h-16 rounded object-cover" />
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {event.event_type === "birthday" ? "🎂" : "💞"} {event.person_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingEvent(event);
                        setEventFormData({
                          event_type: event.event_type,
                          event_date: event.event_date,
                          person_name: event.person_name,
                          poster_url: event.poster_url,
                          description: event.description || "",
                        });
                        setPosterFile(null);
                        setIsEventDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="festivals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Festival Events</h2>
              <Button onClick={() => {
                setEditingFestival(null);
                setFestivalFormData({
                  festival_name: "",
                  festival_date: "",
                  poster_url: "",
                  description: "",
                  is_active: true,
                });
                setPosterFile(null);
                setIsFestivalDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Festival
              </Button>
            </div>

            {festivalsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-2">
                {festivals.map((festival) => (
                  <div key={festival.id} className="gold-border bg-card rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={festival.poster_url} alt={festival.festival_name} className="w-16 h-16 rounded object-cover" />
                      <div>
                        <h3 className="font-semibold text-foreground">🎉 {festival.festival_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(festival.festival_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingFestival(festival);
                        setFestivalFormData({
                          festival_name: festival.festival_name,
                          festival_date: festival.festival_date,
                          poster_url: festival.poster_url,
                          description: festival.description || "",
                          is_active: festival.is_active,
                        });
                        setPosterFile(null);
                        setIsFestivalDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteFestival(festival.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Event Dialog */}
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
              <DialogDescription>Birthday or Anniversary event</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Event Type</Label>
                <select
                  className="w-full p-2 rounded border"
                  value={eventFormData.event_type}
                  onChange={(e) => setEventFormData({ ...eventFormData, event_type: e.target.value as "birthday" | "anniversary" })}
                >
                  <option value="birthday">Birthday 🎂</option>
                  <option value="anniversary">Anniversary 💞</option>
                </select>
              </div>
              <div>
                <Label>Person Name</Label>
                <Input
                  value={eventFormData.person_name}
                  onChange={(e) => setEventFormData({ ...eventFormData, person_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={eventFormData.event_date}
                  onChange={(e) => setEventFormData({ ...eventFormData, event_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Poster Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Input
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEvent}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Festival Dialog */}
        <Dialog open={isFestivalDialogOpen} onOpenChange={setIsFestivalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFestival ? "Edit Festival" : "Add Festival"}</DialogTitle>
              <DialogDescription>Festival event</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Festival Name</Label>
                <Input
                  value={festivalFormData.festival_name}
                  onChange={(e) => setFestivalFormData({ ...festivalFormData, festival_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Festival Date</Label>
                <Input
                  type="date"
                  value={festivalFormData.festival_date}
                  onChange={(e) => setFestivalFormData({ ...festivalFormData, festival_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Poster Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Input
                  value={festivalFormData.description}
                  onChange={(e) => setFestivalFormData({ ...festivalFormData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={festivalFormData.is_active}
                  onCheckedChange={(checked) => setFestivalFormData({ ...festivalFormData, is_active: checked })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsFestivalDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveFestival}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}