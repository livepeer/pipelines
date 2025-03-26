"use client";

import { sendKafkaEvent } from "@/app/api/metrics/kafka";
import { useAppConfig } from "@/hooks/useAppConfig";
import { usePrivy } from "@privy-io/react-auth";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import 'video.js/dist/video-js.css';

import MillicastWhepPlugin from '@millicast/videojs-whep-plugin';
import 'videojs-resolution-switcher/lib/videojs-resolution-switcher.css';

// @ts-ignore 
videojs.registerPlugin('MillicastWhepPlugin', MillicastWhepPlugin);

// Making CSS inline since this is just a temporary fallback player to be removed
const VideoJSStyles = () => (
  <style jsx global>{`
    /* Custom VideoJS skin to match Livepeer player */
    .video-js {
      font-size: 14px;
      color: white;
      width: 100% !important;
      height: 100% !important;
      max-width: 100%;
      max-height: 100%;
    }
    
    /* Remove padding from VideoJS container */
    .vjs-video-container > div,
    .vjs-video-container > .video-js,
    .vjs-video-container .video-js,
    .video-js .vjs-tech,
    .vjs-tech,
    .webrtc-video {
      padding: 0 !important;
      margin: 0 !important;
      background: #eeeeee !important;
    }
    
    /* Maintain aspect ratio while filling container */
    .video-js video,
    .vjs-tech {
      object-fit: contain !important;
      width: 100% !important;
      height: 100% !important;
      position: absolute;
      top: 0;
      left: 0;
    }
    
    /* Container styling */
    .vjs-video-container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      padding: 0 !important;
    }
    
    .video-js .vjs-tech {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .video-js .vjs-control-bar {
      background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 60%, rgba(0, 0, 0, 0) 100%);
      height: 3em;
      padding: 0 10px;
      display: flex;
      justify-content: space-between;
    }
    
    .video-js .vjs-big-play-button {
      background-color: rgba(0, 0, 0, 0.45);
      border: none;
      border-radius: 50%;
      width: 2em;
      height: 2em;
      line-height: 2em;
      margin-left: -1em;
      margin-top: -1em;
      transition: all 0.3s ease;
    }
    
    .video-js:hover .vjs-big-play-button {
      background-color: rgba(0, 0, 0, 0.7);
      transform: scale(1.1);
    }
    
    .video-js .vjs-loading-spinner {
      border-color: rgba(255, 255, 255, 0.7);
    }
    
    .video-js .vjs-control:focus:before,
    .video-js .vjs-control:hover:before,
    .video-js .vjs-control:focus {
      text-shadow: none;
    }
    
    /* Hide progress control (seekbar) */
    .video-js .vjs-progress-control {
      display: none !important;
    }
    
    /* Hide time display */
    .video-js .vjs-time-control {
      display: none !important;
    }
    
    /* Hide LIVE indicator */
    .video-js .vjs-live-control {
      display: none !important;
    }
    
    /* Position fullscreen button on the far right */
    .video-js .vjs-fullscreen-control {
      margin-left: auto;
      order: 99;
    }
    
    /* Hide any other controls except volume and fullscreen */
    .video-js .vjs-control:not(.vjs-volume-panel):not(.vjs-fullscreen-control):not(.vjs-mute-control) {
      display: none !important;
    }
    
    .video-js .vjs-picture-in-picture-control {
      display: none;
    }

    .video-js .vjs-modal-dialog-content {
      position: relative !important;
      color: transparent !important; /* Make text transparent */
    }
    
    .video-js .vjs-modal-dialog-content::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      margin-top: -20px;
      margin-left: -20px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      animation: vjs-spinner-spin 1s infinite linear;
    }
    
    @keyframes vjs-spinner-spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    .video-js .vjs-modal-dialog-content::after {
      content: '';
      position: absolute;
      top: 60%;
      left: 0;
      right: 0;
      text-align: center;
      color: white;
      font-size: 14px;
      font-weight: 500;
    }
    
    .video-js .vjs-error-display {
      background-color: rgba(0, 0, 0, 0.8) !important;
      height: 100% !important;
    }
  `}</style>
);

type VideoJSPlayerProps = {
  src: string;
  isMobile?: boolean;
  playbackId: string;
  streamId: string;
  pipelineId: string;
  pipelineType: string;
};

const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({
  src,
  isMobile,
  playbackId,
  streamId,
  pipelineId,
  pipelineType,
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [firstFrameTime, setFirstFrameTime] = useState<string | null>(null);
  const startTimeRef = useRef(Date.now());
  const { user } = usePrivy();
  const searchParams = useSearchParams();
  const debugMode = searchParams.get("debugMode") === "true";
  
  const isWHEP = src.includes('/whep');

  useEffect(() => {
    const sendInitialEvent = async () => {
      const result = await sendKafkaEvent(
        "stream_trace",
        {
          type: "app_send_stream_request",
          timestamp: startTimeRef.current,
          user_id: user?.id || "anonymous",
          playback_id: playbackId,
          stream_id: streamId,
          pipeline: pipelineType,
          pipeline_id: pipelineId,
          player: "videojs",
          hostname: window.location.hostname,
          viewer_info: {
            ip: "",
            user_agent: "",
            country: "",
            city: "",
          },
        },
        "daydream",
        "server",
      );
      console.log("sendKafkaEvent result app_send_stream_request", result);
    };
    sendInitialEvent();
  }, [playbackId, streamId, pipelineId, pipelineType, user]);

  const handleFirstFrame = () => {
    const currentTime = Date.now();
    setFirstFrameTime(((currentTime - startTimeRef.current) / 1000).toFixed(2));

    const sendFirstFrameEvent = async () => {
      const result = await sendKafkaEvent(
        "stream_trace",
        {
          type: "app_receive_first_segment",
          timestamp: Date.now(),
          user_id: user?.id || "anonymous",
          playback_id: playbackId,
          stream_id: streamId,
          pipeline: pipelineType,
          pipeline_id: pipelineId,
          player: "videojs",
          hostname: window.location.hostname,
          viewer_info: {
            ip: "",
            user_agent: "",
            country: "",
            city: "",
          },
        },
        "daydream",
        "server",
      );
      console.log(`sendKafkaEvent result app_receive_first_segment `, result);
    };
    sendFirstFrameEvent();
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const setupVideoJS = () => {
      const videoElement = document.createElement("video");
      videoElement.className = "video-js vjs-default-skin vjs-big-play-centered";
      videoElement.id = `video-js-${playbackId}`;
      
      if (videoRef.current) {
        videoRef.current.innerHTML = '';
        videoRef.current.appendChild(videoElement);
        
        videoRef.current.classList.add('no-padding-container');
      }

      // @ts-ignore 
      const player = videojs(videoElement, {
        controls: true,
        autoplay: true,
        responsive: true,
        fluid: true,
        liveui: true,
        muted: true,
        fill: true,
        className: 'no-padding-player'
      });

      player.on('loadeddata', () => {
        if (!firstFrameTime) {
          handleFirstFrame();
        }
      });

      player.on('error', (error: unknown) => {
        console.error('VideoJS error:', player.error());
      });

      const applyCustomStyles = () => {
        const videoEl = player.el().querySelector('video');
        if (videoEl) {
          videoEl.style.objectFit = 'contain';
          videoEl.style.width = '100%';
          videoEl.style.height = '100%';
        }
        
        const containerDiv = player.el();
        if (containerDiv) {
          containerDiv.style.padding = '0';
          containerDiv.style.margin = '0';
          
          const parentEl = containerDiv.parentElement;
          if (parentEl) {
            parentEl.style.padding = '0';
            parentEl.style.margin = '0';
          }
        }
      };
      
      player.on('loadedmetadata', applyCustomStyles);
      player.on('resize', applyCustomStyles);

      if (isWHEP) {       
        setTimeout(() => {
          try {
            player.MillicastWhepPlugin({ 
              url: src,
              debug: false,
              disableModalDialogs: true 
            });
          } catch (error) {
            console.error('Error initializing WHEP plugin:', error);
            
            const fallbackToWebRTC = async () => {
              try {
                const pc = new RTCPeerConnection({
                  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });
                
                pc.ontrack = (event) => {
                  if (player.tech().el().srcObject !== event.streams[0]) {
                    player.tech().el().srcObject = event.streams[0];
                    const videoEl = player.tech().el();
                    if (videoEl) {
                      videoEl.style.objectFit = 'contain';
                      videoEl.style.width = '100%';
                      videoEl.style.height = '100%';
                    }
                  }
                };
                
                const offer = await pc.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true
                });
                await pc.setLocalDescription(offer);
                
                const response = await fetch(src, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/sdp' },
                  body: pc.localDescription?.sdp
                });
                
                if (response.ok) {
                  const sdpAnswer = await response.text();
                  await pc.setRemoteDescription({ 
                    type: 'answer', 
                    sdp: sdpAnswer 
                  });
                }
              } catch (rtcError) {
                console.error('WebRTC fallback failed:', rtcError);
              }
            };
            
            fallbackToWebRTC();
          }
        }, 100);
      } else {
        player.src({
          src,
          type: "application/x-mpegURL"
        });
      }

      return player;
    };
    
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    
    playerRef.current = setupVideoJS();

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, isWHEP, playbackId, firstFrameTime]);

  return (
    <div className={isMobile ? "w-full h-full" : "aspect-video"}>
      <VideoJSStyles />
      <div ref={videoRef} className="h-full w-full relative vjs-video-container">
        {/* VideoJS */}
      </div>
      {debugMode && firstFrameTime && (
        <div className="absolute bottom-12 left-4 flex items-center gap-1">
          <p className="text-xs text-white/50">First Frame Loaded in:</p>
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-blue-400">{firstFrameTime}s</span>
        </div>
      )}
    </div>
  );
};

export default VideoJSPlayer; 