import { useNavigate } from "react-router-dom";
import { useStoriesEvents } from "@/hooks/useStoriesEvents";
import { Loader2 } from "lucide-react";

export default function StoriesSlider() {
  const navigate = useNavigate();
  const { stories, loading } = useStoriesEvents();

  const handleStoryClick = (story: any) => {
    const eventType = story.event_type?.toLowerCase();
    
    // Route based on event type
    if (eventType === 'festival') {
      navigate(`/festival-preview/${story.id}`);
    } else if (eventType === 'birthday') {
      navigate(`/birthday-banner-create?eventId=${story.id}`);
    } else if (eventType === 'anniversary') {
      navigate(`/anniversary-banner-create?eventId=${story.id}`);
    } else if (eventType === 'event' || eventType === 'offer') {
      // Navigate to event page - can be customized
      navigate(`/story-preview/${story.id}`);
    } else {
      // Default to story preview
      navigate(`/story-preview/${story.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stories || stories.length === 0) {
    return null;
  }

  return (
    <div className="px-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Stories</h2>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => handleStoryClick(story)}
            className="flex-shrink-0 group"
          >
            <div className="relative">
              {/* Story Circle with Gradient Ring */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary via-accent to-primary p-[3px]">
                <div className="w-full h-full rounded-full bg-card p-[2px]">
                  <img
                    src={story.poster_url}
                    alt={story.person_name || story.title || "Story"}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              
              {/* Story Type Badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary rounded-full">
                <span className="text-[9px] font-bold text-primary-foreground uppercase">
                  {story.event_type}
                </span>
              </div>
            </div>
            
            {/* Story Title */}
            <p className="mt-2 text-xs text-center text-muted-foreground line-clamp-1 max-w-[80px]">
              {story.person_name || story.title}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
