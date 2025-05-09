/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoadingState] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minDuration = 1000;

  const setIsLoading = useCallback(
    (loading: boolean) => {
      if (loading) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setIsLoadingState(true);
        startTimeRef.current = Date.now();
      } else {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = minDuration - elapsed;

          if (remaining > 0) {
            timeoutRef.current = setTimeout(() => {
              setIsLoadingState(false);
              startTimeRef.current = null;
              timeoutRef.current = null;
            }, remaining);
          } else {
            setIsLoadingState(false);
            startTimeRef.current = null;
            timeoutRef.current = null;
          }
        } else {
          setIsLoadingState(false);
        }
      }
    },
    [minDuration]
  );

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
