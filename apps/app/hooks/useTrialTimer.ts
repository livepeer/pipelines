import { useState, useEffect, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";

const UNREGISTERED_TIMEOUT_SECONDS = 10 * 60; // 10 minutes

export function useTrialTimer() {
  const { authenticated } = usePrivy();

  const getInitialTime = () => {
    if (!authenticated && typeof window !== "undefined") {
      const stored = localStorage.getItem("unregistered_time_remaining");
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        return isNaN(parsed) ? UNREGISTERED_TIMEOUT_SECONDS : parsed;
      }
    }
    return UNREGISTERED_TIMEOUT_SECONDS;
  };

  const [timeRemaining, setTimeRemaining] = useState(getInitialTime);

  useEffect(() => {
    if (!authenticated) {
      const intervalId = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev > 0 ? prev - 1 : 0;
          localStorage.setItem("unregistered_time_remaining", newTime.toString());
          return newTime;
        });
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated && timeRemaining === 0) {
      window.dispatchEvent(new CustomEvent("trialExpired"));
    }
  }, [timeRemaining, authenticated]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  }, [timeRemaining]);

  return { timeRemaining, formattedTime };
} 