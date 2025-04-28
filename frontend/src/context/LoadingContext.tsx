import { createContext, useContext, useState, useRef, useCallback } from "react";

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoadingState] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minDuration = 1000; // Minimum duration to show spinner (in ms)

  // Prevent flickering by using useCallback to avoid resetting state during rapid changes
  const setIsLoading = useCallback((loading: boolean) => {
    // If starting the loading, set the state and initialize the timer
    if (loading) {
      // Cancel any ongoing timeout if new loading starts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Start loading and store the time
      setIsLoadingState(true);
      startTimeRef.current = Date.now();
    } else {
      // If stopping loading, calculate how much time is left
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = minDuration - elapsed;

        if (remaining > 0) {
          // If less time passed than the minimum, wait until the minimum duration
          timeoutRef.current = setTimeout(() => {
            setIsLoadingState(false);
            startTimeRef.current = null;
            timeoutRef.current = null;
          }, remaining);
        } else {
          // If already passed minimum time, stop immediately
          setIsLoadingState(false);
          startTimeRef.current = null;
          timeoutRef.current = null;
        }
      } else {
        setIsLoadingState(false);
      }
    }
  }, [minDuration]);  // Dependencies are stable

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used inside a LoadingProvider");
  }
  return context;
}
