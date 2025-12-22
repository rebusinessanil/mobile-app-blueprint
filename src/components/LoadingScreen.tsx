import { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  progress: number;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'banner';
}

/**
 * Unified loading screen with progress indicator
 * Used across the app for consistent UX during asset loading
 */
const LoadingScreenComponent = ({
  progress,
  title = 'Loading',
  subtitle = 'Please wait...',
  className = '',
  variant = 'default',
}: LoadingScreenProps) => {
  if (variant === 'minimal') {
    return (
      <div className={cn('flex flex-col items-center justify-center p-4', className)}>
        <div className="w-full max-w-xs">
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {progress}%
          </p>
        </div>
      </div>
    );
  }
  
  if (variant === 'banner') {
    return (
      <div className={cn(
        'min-h-screen bg-background flex flex-col items-center justify-center p-4',
        className
      )}>
        <div className="w-full max-w-md">
          {/* Loading indicator */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {progress}% loaded
          </p>
        </div>
      </div>
    );
  }
  
  // Default variant
  return (
    <div className={cn(
      'min-h-screen bg-navy-dark flex flex-col items-center justify-center p-4',
      className
    )}>
      <div className="w-full max-w-sm text-center">
        {/* Animated logo/icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 w-20 h-20 mx-auto rounded-2xl bg-primary/10 blur-xl animate-pulse" />
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
        
        {/* Progress bar */}
        <div className="w-full bg-card rounded-full h-3 mb-3 overflow-hidden border border-primary/20">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-sm font-medium text-primary">
          {progress}%
        </p>
      </div>
    </div>
  );
};

export const LoadingScreen = memo(LoadingScreenComponent);
LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;
