import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useProfilePhotos } from "@/hooks/useProfilePhotos";
import type { GeneratedStory, StoriesEvent, StoriesFestival } from "@/hooks/useAutoStories";

export default function StoryPreview() {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId ?? undefined);
  const { photos: profilePhotos } = useProfilePhotos(userId ?? undefined);

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Fetch story and auto-navigate to banner preview
  useEffect(() => {
    const autoNavigateToPreview = async () => {
      if (!storyId || !userId || !profile) return;

      try {
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

        const story = storyData as GeneratedStory;

        // Fetch source data based on source_type
        let sourceData: StoriesEvent | StoriesFestival | null = null;
        
        if (story.source_type === "event") {
          const { data: eventData } = await supabase
            .from("stories_events")
            .select("*")
            .eq("id", story.source_id)
            .single();
          
          if (eventData) sourceData = eventData as StoriesEvent;
        } else if (story.source_type === "festival") {
          const { data: festivalData } = await supabase
            .from("stories_festivals")
            .select("*")
            .eq("id", story.source_id)
            .single();
          
          if (festivalData) sourceData = festivalData as StoriesFestival;
        }

        // Determine category type
        let categoryType: 'birthday' | 'anniversary' | 'festival' = 'festival';
        if (story.source_type === 'event' && sourceData && 'event_type' in sourceData) {
          categoryType = sourceData.event_type === 'birthday' ? 'birthday' : 'anniversary';
        }

        // Get primary or first photo
        const primaryPhoto = profilePhotos.find(p => p.is_primary) || profilePhotos[0];

        // Navigate directly to banner preview with auto-filled data
        navigate("/banner-preview", {
          state: {
            rankName: profile.rank || "ACHIEVER",
            rankIcon: "",
            rankGradient: "",
            name: profile.name || "",
            teamCity: `${profile.role || ""} ${profile.mobile || ""}`.trim(),
            photo: primaryPhoto?.photo_url || null,
            uplines: [],
            templateId: null, // User can select template in preview
            categoryType,
            eventTitle: story.title || "",
            eventDate: story.event_date || "",
            message: sourceData && 'description' in sourceData ? sourceData.description : "",
            storyMode: true, // Flag to indicate this is from a story
          },
        });
      } catch (error) {
        console.error("Error loading story:", error);
        toast.error("Failed to load story");
        navigate("/dashboard");
      }
    };

    autoNavigateToPreview();
  }, [storyId, userId, profile, profilePhotos, navigate]);

  // Loading screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your story...</p>
      </div>
    </div>
  );
}
