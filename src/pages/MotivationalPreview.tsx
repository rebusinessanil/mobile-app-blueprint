import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { useTemplates } from "@/hooks/useTemplates";
import GoldCoinLoader from "@/components/GoldCoinLoader";

interface Upline {
  id: string;
  name: string;
  avatar?: string;
}

export default function MotivationalPreview() {
  const navigate = useNavigate();
  const { motivationalBannerId } = useParams<{ motivationalBannerId: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const { profile } = useProfile(userId ?? undefined);
  const { settings: bannerSettings } = useBannerSettings(userId ?? undefined);
  
  // Fetch templates for this specific motivational banner
  const { templates } = useTemplates(
    undefined, // categoryId
    undefined, // tripId
    undefined, // rankId
    undefined, // birthdayId
    undefined, // anniversaryId
    motivationalBannerId, // motivationalBannerId - strict isolation
    undefined // festivalId
  );

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Auto-navigate to banner preview with motivational data
  useEffect(() => {
    if (!motivationalBannerId) {
      toast.error("Motivational Banner ID is required");
      navigate("/categories/motivational");
      return;
    }

    if (!profile || !templates || templates.length === 0) {
      return; // Wait for data to load
    }

    // Get the first template for this motivational banner
    const firstTemplate = templates[0];

    // Build uplines from banner settings
    const uplines: Upline[] = bannerSettings?.upline_avatars?.map((upline, index) => ({
      id: `upline-${index}`,
      name: upline.name,
      avatar: upline.avatar_url
    })) || [];

    // Auto-navigate to banner preview with pre-filled motivational data
    navigate("/banner-preview", {
      state: {
        categoryType: "motivational",
        rankName: "Motivational Banner",
        name: "", // MOTIVATIONAL: No achiever name auto-load - keep empty
        teamCity: "", // Optional
        quote: "", // Optional motivational quote
        photo: null, // MOTIVATIONAL: No achiever image auto-load
        uplines,
        slotStickers: {},
        templates,
        templateId: firstTemplate.id,
        motivationalBannerId: motivationalBannerId,
        rankId: undefined
      },
      replace: true // Replace history entry to prevent back button issues
    });
  }, [motivationalBannerId, profile, templates, bannerSettings, navigate]);

  // Loading state
  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center">
      <GoldCoinLoader size="xl" message="Loading motivational banner..." />
    </div>
  );
}
