"use client";

import Image from "next/image";
import Personas from "./Personas";
import CameraAccess from "./CameraAccess";
import Footer from "./Footer";

export default function WelcomeScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-y-auto">
      <Image
        src="/background.png"
        alt="Background"
        fill
        priority
        className="object-cover z-0 opacity-[55%]"
        quality={100}
      />
      <div className="z-10 relative bg-[#EDEDED] p-[16px] sm:p-[24px] md:p-[56px] rounded-[23px] w-[90%] sm:w-[80%] md:max-w-[812px]">
        <div className="flex flex-col gap-[24px] py-[12px]">
          <div className="flex flex-col w-full gap-[8px]">
            <h1 className="font-playfair font-bold text-[30px] sm:text-[45px] md:text-[64px] leading-[1.2em] text-[#1C1C1C]">
              Welcome to Daydream
            </h1>

            <p className="font-playfair font-semibold text-[18px] sm:text-xl md:text-2xl text-[#1C1C1C]">
              ✨ Dream it. Build it. Share it.
            </p>
          </div>

          <div className="w-full h-px bg-[#D2D2D2]"></div>

          <div className="flex flex-col gap-[16px]">
            <p className="font-open-sans text-base sm:text-lg leading-[1.35em] text-[#232323]">
              Daydream is a <span className="font-black">limitless</span> portal
              for transforming your video 🚀
            </p>
            <p className="font-open-sans text-base sm:text-lg leading-[1.35em] text-[#232323]">
              Whether you're crafting stories, building experiences, or
              experimenting with something entirely new, this is your
              playground.
            </p>
          </div>

          <p className="font-playfair font-semibold text-[18px] sm:text-xl md:text-2xl text-[#1C1C1C]">
            But first, let’s get to know you!
          </p>

          <Personas />

          <CameraAccess />
        </div>
      </div>
      <Footer />
    </div>
  );
}
