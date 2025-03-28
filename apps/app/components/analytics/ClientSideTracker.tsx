"use client";
import { useEffect } from "react";
import { usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";

interface ClientSideTrackerProps {
  eventName: string;
}

const ClientSideTracker = ({ eventName }: ClientSideTrackerProps) => {
  const { user } = usePrivy();

  useEffect(() => {
    track(eventName, undefined, user || undefined);
  }, [eventName, user]);

  return null;
};

export default ClientSideTracker;
