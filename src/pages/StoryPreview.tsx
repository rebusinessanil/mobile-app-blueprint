import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { useTemplates } from "@/hooks/useTemplates";

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

export default function StoryPreview() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId ?? undefined);
  const { settings: bannerSettings } = useBannerSettings(userId ?? undefined);
  const [eventType, setEventType] = useState<string | null>(null);
  
  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Fetch event type from stories_events
  useEffect(() => {
    const fetchEventType = async () => {
      if (!eventId) return;

      const { data, error } = await supabase
        .from("stories_events")
        .select("event_type")
        .eq("id", eventId)
        .single();

      if (!error && data) {
        setEventType(data.event_type);
      }
    };

    fetchEventType();
  }, [eventId]);

  // Fetch templates for this specific event
  const { templates } = useTemplates(
    undefined, // categoryId
    undefined, // tripId
    undefined, // rankId
    undefined, // birthdayId
    undefined, // anniversaryId
    undefined, // motivationalBannerId
    undefined, // festivalId
    eventId // storiesEventsId - strict isolation
  );

  // Auto-navigate to banner preview with story event data
  useEffect(() => {
    if (!eventId) {
      toast.error("Event ID is required");
      navigate("/dashboard");
      return;
    }

    if (!profile || !templates || templates.length === 0 || !eventType) {
      return; // Wait for data to load
    }

    // Get the first template for this event
    const firstTemplate = templates[0];

    // Build uplines from banner settings
    const uplines: Upline[] = bannerSettings?.upline_avatars?.map((upline, index) => ({
      id: `upline-${index}`,
      name: upline.name,
      avatar: upline.avatar_url
    })) || [];

    // Auto-navigate to banner preview with pre-filled story event data
    // STORY AUTO-INJECT: Profile photo, rank badge, username, and contact details
    navigate("/banner-preview", {
      state: {
        categoryType: 'story', // Always 'story' for stories_events
        rankName: eventType === 'birthday' ? 'Birthday Celebration' : 
                 eventType === 'anniversary' ? 'Anniversary Celebration' : 
                 'Event Celebration',
        name: profile.name || "", // AUTO-INJECT: User's name from profile
        teamCity: "", // Optional
        greeting: "", // Optional
        photo: null, // Achiever photo optional - will use profile photo if not uploaded
        uplines,
        slotStickers: {},
        templates,
        templateId: firstTemplate.id,
        eventId: eventId, // Pass eventId for story background slot fetching
        storyId: eventId, // Also pass as storyId for clarity
        rankId: undefined
      },
      replace: true // Replace history entry to prevent back button issues
    });
  }, [eventId, eventType, profile, templates, bannerSettings, navigate]);

  // Loading state
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6">
      <div className="text-center max-w-screen-md mx-auto">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading story banner...</p>
      </div>
    </div>
  );
}

