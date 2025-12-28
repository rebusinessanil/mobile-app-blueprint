import { useState, useEffect } from "react";
import { formatISTTimestamp, getTimeUntilISTMidnight, getISTDateString } from "@/lib/istUtils";

interface ISTClockState {
  currentTime: string;
  currentDate: string;
  timeUntilMidnight: { hours: number; minutes: number; seconds: number };
}

/**
 * Hook to get live IST clock that updates every second
 */
export function useISTClock(): ISTClockState {
  const [state, setState] = useState<ISTClockState>(() => ({
    currentTime: formatISTTimestamp(),
    currentDate: getISTDateString(),
    timeUntilMidnight: getTimeUntilISTMidnight()
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setState({
        currentTime: formatISTTimestamp(),
        currentDate: getISTDateString(),
        timeUntilMidnight: getTimeUntilISTMidnight()
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return state;
}
