"use client";
import { useEffect } from "react";
import track from "@/lib/track";
import { usePrivy } from "@/hooks/usePrivy";

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
