import { useCallback } from "react";
import { useTrack } from "./useTrack";
import { TrackEventName, TrackProperties } from "@/lib/analytics/event-types";

export interface TrackInputOptions {
  debounceMs?: number;
  trackChange?: boolean;
  trackFocus?: boolean;
  trackBlur?: boolean;
  trackSubmit?: boolean;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function useTrackInput(
  eventName: TrackEventName,
  properties?: TrackProperties,
  options?: TrackInputOptions,
) {
  const { trackEvent } = useTrack();
  const {
    debounceMs = 500,
    trackChange = false,
    trackFocus = false,
    trackBlur = false,
    trackSubmit = true,
  } = options || {};

  const debouncedTrack = trackChange
    ? useCallback(
        debounce((value: string) => {
          trackEvent(`${eventName}_change`, {
            component: "input",
            input_value: value,
            ...properties,
          });
        }, debounceMs),
        [trackEvent, eventName, properties, debounceMs],
      )
    : null;

  const onChange = trackChange
    ? useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const value = e.target.value;
          debouncedTrack?.(value);
        },
        [debouncedTrack],
      )
    : undefined;

  const onFocus = trackFocus
    ? useCallback(() => {
        trackEvent(`${eventName}_focus`, {
          component: "input",
          ...properties,
        });
      }, [trackEvent, eventName, properties])
    : undefined;

  const onBlur = trackBlur
    ? useCallback(() => {
        trackEvent(`${eventName}_blur`, {
          component: "input",
          ...properties,
        });
      }, [trackEvent, eventName, properties])
    : undefined;

  const onSubmit = trackSubmit
    ? useCallback(
        (value: string) => {
          trackEvent(`${eventName}_submit`, {
            component: "input",
            input_value: value,
            ...properties,
          });
        },
        [trackEvent, eventName, properties],
      )
    : undefined;

  return {
    onChange,
    onFocus,
    onBlur,
    onSubmit,
    trackSubmit: onSubmit,
  };
}
