"use client";

import Image from "next/image";
import Link from "next/link";
import DiscordIcon from "./DiscordIcon";
import GoogleIcon from "./GoogleIcon";

export default function LoginScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <Image
        src="/background.png"
        alt="Background"
        fill
        priority
        className="object-cover z-0"
        quality={100}
      />
      <div className="z-10 relative bg-white p-[40px] sm:p-[60px] rounded-[20px] w-[90%] sm:w-[80%] md:max-w-[560px] shadow-lg">
        <div className="flex flex-col items-center w-full gap-[12px]">
          <h3 className="font-playfair font-bold text-[24px] text-[#1C1C1C]">
            Daydream
          </h3>

          <h1 className="font-playfair font-bold text-[32px] text-[#1C1C1C] text-center mt-[12px]">
            Welcome to Daydream
          </h1>

          <p className="font-inter text-[14px] text-[#71717A] text-center mt-[4px] mb-[24px]">
            Sign in using your password
          </p>

          <div className="w-full max-w-[400px] space-y-[16px]">
            {/* Email input */}
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full h-[44px] px-[16px] py-[10px] border border-[#E4E4E7] rounded-[6px] text-[14px] font-inter text-[#71717A] outline-none"
            />

            {/* Password input */}
            <input
              type="password"
              placeholder="Password"
              className="w-full h-[44px] px-[16px] py-[10px] border border-[#E4E4E7] rounded-[6px] text-[14px] font-inter text-[#71717A] outline-none"
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
              <button className="flex items-center justify-center gap-[8px] py-[10px] px-[16px] w-1/2 border border-[#E4E4E7] rounded-[6px] bg-white">
                <GoogleIcon />
                <span className="text-[14px] font-inter font-medium text-[#09090B]">
                  Google
                </span>
              </button>

              {/* Discord button */}
              <button className="flex items-center justify-center gap-[8px] py-[10px] px-[16px] w-1/2 border border-[#E4E4E7] rounded-[6px] bg-white">
                <DiscordIcon />
                <span className="text-[14px] font-inter font-medium text-[#09090B]">
                  Discord
                </span>
              </button>
            </div>
          </div>

          {/* Terms text */}
          <p className="text-[12px] font-inter text-[#A1A1AA] text-center mt-[24px]">
            By clicking continue, you agree to our{" "}
            <Link href="#" className="text-[#A1A1AA] hover:text-[#71717A]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-[#A1A1AA] hover:text-[#71717A]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
