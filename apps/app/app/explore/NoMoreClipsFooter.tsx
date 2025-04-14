"use client";

import Link from "next/link";
import { cn } from "@repo/design-system/lib/utils";

export default function NoMoreClipsFooter() {
  return (
    <div className="relative w-full mt-[-12rem]">
      <div
        className="relative flex flex-col items-center justify-center py-20 pt-64 px-4 text-center"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, #fafafb 20%, #fafafb 100%)",
        }}
      >
        <div className="mb-8 mt-12 relative z-10">
          <svg
            width="80"
            height="80"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M0.305908 14.4529L0.305908 17.5L3.2968 17.5L3.2968 14.4529L0.305908 14.4529ZM0.305908 7.39808L0.305908 10.4451L3.2968 10.4451L3.2968 7.39808L0.305908 7.39808ZM13.2147 7.39808L13.2147 10.4451L16.2056 10.4451L16.2056 7.39808L13.2147 7.39808ZM0.305908 3.54706L0.305907 0.499996L3.2968 0.499996L3.2968 3.54706L0.305908 3.54706ZM6.76031 6.91402L6.76031 3.86696L9.75121 3.86696L9.75121 6.91402L6.76031 6.91402ZM6.76031 10.9258L6.76031 13.9728L9.75121 13.9728L9.75121 10.9258L6.76031 10.9258Z"
              fill="#2E2E2E"
            />
          </svg>
        </div>

        <h2 className="max-w-2xl text-balance text-center text-4xl font-extralight tracking-tight text-gray-950 sm:text-6xl whitespace-nowrap relative z-10">
          Your time to{" "}
          <span className="font-playfair font-bold inline-block">daydream</span>
        </h2>

        <p className="text-center text-base/7 font-light text-zinc-500 max-w-lg mx-auto mt-6 leading-[135%] relative z-10">
          To see more dreamscapes create a free account
        </p>

        <Link
          href="/"
          className="mt-8 px-8 py-3 bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors relative z-10"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
