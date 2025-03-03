import React from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { useTrackButton } from "@/hooks/useTrackButton";
import { TrackEventName, TrackProperties } from "@/lib/analytics/event-types";

interface TrackedButtonProps extends React.ComponentProps<typeof Button> {
  trackingEvent: TrackEventName;
  trackingProperties?: TrackProperties;
}

export const TrackedButton: React.FC<TrackedButtonProps> = ({
  trackingEvent,
  trackingProperties,
  onClick,
  ...props
}) => {
  const { onClick: trackClick } = useTrackButton(
    trackingEvent,
    trackingProperties,
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    trackClick(e);
    if (onClick) {
      onClick(e);
    }
  };

  return <Button onClick={handleClick} {...props} />;
};
