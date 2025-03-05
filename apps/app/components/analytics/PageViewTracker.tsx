import { useEffect } from "react";
import { useTrack } from "@/hooks/useTrack";
import { TrackEventName, TrackProperties } from "@/lib/analytics/event-types";

interface PageViewTrackerProps {
  eventName: TrackEventName;
  properties?: TrackProperties;
}

export const PageViewTracker: React.FC<PageViewTrackerProps> = ({
  eventName,
  properties,
}) => {
  const { trackEvent } = useTrack();

  useEffect(() => {
    trackEvent(eventName, {
      path: window.location.pathname,
      ...properties,
    });
  }, [eventName, properties, trackEvent]);

  return null;
};
