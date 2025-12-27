import { memo, useMemo } from "react";
import StoryCard from "./StoryCard";
import { useGeneratedStories, useStoriesEvents, useStoriesFestivals } from "@/hooks/useAutoStories";

function StoriesSectionContent() {
  // Use realtime hooks - adminMode=false means only show visible stories (story_status IS NOT NULL)
  const { stories: generatedStories } = useGeneratedStories(false);
  const { events: storiesEvents } = useStoriesEvents(false);
  const { festivals } = useStoriesFestivals(false);

  // Memoized filtered data
  const { birthdayEvents, anniversaryEvents, otherEvents, activeStories, upcomingStories, activeFestivals, upcomingFestivals } = useMemo(() => {
    // Filter events by type
    const birthday = storiesEvents.filter(e => e.event_type === 'birthday' && e.story_status !== null);
    const anniversary = storiesEvents.filter(e => e.event_type === 'anniversary' && e.story_status !== null);
    const other = storiesEvents.filter(e => e.event_type !== 'birthday' && e.event_type !== 'anniversary' && e.story_status !== null);
    
    // Filter generated stories by status: true = Active, false = Upcoming
    const active = generatedStories.filter(s => s.story_status === true);
    const upcoming = generatedStories.filter(s => s.story_status === false);
    
    // Filter festivals by status
    const festActive = festivals.filter(f => f.story_status === true);
    const festUpcoming = festivals.filter(f => f.story_status === false);
    
    return {
      birthdayEvents: birthday,
      anniversaryEvents: anniversary,
      otherEvents: other,
      activeStories: active,
      upcomingStories: upcoming,
      activeFestivals: festActive,
      upcomingFestivals: festUpcoming
    };
  }, [storiesEvents, generatedStories, festivals]);

  const hasContent = activeFestivals.length > 0 || upcomingFestivals.length > 0 || 
                     storiesEvents.length > 0 || generatedStories.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2 pl-4">
        <span className="text-2xl">📖</span>
        <h2 className="text-lg font-bold text-foreground">Stories</h2>
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {/* Active Festival Stories (GREEN dot) */}
        {activeFestivals.length > 0 && (
          <div className="flex-shrink-0 space-y-1.5" style={{ scrollSnapAlign: 'start' }}>
            <h3 className="text-xs font-semibold text-primary">Festival</h3>
            <div className="flex gap-2">
              {activeFestivals.slice(0, 8).map((festival) => (
                <StoryCard
                  key={festival.id}
                  id={festival.id}
                  title={festival.festival_name}
                  imageUrl={festival.poster_url}
                  storyStatus={true}
                  linkTo={`/festival-preview/${festival.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Festival Stories (YELLOW dot, locked) */}
        {upcomingFestivals.length > 0 && (
          <div className="flex-shrink-0 space-y-1.5" style={{ scrollSnapAlign: 'start' }}>
            <h3 className="text-xs font-semibold text-primary">Upcoming Festivals</h3>
            <div className="flex gap-2">
              {upcomingFestivals.slice(0, 8).map((festival) => (
                <StoryCard
                  key={festival.id}
                  id={festival.id}
                  title={festival.festival_name}
                  imageUrl={festival.poster_url}
                  storyStatus={false}
                  previewLabel="Coming Soon"
                  linkTo=""
                />
              ))}
            </div>
          </div>
        )}

        {/* Birthday Stories */}
        {birthdayEvents.length > 0 && (
          <div className="flex-shrink-0 space-y-1.5" style={{ scrollSnapAlign: 'start' }}>
            <h3 className="text-xs font-semibold text-primary">Birthday</h3>
            <div className="flex gap-2">
              {birthdayEvents.slice(0, 8).map((event) => (
                <StoryCard
                  key={event.id}
                  id={event.id}
                  title={event.title || event.person_name}
                  imageUrl={event.poster_url}
                  storyStatus={event.story_status}
                  linkTo={`/story-preview/${event.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Anniversary Stories */}
        {anniversaryEvents.length > 0 && (
          <div className="flex-shrink-0 space-y-1.5" style={{ scrollSnapAlign: 'start' }}>
            <h3 className="text-xs font-semibold text-primary">Anniversary</h3>
            <div className="flex gap-2">
              {anniversaryEvents.slice(0, 8).map((event) => (
                <StoryCard
                  key={event.id}
                  id={event.id}
                  title={event.title || event.person_name}
                  imageUrl={event.poster_url}
                  storyStatus={event.story_status}
                  linkTo={`/story-preview/${event.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Stories (story_status = true) */}
        {activeStories.length > 0 && (
          <div className="flex-shrink-0 space-y-1.5" style={{ scrollSnapAlign: 'start' }}>
            <h3 className="text-xs font-semibold text-primary">Active Now</h3>
            <div className="flex gap-2">
              {activeStories.slice(0, 8).map((story) => (
                <StoryCard
                  key={story.id}
                  id={story.id}
                  title={story.title}
                  imageUrl={story.poster_url}
                  storyStatus={true}
                  linkTo={`/story/${story.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Stories (story_status = false) */}
        {upcomingStories.length > 0 && (
          <div className="flex-shrink-0 space-y-1.5" style={{ scrollSnapAlign: 'start' }}>
            <h3 className="text-xs font-semibold text-primary">Coming Soon</h3>
            <div className="flex gap-2">
              {upcomingStories.slice(0, 8).map((story) => (
                <StoryCard
                  key={story.id}
                  id={story.id}
                  title={story.title}
                  imageUrl={story.poster_url}
                  storyStatus={false}
                  previewLabel="Tomorrow"
                  linkTo=""
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Events */}
        {otherEvents.length > 0 && (
          <div className="flex-shrink-0 space-y-1.5" style={{ scrollSnapAlign: 'start' }}>
            <h3 className="text-xs font-semibold text-primary">Events</h3>
            <div className="flex gap-2">
              {otherEvents.slice(0, 8).map((event) => (
                <StoryCard
                  key={event.id}
                  id={event.id}
                  title={event.title || event.person_name}
                  imageUrl={event.poster_url}
                  storyStatus={event.story_status}
                  linkTo={`/story-preview/${event.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(StoriesSectionContent);
