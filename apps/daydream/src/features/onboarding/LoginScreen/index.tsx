"use client";

import Image from "next/image";
import Link from "next/link";
import GoogleLoginButton from "./GoogleLoginButton";
import DiscordLoginButton from "./DiscordLoginButton";

export default function LoginScreen() {
  return (
    <div className="min-h-screen flex flex-col-reverse sm:flex-row relative w-full h-[100dvh]">
      <Image
        src="/background.png"
        alt="Background"
        fill
        priority
        className="object-cover z-0 rotate-180"
        quality={100}
      />

      {/* Login container */}
      <div className="z-10 relative bg-white h-[55dvh] sm:h-full p-[40px] sm:p-[60px] rounded-t-[20px] sm:rounded-none w-full sm:w-1/2 shadow-lg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full gap-2 sm:gap-3">
          <h3 className="font-playfair font-bold hidden sm:block text-[24px] text-[#1C1C1C]">
            Daydream
          </h3>

          <h1 className="font-playfair font-bold text-2xl sm:text-4xl text-[#1C1C1C] text-center mt-[12px]">
            Welcome to Daydream
          </h1>

          <p className="font-inter text-xs sm:text-sm text-[#71717A] text-center mt-[4px] mb-[24px]">
            Sign in using your password
          </p>

          <div className="w-full max-w-[400px] space-y-[16px]">
            {/* Email input */}
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full h-[44px] px-4 py-2.5 border border-[#E4E4E7] rounded-[6px] text-[14px] font-inter text-[#71717A] outline-none"
            />

            {/* Sign in button */}
            <button className="w-full h-[44px] py-[10px] bg-[#18181B] rounded-[6px] text-[14px] font-inter font-medium text-white">
              Sign In with Email
            </button>

            {/* Divider */}
            <div className="flex items-center w-full my-[4px]">
              <div className="flex-grow h-px bg-[#E4E4E7]"></div>
              <div className="px-[12px]">
                <span className="text-[12px] font-inter text-[#71717A] uppercase">
                  Or continue with
                </span>
              </div>
              <div className="flex-grow h-px bg-[#E4E4E7]"></div>
            </div>

            {/* Social login buttons */}
            <div className="flex gap-[12px] w-full">
              {/* Google button */}
              <GoogleLoginButton />

              {/* Discord button */}
              <DiscordLoginButton />
            </div>
          </div>

          {/* Terms text */}
          <p className="text-[12px] font-inter text-[#A1A1AA] text-center mt-[24px]">
            By clicking continue, you agree to our{" "}
            <Link
              href="#"
              className="text-[#A1A1AA] hover:text-[#71717A] underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="text-[#A1A1AA] hover:text-[#71717A] underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="z-10 relative bg-transparent h-[45dvh] sm:h-full p-6 rounded-t-[20px] sm:rounded-none w-full sm:w-1/2 flex flex-col items-center gap-8">
        <h1 className="font-playfair font-bold hidden sm:block sm:text-[48px] text-[#1C1C1C] text-center">
          Transform your video
        </h1>

        <div className="w-full h-[calc(40dvh)] sm:max-h-none sm:h-[calc(100dvh-200px)] rounded-[20px] overflow-hidden">
          <video
            src="/daydream.mp4"
            autoPlay
            muted
            loop
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
