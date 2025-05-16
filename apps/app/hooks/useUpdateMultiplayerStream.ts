import { useMultiplayerStore } from "./useMultiplayerStore";
import { useEffect } from "react";

const POLL_INTERVAL_IN_MS = 10 * 1000;

export const useUpdateMultiplayerStream = () => {
  const { setStreamInfo } = useMultiplayerStore();
  useEffect(() => {
    const retrieveStatus = async () => {
      console.log("useMultiplayerStream:: RETRIEVING STATUS");
      try {
        const response = await fetch("/api/streams/multiplayer");
        const data = await response.json();
        console.log("useMultiplayerStream:: FETCHED STATUS", data);
        setStreamInfo({
          streamKey: data.streamKey,
          originalPlaybackId: data.originalPlaybackId,
          transformedPlaybackId: data.transformedPlaybackId,
        });
      } catch (error) {
        console.error("useMultiplayerStream:: FETCHED FAILED");
        console.error("Error fetching multiplayer stream status:", error);
      }
    };

    setInterval(retrieveStatus, POLL_INTERVAL_IN_MS);
  }, []);
};
