declare module '@millicast/videojs-whep-plugin' {
  const MillicastWhepPlugin: any;
  export default MillicastWhepPlugin;
}

// Add declarations for videojs plugins
declare module 'video.js' {
  interface VideoJsPlayer {
    MillicastWhepPlugin: (options: { url: string }) => void;
  }
} 