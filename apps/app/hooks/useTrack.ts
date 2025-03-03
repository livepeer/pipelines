import { useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import track from "@/lib/track";
import { TrackEventName, TrackProperties } from "@/lib/analytics/event-types";

export function useTrack() {
  const { user, authenticated } = usePrivy();

  const trackEvent = useCallback(
    (eventName: TrackEventName, properties?: TrackProperties) => {
      track(
        eventName,
        {
          is_authenticated: authenticated,
          ...properties,
        },
        user || undefined,
      );
    },
    [user, authenticated],
  );

  const trackClick = useCallback(
    (eventName: TrackEventName, properties?: TrackProperties) => {
      return (e?: React.MouseEvent) => {
        trackEvent(eventName, properties);
        // Don't prevent default behavior
        return true;
      };
    },
    [trackEvent],
  );

  const trackChange = useCallback(
    (eventName: TrackEventName, properties?: TrackProperties) => {
      return (value: any) => {
        trackEvent(eventName, {
          ...properties,
          value:
            typeof value?.target?.value !== "undefined"
              ? value.target.value
              : value,
        });
        // Don't interfere with the original event
        return value;
      };
    },
    [trackEvent],
  );

  const trackSubmit = useCallback(
    (eventName: TrackEventName, properties?: TrackProperties) => {
      return (e: React.FormEvent) => {
        // Prevent default form submission behavior
        e.preventDefault();
        trackEvent(eventName, properties);
      };
    },
    [trackEvent],
  );

  return {
    trackEvent,
    trackClick,
    trackChange,
    trackSubmit,
  };
}
