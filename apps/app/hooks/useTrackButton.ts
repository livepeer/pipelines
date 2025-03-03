import { useCallback } from "react";
import { useTrack } from "./useTrack";
import { TrackEventName, TrackProperties } from "@/lib/analytics/event-types";

export function useTrackButton(
  eventName: TrackEventName,
  properties?: TrackProperties,
) {
  const { trackEvent } = useTrack();

  const onClick = useCallback(
    (e?: React.MouseEvent) => {
      trackEvent(eventName, {
        component: "button",
        ...properties,
      });

      return true;
    },
    [trackEvent, eventName, properties],
  );

  return { onClick };
}
