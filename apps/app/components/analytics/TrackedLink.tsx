import React from "react";
import Link from "next/link";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { TrackEventName, TrackProperties } from "@/lib/analytics/event-types";

interface TrackedLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  trackingEvent: TrackEventName;
  trackingProperties?: TrackProperties;
  isExternal?: boolean;
  nextLinkProps?: any;
}

export const TrackedLink: React.FC<TrackedLinkProps> = ({
  href,
  trackingEvent,
  trackingProperties,
  onClick,
  onMouseEnter,
  children,
  isExternal = false,
  nextLinkProps = {},
  ...props
}) => {
  const { onClick: trackClick, onMouseEnter: trackHover } = useTrackEvent(
    trackingEvent,
    {
      href,
      ...trackingProperties,
    },
    { component: "link" },
  );

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackClick(e);
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackHover(e);
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  if (
    isExternal ||
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return (
      <a
        href={href}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  }

  // For internal routing with Next.js Link
  return (
    <Link
      href={href}
      {...nextLinkProps}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
};
