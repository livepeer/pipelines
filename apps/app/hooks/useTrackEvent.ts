import { useCallback } from "react";
import { useTrack } from "./useTrack";
import { TrackEventName, TrackProperties } from "@/lib/analytics/event-types";

interface TrackEventOptions {
  component?: string;
  includeEventName?: boolean;
}

export function useTrackEvent(
  eventName: TrackEventName,
  properties?: TrackProperties,
  options?: TrackEventOptions
) {
  const { trackEvent } = useTrack();
  const { component = "element", includeEventName = true } = options || {};

  const track = useCallback(
    (action: string, value?: any) => {
      const eventToTrack = includeEventName ? `${eventName}_${action}` : eventName;
      
      const eventProps: TrackProperties = {
        component,
        action,
        ...properties,
      };
      
      if (value !== undefined) {
        eventProps.value = value;
      }
      
      trackEvent(eventToTrack, eventProps);
    },
    [trackEvent, eventName, properties, component, includeEventName]
  );

  const onClick = useCallback(
    (e?: React.MouseEvent) => {
      track("click");
      return true;
    },
    [track]
  );

  const onMouseEnter = useCallback(
    (e?: React.MouseEvent) => {
      track("hover");
      return true;
    },
    [track]
  );

  const onFocus = useCallback(
    (e?: React.FocusEvent) => {
      track("focus");
      return true;
    },
    [track]
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<any> | any) => {
      const value = e && e.target ? e.target.value : e;
      track("change", value);
      return true;
    },
    [track]
  );

  const onSubmit = useCallback(
    (e?: React.FormEvent | any) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      track("submit", e && e.target ? e.target.value : undefined);
      return false; 
    },
    [track]
  );

  const trackAction = useCallback(
    (action: string, value?: any) => {
      track(action, value);
    },
    [track]
  );

  return {
    onClick,
    onMouseEnter,
    onFocus,
    onChange,
    onSubmit,
    trackAction,
  };
} 