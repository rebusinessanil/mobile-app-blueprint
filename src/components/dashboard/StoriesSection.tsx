import { Suspense, lazy, memo } from "react";
import StoryCard from "./StoryCard";

interface StoriesSectionProps {
  festivals: any[];
  storiesEvents: any[];
  generatedStories: any[];
}

function StoriesSectionContent({ festivals, storiesEvents, generatedStories }: StoriesSectionProps) {
  const birthdayEvents = storiesEvents.filter(e => e.event_type === 'birthday');
  const anniversaryEvents = storiesEvents.filter(e => e.event_type === 'anniversary');
  const otherEvents = storiesEvents.filter(e => e.event_type !== 'birthday' && e.event_type !== 'anniversary');
  const activeStories = generatedStories.filter(s => s.status === 'active');
  const previewStories = generatedStories.filter(s => s.status === 'preview_only');

  const hasContent = festivals.length > 0 || storiesEvents.length > 0 || generatedStories.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2 pl-4">
        <span className="text-2xl">📖</span>
        <h2 className="text-lg font-bold text-foreground">Stories</h2>
      </div>

      {/* Grid Container - Vertical scroll only */}
      <div className="px-4 space-y-4">
        {/* Festival Stories */}
        {festivals.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-primary">Festival</h3>
            <div className="grid grid-cols-4 gap-2">
              {festivals.slice(0, 8).map((festival) => (
                <StoryCard
                  key={festival.id}
                  id={festival.id}
                  title={festival.festival_name}
                  imageUrl={festival.poster_url}
                  isActive={festival.is_active}
                  linkTo={`/festival-preview/${festival.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Birthday Stories */}
        {birthdayEvents.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-primary">Birthday</h3>
            <div className="grid grid-cols-4 gap-2">
              {birthdayEvents.slice(0, 8).map((event) => (
                <StoryCard
                  key={event.id}
                  id={event.id}
                  title={event.title || event.person_name}
                  imageUrl={event.poster_url}
                  isActive={event.is_active}
                  linkTo={`/story-preview/${event.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Anniversary Stories */}
        {anniversaryEvents.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-primary">Anniversary</h3>
            <div className="grid grid-cols-4 gap-2">
              {anniversaryEvents.slice(0, 8).map((event) => (
                <StoryCard
                  key={event.id}
                  id={event.id}
                  title={event.title || event.person_name}
                  imageUrl={event.poster_url}
                  isActive={event.is_active}
                  linkTo={`/story-preview/${event.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Auto Generated Stories */}
        {activeStories.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-primary">Auto Generated</h3>
            <div className="grid grid-cols-4 gap-2">
              {activeStories.slice(0, 8).map((story) => (
                <StoryCard
                  key={story.id}
                  id={story.id}
                  title={story.title}
                  imageUrl={story.poster_url}
                  isActive={true}
                  linkTo={`/story/${story.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Preview Stories */}
        {previewStories.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-primary">Coming Soon</h3>
            <div className="grid grid-cols-4 gap-2">
              {previewStories.slice(0, 8).map((story) => (
                <StoryCard
                  key={story.id}
                  id={story.id}
                  title={story.title}
                  imageUrl={story.poster_url}
                  isPreview={true}
                  previewLabel="Tomorrow"
                  linkTo=""
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Events */}
        {otherEvents.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-primary">Events</h3>
            <div className="grid grid-cols-4 gap-2">
              {otherEvents.slice(0, 8).map((event) => (
                <StoryCard
                  key={event.id}
                  id={event.id}
                  title={event.title || event.person_name}
                  imageUrl={event.poster_url}
                  isActive={event.is_active}
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
