import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Edit, Trash2 } from "lucide-react";

export interface StoryCardData {
  id: string;
  title: string;
  subtitle?: string;
  poster_url: string;
  is_active?: boolean;
  start_date: string | null;
  end_date: string | null;
  story_status: boolean | null;
  event_date?: string;
}

interface StoryCardProps {
  story: StoryCardData;
  onToggleActive?: (id: string, currentStatus: boolean) => void;
  onEdit?: (story: StoryCardData) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

// Compute status badge based on start_date and end_date
export const getStatusFromDates = (startDate: string | null, endDate: string | null, storyStatus: boolean | null): { label: string; className: string } => {
  // If we have start_date and end_date, compute from those
  if (startDate && endDate) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return { label: 'Upcoming', className: 'bg-blue-500/20 text-blue-500' };
    } else if (now >= start && now <= end) {
      return { label: 'Live', className: 'bg-green-500/20 text-green-500' };
    } else {
      return { label: 'Expired', className: 'bg-muted text-muted-foreground' };
    }
  }
  
  // Fallback to story_status: false = Upcoming, true = Live, null = Expired
  if (storyStatus === true) return { label: 'Live', className: 'bg-green-500/20 text-green-500' };
  if (storyStatus === false) return { label: 'Upcoming', className: 'bg-blue-500/20 text-blue-500' };
  return { label: 'Expired', className: 'bg-muted text-muted-foreground' };
};

// Format date to Indian format DD/MM/YYYY
export const formatIndianDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  } catch {
    return '-';
  }
};

export default function StoryCard({ story, onToggleActive, onEdit, onDelete, showActions = true }: StoryCardProps) {
  const statusBadge = getStatusFromDates(story.start_date, story.end_date, story.story_status);
  
  return (
    <div className="bg-card border border-primary/20 rounded-2xl p-3 hover:border-primary/40 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          <img src={story.poster_url} alt={story.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground text-sm truncate">{story.title}</h3>
            {story.is_active !== undefined && (
              <Badge className={`text-[10px] px-1.5 py-0 ${story.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {story.is_active ? 'Active' : 'Inactive'}
              </Badge>
            )}
            <Badge className={`text-[10px] px-1.5 py-0 ${statusBadge.className}`}>
              {statusBadge.label}
            </Badge>
          </div>
          {story.subtitle && (
            <p className="text-xs text-muted-foreground capitalize">{story.subtitle}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <span className="text-primary/70">Start:</span> {formatIndianDate(story.start_date)}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-primary/70">End:</span> {formatIndianDate(story.end_date)}
            </span>
          </div>
        </div>
        {showActions && (
          <div className="flex items-center gap-1">
            {onToggleActive && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => onToggleActive(story.id, story.is_active ?? true)}
              >
                {story.is_active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(story)}>
                <Edit className="w-4 h-4 text-primary" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(story.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
