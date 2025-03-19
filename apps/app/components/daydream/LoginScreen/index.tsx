"use client";

import Image from "next/image";
import Link from "next/link";
import GoogleLoginButton from "./GoogleLoginButton";
import DiscordLoginButton from "./DiscordLoginButton";
import EmailLoginButton from "./EmailLoginButton";
import { cn } from "@repo/design-system/lib/utils";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import useMount from "@/hooks/useMount";
import { useTheme } from "next-themes";
import LivepeerLogo from "../LivepeerLogo";

export default function LoginScreen() {
  const isMobile = useIsMobile();
  const { setTheme } = useTheme();

  useMount(() => {
    setTheme("light");
  });

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
        <h1
          className={cn(
            "absolute top-9 left-9 font-inter text-lg md:text-xl flex flex-col uppercase font-light",
            isMobile && "left-1/2 -translate-x-1/2",
          )}
        >
          Daydream
          <div className="flex items-center gap-2 text-xs">
            <span className="uppercase text-xs">by</span>
            <LivepeerLogo className="w-16" />
          </div>
        </h1>

        <div className="flex flex-col items-center justify-center w-full gap-2 sm:gap-3">
          <h1 className="font-playfair font-bold text-2xl sm:text-4xl text-[#1C1C1C] text-center mt-[12px]">
            Welcome to Daydream
          </h1>

          <div className="w-full max-w-[400px] space-y-[16px] mt-4">
            {/* Email input */}
            <EmailLoginButton />

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
              href="https://www.livepeer.org/terms-of-service-p"
              className="text-[#A1A1AA] hover:text-[#71717A] underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="https://www.livepeer.org/privacy-policy-p"
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
