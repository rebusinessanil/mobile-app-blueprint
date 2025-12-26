import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import PremiumLoader from "@/components/PremiumLoader";

interface LoadingContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Minimum display time to prevent flash
const MIN_DISPLAY_TIME = 500;
// Delay before showing loader (prevents flash for fast operations)
const SHOW_DELAY = 300;

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("Unlocking Your Account…");
  
  const showTimeRef = useRef<number>(0);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScheduledToShowRef = useRef(false);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const showLoader = useCallback((customMessage?: string) => {
    // Clear any pending hide
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (customMessage) {
      setMessage(customMessage);
    }

    // If already showing, just update message
    if (isVisible) {
      return;
    }

    // If already scheduled to show, don't reschedule
    if (isScheduledToShowRef.current) {
      return;
    }

    isScheduledToShowRef.current = true;

    // Delay showing to prevent flash for fast operations
    showTimeoutRef.current = setTimeout(() => {
      showTimeRef.current = Date.now();
      setIsVisible(true);
      isScheduledToShowRef.current = false;
    }, SHOW_DELAY);
  }, [isVisible]);

  const hideLoader = useCallback(() => {
    // If scheduled to show but not yet visible, just cancel
    if (isScheduledToShowRef.current && showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
      isScheduledToShowRef.current = false;
      return;
    }

    // If not visible, nothing to hide
    if (!isVisible) {
      return;
    }

    // Calculate how long the loader has been visible
    const elapsed = Date.now() - showTimeRef.current;
    const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    // Ensure minimum display time for smooth UX
    if (remainingTime > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setMessage("Unlocking Your Account…");
      }, remainingTime);
    } else {
      setIsVisible(false);
      setMessage("Unlocking Your Account…");
    }
  }, [isVisible]);

  return (
    <LoadingContext.Provider value={{ showLoader, hideLoader, isLoading: isVisible }}>
      {children}
      <PremiumLoader isVisible={isVisible} message={message} />
    </LoadingContext.Provider>
  );
};

export const useGlobalLoader = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useGlobalLoader must be used within a LoadingProvider");
  }
  return context;
};

// Hook for automatic loading state management
export const useAsyncLoader = () => {
  const { showLoader, hideLoader } = useGlobalLoader();
  
  const withLoader = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    showLoader(message);
    try {
      return await asyncFn();
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  return { withLoader, showLoader, hideLoader };
};
