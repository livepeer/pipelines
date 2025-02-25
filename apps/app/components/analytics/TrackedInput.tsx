import React, { useState } from "react";
import { Input } from "@repo/design-system/components/ui/input";
import { useTrackInput, TrackInputOptions } from "@/hooks/useTrackInput";
import { TrackEventName, TrackProperties } from "@/lib/analytics/event-types";

interface TrackedInputProps extends React.ComponentProps<typeof Input> {
  trackingEvent: TrackEventName;
  trackingProperties?: TrackProperties;
  trackingOptions?: TrackInputOptions;
  onTrackSubmit?: (value: string) => void;
}

export const TrackedInput: React.FC<TrackedInputProps> = ({
  trackingEvent,
  trackingProperties,
  trackingOptions,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onTrackSubmit,
  ...props
}) => {
  const [inputValue, setInputValue] = useState("");
  const tracking = useTrackInput(trackingEvent, trackingProperties, trackingOptions);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (tracking.onChange) {
      tracking.onChange(e);
    }
    if (onChange) {
      onChange(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (tracking.onFocus) {
      tracking.onFocus();
    }
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (tracking.onBlur) {
      tracking.onBlur();
    }
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Track submits on Enter press
    if (e.key === 'Enter' && tracking.onSubmit) {
      tracking.onSubmit(inputValue);
      if (onTrackSubmit) {
        onTrackSubmit(inputValue);
      }
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <Input
      value={inputValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}; 