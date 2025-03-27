import { useCallback, useEffect, useRef, useState } from "react";

const TIME_TO_FALLBACK_VIDEOJS_MS = 10000;
/**
 * This hook tracks errors and determines when to switch to the VideoJS fallback player
 * based on error patterns and video playback status.
 */
export const useFallbackDetection = (playbackId: string) => {
  const [useFallbackPlayer, setUseFallbackPlayer] = useState(false);
  const lastErrorTimeRef = useRef<number | null>(null);
  const errorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleError = useCallback(
    (error: any) => {
      let errorMessage;
      try {
        errorMessage = typeof error?.message === 'string' ? error.message : 
                       typeof error === 'string' ? error : 
                       JSON.stringify(error);
      } catch (e) {
        errorMessage = "Unserializable error object";
      }
      
      const currentTime = Date.now();
      lastErrorTimeRef.current = currentTime;
      
      if (errorMessage.includes("Failed to connect to peer")) {
        console.warn("Failed to connect to peer. Switching to VideoJS fallback player.");
        setUseFallbackPlayer(true);
        return;
      }
      
      if (!errorIntervalRef.current && !useFallbackPlayer) {
        
        if (errorIntervalRef.current) {
          clearInterval(errorIntervalRef.current);
        }
        
        errorIntervalRef.current = setInterval(() => {
          const now = Date.now();
          const lastErrorTime = lastErrorTimeRef.current || 0;
          const timeSinceLastError = now - lastErrorTime;
          
          const playerElement = document.querySelector('video');
          const isPlaying = playerElement && 
                           !playerElement.paused && 
                           playerElement.currentTime > 0 &&
                           !playerElement.ended;
          
          if (timeSinceLastError > TIME_TO_FALLBACK_VIDEOJS_MS && !isPlaying) {
            console.warn("Switching to VideoJS fallback player.");
            setUseFallbackPlayer(true);
            
            if (errorIntervalRef.current) {
              clearInterval(errorIntervalRef.current);
              errorIntervalRef.current = null;
            }
          } else if (isPlaying) {
            if (errorIntervalRef.current) {
              clearInterval(errorIntervalRef.current);
              errorIntervalRef.current = null;
            }
          }
        }, 1000);
      }
    },
    [useFallbackPlayer],
  );
  
  useEffect(() => {
    return () => {
      if (errorIntervalRef.current) {
        clearInterval(errorIntervalRef.current);
        errorIntervalRef.current = null;
      }
    };
  }, []);
  
  return { useFallbackPlayer, handleError };
}; 