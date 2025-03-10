import Image from "next/image";

export default function WelcomeScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <Image
        src="/image.png"
        alt="Background"
        fill
        priority
        className="object-cover z-0 opacity-50"
        quality={100}
      />
      <div className="z-10 relative bg-[#EDEDED] p-14 rounded-[23px] max-w-[812px] w-full">
        <div className="flex flex-col gap-[22px]">
          <div className="flex flex-col w-full">
            <h1 className="font-playfair font-bold text-[64px] leading-tight text-[#1C1C1C]">
              Welcome to Daydream
            </h1>
          </div>

          <p className="font-playfair font-semibold text-2xl text-[#1C1C1C] w-full">
            ✨ Dream it. Build it. Share it.
          </p>

          <div className="w-full h-px bg-[#D2D2D2]"></div>

          <p className="font-open-sans text-lg leading-[1.55em] text-[#232323]">
            Daydream is a limitless portal for transforming your video 🚀
            <br />
            <br />
            Whether you're crafting stories, building experiences, or
            experimenting with something entirely new, this is your playground.
          </p>

          <p className="font-playfair font-semibold text-2xl text-[#1C1C1C] w-full">
            But first, let's get to know you!
          </p>

          <div className="flex flex-row flex-wrap gap-10 items-center w-full">
            <button className="w-36 h-[30px] px-[13px] flex justify-center items-center gap-1 bg-white text-[#232323] text-[13px] font-normal font-inter rounded-full border border-[#83A5B5]">
              Streamer
            </button>
            <button className="w-36 h-[30px] px-[13px] flex justify-center items-center gap-1 bg-white text-[#232323] text-[13px] font-normal font-inter rounded-full border border-[#83A5B5]">
              Content Creator
            </button>
            <button className="w-36 h-[30px] px-[13px] flex justify-center items-center gap-1 bg-white text-[#232323] text-[13px] font-normal font-inter rounded-full border border-[#83A5B5]">
              Live Performer
            </button>
            <button className="w-36 h-[30px] px-[13px] flex justify-center items-center gap-1 bg-white text-[#232323] text-[13px] font-normal font-inter rounded-full border border-[#83A5B5]">
              Other
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
