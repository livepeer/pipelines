import { useState, useEffect, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";

const UNREGISTERED_TIMEOUT_SECONDS = 10 * 60; // 10 minutes

export function useTrialTimer() {
  const { authenticated, ready } = usePrivy();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!ready) return;

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

    setTimeRemaining(getInitialTime());
  }, [authenticated, ready]);

  useEffect(() => {
    if (!ready) return; 
    if (!authenticated && timeRemaining !== null) {
      const intervalId = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null) return prev;
          const newTime = prev > 0 ? prev - 1 : 0;
          localStorage.setItem("unregistered_time_remaining", newTime.toString());
          console.log(`Trial time remaining: ${Math.floor(newTime / 60)}:${(newTime % 60).toString().padStart(2, '0')}`);
          return newTime;
        });
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [authenticated, timeRemaining, ready]);

  useEffect(() => {
    if (!ready) return; 
    if (!authenticated && timeRemaining === 0) {
      console.log("Trial expired - triggering expiration event");
      window.dispatchEvent(new CustomEvent("trialExpired"));
    }
  }, [timeRemaining, authenticated, ready]);

  const formattedTime = useMemo(() => {
    if (timeRemaining === null) return "";
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  }, [timeRemaining]);

  return { timeRemaining, formattedTime };
} 