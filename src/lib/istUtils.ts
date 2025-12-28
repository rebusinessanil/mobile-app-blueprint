/**
 * IST (Indian Standard Time) Utilities
 * All time calculations are based on Asia/Kolkata timezone (UTC+5:30)
 */

/**
 * Get current date in IST
 */
export function getISTDate(): Date {
  const now = new Date();
  // Convert to IST by adding 5.5 hours offset
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  return new Date(utcTime + istOffset);
}

/**
 * Get current IST timestamp formatted as DD/MM/YYYY • HH:MM:SS
 */
export function formatISTTimestamp(date?: Date | string): string {
  const inputDate = date ? new Date(date) : new Date();
  
  // Convert to IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utcTime = inputDate.getTime() + (inputDate.getTimezoneOffset() * 60 * 1000);
  const istDate = new Date(utcTime + istOffset);
  
  const day = String(istDate.getDate()).padStart(2, '0');
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const year = istDate.getFullYear();
  
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} • ${hours}:${minutes}:${seconds}`;
}

/**
 * Get current IST date as YYYY-MM-DD string
 */
export function getISTDateString(): string {
  const istDate = getISTDate();
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to IST DD/MM/YYYY
 */
export function formatISTDate(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
    const istDate = new Date(utcTime + istOffset);
    
    const day = String(istDate.getDate()).padStart(2, '0');
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const year = istDate.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}

/**
 * Get story status based on IST date comparison
 * @param eventDate - The event/festival date (YYYY-MM-DD)
 * @param storyStatus - Current story_status from DB
 */
export function getStoryStatusIST(eventDate: string | null, storyStatus: boolean | null): { 
  label: string; 
  className: string;
  isLive: boolean;
  isUpcoming: boolean;
  isExpired: boolean;
} {
  const istToday = getISTDateString();
  
  if (eventDate) {
    if (eventDate > istToday) {
      return { 
        label: 'Upcoming', 
        className: 'bg-blue-500/20 text-blue-500',
        isLive: false,
        isUpcoming: true,
        isExpired: false
      };
    } else if (eventDate === istToday) {
      return { 
        label: 'Live', 
        className: 'bg-green-500/20 text-green-500',
        isLive: true,
        isUpcoming: false,
        isExpired: false
      };
    } else {
      return { 
        label: 'Expired', 
        className: 'bg-muted text-muted-foreground',
        isLive: false,
        isUpcoming: false,
        isExpired: true
      };
    }
  }
  
  // Fallback to story_status: true = Live, false = Upcoming, null = Expired
  if (storyStatus === true) {
    return { 
      label: 'Live', 
      className: 'bg-green-500/20 text-green-500',
      isLive: true,
      isUpcoming: false,
      isExpired: false
    };
  }
  if (storyStatus === false) {
    return { 
      label: 'Upcoming', 
      className: 'bg-blue-500/20 text-blue-500',
      isLive: false,
      isUpcoming: true,
      isExpired: false
    };
  }
  return { 
    label: 'Expired', 
    className: 'bg-muted text-muted-foreground',
    isLive: false,
    isUpcoming: false,
    isExpired: true
  };
}

/**
 * Get time until next IST midnight
 */
export function getTimeUntilISTMidnight(): { hours: number; minutes: number; seconds: number } {
  const istDate = getISTDate();
  const midnight = new Date(istDate);
  midnight.setHours(24, 0, 0, 0);
  
  const diff = midnight.getTime() - istDate.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}
