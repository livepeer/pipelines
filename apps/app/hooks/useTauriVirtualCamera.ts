import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';

export const useTauriVirtualCamera = (streamKey: string | null) => {
  const [isVirtualCameraRunning, setIsVirtualCameraRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startVirtualCamera = async () => {
    try {
      if (!streamKey) {
        toast.error("No stream key available");
        return;
      }
      
      setIsLoading(true);
      
      const isProduction = () => process.env.NODE_ENV === "production";
      const formattedUrl = `https://ai.livepeer.${isProduction() ? "com" : "monster"}/aiWebrtc/${streamKey}-out`;
      
      const _ = await invoke<string>('handle_stream_url', { url: formattedUrl });
      
      setIsVirtualCameraRunning(true);
      toast.success(`Virtual camera started`);
    } catch (error) {
      console.error('Error sending WebRTC URL to Tauri:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stopVirtualCamera = async () => {
    try {
      setIsLoading(true);
      
      await invoke<string>('stop_obs_virtual_camera');
      
      setIsVirtualCameraRunning(false);
      toast.success(`Virtual camera stopped`);
    } catch (error) {
      console.error('Error stopping virtual camera:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVirtualCamera = async () => {
    try {
      if (isVirtualCameraRunning) {
        await stopVirtualCamera();
      } else {
        await startVirtualCamera();
      }
    } catch (error) {
      console.error('Error toggling virtual camera:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return {
    isVirtualCameraRunning,
    isLoading,
    startVirtualCamera,
    stopVirtualCamera,
    toggleVirtualCamera
  };
}; 