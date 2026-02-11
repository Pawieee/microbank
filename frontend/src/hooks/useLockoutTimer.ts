// src/hooks/useLockoutTimer.ts
import { useState, useEffect } from 'react';

export function useLockoutTimer(lockoutUntil: string | null) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!lockoutUntil) {
      setIsLocked(false);
      setTimeLeft(0);
      return;
    }

    const targetTime = new Date(lockoutUntil).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.ceil((targetTime - now) / 1000);

      if (diff <= 0) {
        setIsLocked(false);
        setTimeLeft(0);
      } else {
        setIsLocked(true);
        setTimeLeft(diff);
      }
    };

    updateTimer(); // Run immediately
    const interval = setInterval(updateTimer, 1000); // Run every second

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  return { isLocked, timeLeft };
}