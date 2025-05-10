import React from "react";

export function VideoSection() {
  return (
    <div className="w-full md:w-[70%] relative md:rounded-lg overflow-hidden bg-black/10 backdrop-blur-sm shadow-lg md:aspect-video h-full md:h-full md:relative">
      <div className="absolute top-3 left-3 z-20 hidden md:block">
        <h1
          className="text-4xl md:text-[36px] font-bold tracking-widest italic mix-blend-difference"
          style={{ color: "rgba(255, 255, 255, 0.65)" }}
        >
          DAYDREAM
        </h1>
      </div>

      <div className="w-full h-full relative md:relative">
        <div className="fixed top-0 left-0 w-screen h-screen md:hidden z-0">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            loop
            muted
            autoPlay
            controls={false}
          >
            <source src="/placeholder.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <video
          className="absolute inset-0 w-full h-full object-cover hidden md:block"
          playsInline
          loop
          muted
          autoPlay
          controls={false}
        >
          <source src="/placeholder.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
