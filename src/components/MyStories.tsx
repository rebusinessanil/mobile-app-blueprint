import { useNavigate } from "react-router-dom";
import { useStoriesEvents } from "@/hooks/useStoriesEvents";
import { Loader2, Clock } from "lucide-react";

export default function MyStories() {
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
      navigate(`/story-preview/${story.id}`);
    } else {
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
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No active stories yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-foreground px-6">My Stories</h3>
      
      <div className="px-6">
        <div className="grid grid-cols-4 gap-3">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => handleStoryClick(story)}
              className="group"
            >
              <div className="relative">
                {/* Story Circle with Gradient Ring */}
                <div className="aspect-square rounded-full bg-gradient-to-tr from-primary via-accent to-primary p-[2px]">
                  <div className="w-full h-full rounded-full bg-card p-[2px]">
                    <img
                      src={story.poster_url}
                      alt={story.person_name || story.title || "Story"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Story Type Badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary rounded-full">
                  <span className="text-[8px] font-bold text-primary-foreground uppercase">
                    {story.event_type}
                  </span>
                </div>
              </div>
              
              {/* Story Title */}
              <p className="mt-2 text-[10px] text-center text-muted-foreground line-clamp-1">
                {story.person_name || story.title}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
