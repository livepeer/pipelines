import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

interface ObsStatus {
  installed: boolean;
  websocket_plugin_available: boolean;
  websocket_enabled: boolean;
  virtual_camera_plugin_available: boolean;
  version_supported: boolean;
  version: string;
  message: string;
}
export interface TauriMessage {
  type: "error" | "warning" | "info";
  message: string;
}

export const useTauriVirtualCamera = (streamKey: string | null) => {
  const [isVirtualCameraRunning, setIsVirtualCameraRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [obsStatus, setObsStatus] = useState<ObsStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [tauriMessage, setTauriMessage] = useState<TauriMessage | null>(null);
  const [startTimer, setStartTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkObsStatus();
  }, []);

  useEffect(() => {
    if (startTimer) {
      clearTimeout(startTimer);
      setStartTimer(null);
    }

    if (isLoading && !isVirtualCameraRunning) {
      const timer = setTimeout(() => {
        setCustomError(
          "Unable to start virtual camera. Please check if the WebSocket server is enabled in your OBS settings.",
        );
        setIsLoading(false);
      }, 20000);

      setStartTimer(timer);
    }

    return () => {
      if (startTimer) {
        clearTimeout(startTimer);
      }
    };
  }, [isLoading, isVirtualCameraRunning]);

  useEffect(() => {
    if (statusError) {
      setTauriMessage({
        type: "error",
        message: statusError,
      });
      return;
    }

    if (!obsStatus) {
      setTauriMessage(null);
      return;
    }

    if (!obsStatus.installed) {
      setTauriMessage({
        type: "error",
        message: obsStatus.message || "OBS is not installed on your system.",
      });
    } else if (!obsStatus.virtual_camera_plugin_available) {
      setTauriMessage({
        type: "error",
        message:
          obsStatus.message || "OBS virtual camera plugin is not available.",
      });
    } else if (!obsStatus.websocket_plugin_available) {
      setTauriMessage({
        type: "warning",
        message:
          obsStatus.message ||
          "WebSocket plugin not detected. Some features may not work.",
      });
    } else if (!obsStatus.websocket_enabled) {
      setTauriMessage({
        type: "warning",
        message: "WebSocket server appears to be disabled in OBS settings.",
      });
    } else {
      setTauriMessage(null);
    }
  }, [obsStatus, statusError]);

  const checkObsStatus = async () => {
    try {
      const status = await invoke<ObsStatus>("get_obs_status");
      setObsStatus(status);
      setStatusError(null);

      if (!status.installed) {
        console.warn("OBS is not installed:", status.message);
      } else if (!status.virtual_camera_plugin_available) {
        console.warn(
          "OBS virtual camera plugin not available:",
          status.message,
        );
      }
      return status;
    } catch (error) {
      console.error("Error checking OBS status:", error);
      setStatusError(error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  const setCustomError = (message: string | null) => {
    setStatusError(message);
  };

  const startVirtualCamera = async () => {
    try {
      setIsLoading(true);
      setStatusError(null);
      const status = await checkObsStatus();
      if (status && !status.installed) {
        const errorMsg = status.message || "OBS is not installed";
        setStatusError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (status && !status.version_supported) {
        const errorMsg =
          status.message ||
          "OBS version not supported - only 30.0 and above are supported";
        setStatusError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (status && !status.virtual_camera_plugin_available) {
        const errorMsg =
          status.message || "OBS virtual camera plugin not available";
        setStatusError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (status && !status.websocket_plugin_available) {
        toast.warning(
          "OBS WebSocket plugin not detected. Operations may fail.",
        );
      }

      if (!streamKey) {
        const errorMsg = "No stream key available";
        setStatusError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      const isProduction = () => {
        return window.location.hostname === "daydream.live";
      };

      const formattedUrl = `https://ai.livepeer.${isProduction() ? "com" : "monster"}/aiWebrtc/${streamKey}-out`;

      const response = await invoke<string>("handle_stream_url", {
        url: formattedUrl,
      });

      setIsVirtualCameraRunning(true);
      toast.success(`Virtual camera started`);
    } catch (error) {
      console.error("Error sending WebRTC URL to Tauri:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setStatusError(errorMsg);
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Stop the virtual camera
   */
  const stopVirtualCamera = async () => {
    try {
      setIsLoading(true);
      setStatusError(null);

      // Use the new stop_virtual_camera command
      const response = await invoke<string>("stop_virtual_camera");

      setIsVirtualCameraRunning(false);
      toast.success(`Virtual camera stopped`);
    } catch (error) {
      console.error("Error stopping virtual camera:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setStatusError(errorMsg);
      toast.error(`Error: ${errorMsg}`);

      // If regular stop fails, try force killing
      try {
        console.warn("Attempting to force kill OBS processes");
        await invoke<string>("force_kill_obs");
        setIsVirtualCameraRunning(false);
        toast.success("OBS processes forcefully terminated");
        setStatusError(null); // Clear error since we recovered
      } catch (killError) {
        console.error("Failed even with force kill:", killError);
        const killErrorMsg =
          killError instanceof Error ? killError.message : String(killError);
        setStatusError(`Failed to stop OBS: ${killErrorMsg}`);
        toast.error(
          "Failed to stop virtual camera completely. You may need to manually quit OBS.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle the virtual camera on/off
   */
  const toggleVirtualCamera = async () => {
    try {
      if (isVirtualCameraRunning) {
        await stopVirtualCamera();
      } else {
        await startVirtualCamera();
      }
    } catch (error) {
      console.error("Error toggling virtual camera:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setStatusError(errorMsg);
      toast.error(`Error: ${errorMsg}`);
    }
  };

  /**
   * Helper function to determine if OBS is properly installed
   */
  const isObsInstalled = () => {
    return obsStatus && obsStatus.installed;
  };

  /**
   * Helper function to determine if virtual camera plugin is available
   */
  const isVirtualCameraPluginAvailable = () => {
    return obsStatus && obsStatus.virtual_camera_plugin_available;
  };

  /**
   * Helper to check if the system is ready for virtual camera operations
   */
  const isObsReadyForVirtualCamera = () => {
    return isObsInstalled() && isVirtualCameraPluginAvailable();
  };

  return {
    isVirtualCameraRunning,
    isLoading,
    obsStatus,
    statusError,
    tauriMessage,
    setCustomError,
    startVirtualCamera,
    stopVirtualCamera,
    toggleVirtualCamera,
    checkObsStatus,
    isObsInstalled,
    isVirtualCameraPluginAvailable,
    isObsReadyForVirtualCamera,
  };
};
