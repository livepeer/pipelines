"use client";

const personas = ["Streamer", "Content Creator", "Live Performer", "Other"];

export default function Personas() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[12px] w-full">
      {personas.map(persona => (
        <button
          key={persona}
          className="w-full sm:max-w-none h-[30px] px-[13px] flex justify-center items-center bg-white text-[#232323] text-[13px] font-normal font-inter rounded-full border border-[#83A5B5] hover:border-[#9A9A9A] transition-colors"
        >
          {persona}
        </button>
      ))}
    </div>
  );
}
