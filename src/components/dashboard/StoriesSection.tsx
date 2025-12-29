import { memo, useMemo } from "react";
import StoryCard from "./StoryCard";
import { useGeneratedStories, useStoriesEvents, useStoriesFestivals } from "@/hooks/useAutoStories";
import { getISTDateString } from "@/lib/istUtils";

function StoriesSectionContent() {
  // Use realtime hooks - adminMode=false means only show visible stories (story_status IS NOT NULL)
  const { stories: generatedStories } = useGeneratedStories(false);
  const { events: storiesEvents } = useStoriesEvents(false);
  const { festivals } = useStoriesFestivals(false);

  // Memoized filtered data - Uses computed_is_live for IST-aware status
  const { birthdayEvents, anniversaryEvents, otherEvents, activeStories, upcomingStories, activeFestivals, upcomingFestivals } = useMemo(() => {
    const istToday = getISTDateString();
    
    // Helper to determine if an event is LIVE based on IST date
    const isLiveByDate = (eventDate: string) => eventDate === istToday;
    const isUpcomingByDate = (eventDate: string) => eventDate > istToday;
    
    // Filter events by type - use computed_is_live or fallback to IST date comparison
    // Only show events where is_active is true and story_status is not null (not expired)
    const birthday = storiesEvents.filter(e => 
      e.event_type === 'birthday' && 
      e.is_active !== false && 
      e.story_status !== null
    );
    const anniversary = storiesEvents.filter(e => 
      e.event_type === 'anniversary' && 
      e.is_active !== false && 
      e.story_status !== null
    );
    const other = storiesEvents.filter(e => 
      e.event_type !== 'birthday' && 
      e.event_type !== 'anniversary' && 
      e.is_active !== false && 
      e.story_status !== null
    );
    
    // Filter generated stories - use computed_is_live for accurate IST status
    const active = generatedStories.filter(s => s.computed_is_live === true);
    const upcoming = generatedStories.filter(s => s.computed_is_live === false && s.story_status !== null);
    
    // Filter festivals - use computed_is_live for accurate IST status
    const festActive = festivals.filter(f => f.is_active !== false && f.computed_is_live === true);
    const festUpcoming = festivals.filter(f => f.is_active !== false && f.computed_is_live === false && f.story_status !== null);
    
    return {
      birthdayEvents: birthday,
      anniversaryEvents: anniversary,
      otherEvents: other,
      activeStories: active,
      upcomingStories: upcoming,
      activeFestivals: festActive,
      upcomingFestivals: festUpcoming,
      // Helper functions for inline filtering
      isLiveByDate,
      isUpcomingByDate
    };
  }, [storiesEvents, generatedStories, festivals]);

  // Only show section if there are LIVE or UPCOMING stories - use computed_is_live
  const liveEvents = [...birthdayEvents, ...anniversaryEvents, ...otherEvents].filter(e => e.computed_is_live === true);
  const upcomingEvents = [...birthdayEvents, ...anniversaryEvents, ...otherEvents].filter(e => e.computed_is_live === false);
  
  const hasContent = activeFestivals.length > 0 || upcomingFestivals.length > 0 || 
                     liveEvents.length > 0 || upcomingEvents.length > 0 ||
                     activeStories.length > 0 || upcomingStories.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2 pl-4">
        <span className="text-2xl">📖</span>
        <h2 className="text-lg font-bold text-foreground">Stories</h2>
      </div>

      {/* Horizontal Scroll Container - Single row, no section headers */}
      <div 
        className="flex gap-3 overflow-x-auto pb-2 pl-4 pr-4 scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {/* Active Festival Stories (GREEN dot) */}
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

        {/* Upcoming Festival Stories (YELLOW dot) */}
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

        {/* Birthday Stories - LIVE */}
        {birthdayEvents.filter(e => e.computed_is_live === true).slice(0, 8).map((event) => (
          <StoryCard
            key={event.id}
            id={event.id}
            title={event.person_name}
            imageUrl={event.poster_url}
            storyStatus={true}
            linkTo={`/story-preview/${event.id}`}
          />
        ))}

        {/* Birthday Stories - UPCOMING */}
        {birthdayEvents.filter(e => e.computed_is_live === false).slice(0, 8).map((event) => (
          <StoryCard
            key={event.id}
            id={event.id}
            title={event.person_name}
            imageUrl={event.poster_url}
            storyStatus={false}
            previewLabel="Coming Soon"
            linkTo=""
          />
        ))}

        {/* Anniversary Stories - LIVE */}
        {anniversaryEvents.filter(e => e.computed_is_live === true).slice(0, 8).map((event) => (
          <StoryCard
            key={event.id}
            id={event.id}
            title={event.person_name}
            imageUrl={event.poster_url}
            storyStatus={true}
            linkTo={`/story-preview/${event.id}`}
          />
        ))}

        {/* Anniversary Stories - UPCOMING */}
        {anniversaryEvents.filter(e => e.computed_is_live === false).slice(0, 8).map((event) => (
          <StoryCard
            key={event.id}
            id={event.id}
            title={event.person_name}
            imageUrl={event.poster_url}
            storyStatus={false}
            previewLabel="Coming Soon"
            linkTo=""
          />
        ))}

        {/* Active Generated Stories - LIVE */}
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

        {/* Upcoming Generated Stories */}
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

        {/* Other Events - LIVE */}
        {otherEvents.filter(e => e.computed_is_live === true).slice(0, 8).map((event) => (
          <StoryCard
            key={event.id}
            id={event.id}
            title={event.person_name}
            imageUrl={event.poster_url}
            storyStatus={true}
            linkTo={`/story-preview/${event.id}`}
          />
        ))}

        {/* Other Events - UPCOMING */}
        {otherEvents.filter(e => e.computed_is_live === false).slice(0, 8).map((event) => (
          <StoryCard
            key={event.id}
            id={event.id}
            title={event.person_name}
            imageUrl={event.poster_url}
            storyStatus={false}
            previewLabel="Coming Soon"
            linkTo=""
          />
        ))}
      </div>
    </div>
  );
}

export default memo(StoriesSectionContent);
