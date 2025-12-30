import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import { useTemplates } from "@/hooks/useTemplates";
import type { GeneratedStory, StoriesEvent, StoriesFestival } from "@/hooks/useAutoStories";

export default function StoryBannerCreate() {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId ?? undefined);
  const { photos: profilePhotos } = useProfilePhotos(userId ?? undefined);
  const { templates } = useTemplates();
  
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [sourceData, setSourceData] = useState<StoriesEvent | StoriesFestival | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Fetch story and source data
  useEffect(() => {
    const fetchStoryData = async () => {
      if (!storyId) {
        toast.error("Story ID missing");
        navigate("/dashboard");
        return;
      }

      try {
        setLoading(true);

        // Fetch the generated story
        const { data: storyData, error: storyError } = await supabase
          .from("stories_generated")
          .select("*")
          .eq("id", storyId)
          .eq("status", "active")
          .single();

        if (storyError || !storyData) {
          toast.error("Story not found or not active");
          navigate("/dashboard");
          return;
        }

        setStory(storyData as GeneratedStory);

        // Fetch source data based on source_type
        if (storyData.source_type === "event") {
          const { data: eventData, error: eventError } = await supabase
            .from("stories_events")
            .select("*")
            .eq("id", storyData.source_id)
            .single();

          if (!eventError && eventData) {
            setSourceData(eventData as StoriesEvent);
          }
        } else if (storyData.source_type === "festival") {
          const { data: festivalData, error: festivalError } = await supabase
            .from("stories_festivals")
            .select("*")
            .eq("id", storyData.source_id)
            .single();

          if (!festivalError && festivalData) {
            setSourceData(festivalData as StoriesFestival);
          }
        }
      } catch (error) {
        console.error("Error fetching story:", error);
        toast.error("Failed to load story data");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchStoryData();
  }, [storyId, navigate]);

  const handleCreateBanner = () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }

    if (profilePhotos.length === 0) {
      toast.error("Please upload at least one profile photo");
      return;
    }

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (!selectedTemplate) {
      toast.error("Template not found");
      return;
    }

    // Determine category type based on story source
    let categoryType: 'birthday' | 'anniversary' | 'festival' = 'festival';
    if (story?.source_type === 'event' && sourceData && 'event_type' in sourceData) {
      categoryType = sourceData.event_type === 'birthday' ? 'birthday' : 'anniversary';
    }

    // Navigate to banner preview with auto-filled data
    navigate("/banner-preview", {
      state: {
        rankName: profile?.rank || "ACHIEVER",
        rankIcon: "",
        rankGradient: "",
        name: profile?.name || "",
        teamCity: `${profile?.role || ""} ${profile?.mobile || ""}`.trim(),
        photo: profilePhotos[selectedPhotoIndex]?.photo_url || null,
        uplines: [],
        templateId: selectedTemplateId,
        categoryType,
        eventTitle: story?.title || "",
        eventDate: story?.event_date || "",
        message: sourceData && 'description' in sourceData ? sourceData.description : "",
      },
    });
  };

  if (loading) {
    return <PremiumGlobalLoader message="Loading story..." />;
  }

  if (!story) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Create Story Banner</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Story Preview */}
        <div className="gold-border bg-card rounded-2xl overflow-hidden">
          <div className="aspect-[9/16] relative">
            <img src={story.poster_url} alt={story.title} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h2 className="text-white font-bold text-xl">{story.title}</h2>
              <p className="text-white/90 text-sm mt-1">
                {new Date(story.event_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Auto-Filled Details */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Auto-Filled Details
          </h3>
          <div className="gold-border bg-card rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-foreground font-semibold">{profile?.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rank</p>
              <p className="text-foreground font-semibold">{profile?.rank || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="text-foreground font-semibold">{profile?.mobile || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-foreground font-semibold">{profile?.role || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Photo Selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Select Your Photo</h3>
          {profilePhotos.length === 0 ? (
            <div className="gold-border bg-card rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No photos uploaded yet</p>
              <Button onClick={() => navigate("/profile")} variant="outline" className="mt-4">
                Upload Photos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {profilePhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedPhotoIndex === idx
                      ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                      : "border-border hover:border-primary"
                  }`}
                >
                  <img src={photo.photo_url} alt="Profile" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Choose Template</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {templates.slice(0, 9).map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                className={`gold-border bg-card rounded-xl overflow-hidden transition-all ${
                  selectedTemplateId === template.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                    : "hover:scale-105"
                }`}
              >
                <div className="aspect-square relative">
                  <img
                    src={template.cover_thumbnail_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedTemplateId === template.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground line-clamp-1">{template.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateBanner}
          disabled={!selectedTemplateId || profilePhotos.length === 0}
          className="w-full h-12 text-base font-semibold"
        >
          Create Banner
        </Button>
      </div>
    </div>
  );
}
