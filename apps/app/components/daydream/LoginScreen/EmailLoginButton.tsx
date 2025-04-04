import { useLoginWithEmail, usePrivy } from "@/hooks/usePrivy";
import track from "@/lib/track";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/design-system/components/ui/input-otp";
import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function EmailLoginButton() {
  const [email, setEmail] = useState("");
  const [inputState, setInputState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const { sendCode } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    track("daydream_login_email_clicked");
    e.preventDefault();
    e.stopPropagation();
    try {
      setInputState("loading");
      await sendCode({ email });
      setInputState("success");
    } catch (error) {
      console.error(error);
      setInputState("error");
    }
  };

  return inputState === "success" ? (
    <InputOTPControlled email={email} />
  ) : (
    <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
      {/* Email input */}
      <input
        type="email"
        placeholder="name@example.com"
        className="w-full h-[44px] px-4 py-2.5 border border-[#E4E4E7] rounded-[6px] text-[14px] font-inter text-black outline-none bg-inherit placeholder:opacity-90 placeholder:text-[#71717A]"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      {inputState === "error" && (
        <div className="text-center text-sm text-red-500">
          Please enter a valid email and try again.
        </div>
      )}

      {/* Sign in button */}
      <button
        className="w-full h-[44px] py-[10px] bg-[#18181B] rounded-[6px] text-[14px] font-inter font-medium text-white"
        type="submit"
      >
        Sign up for Beta
      </button>
    </form>
  );
}

export function InputOTPControlled({ email }: { email: string }) {
  const [value, setValue] = useState("");
  const [otpState, setOtpState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const { loginWithCode } = useLoginWithEmail();

  const handleChange = async (value: string) => {
    setValue(value);
    if (value.length === 6) {
      setOtpState("loading");
      try {
        await loginWithCode({ code: value });
        setOtpState("success");
      } catch (error) {
        console.error(error);
        setOtpState("error");
      }
    }
  };

  return (
    <div className="space-y-2 w-full flex flex-col items-center justify-center">
      <InputOTP
        maxLength={6}
        value={value}
        disabled={
          value.length === 6 && ["success", "loading"].includes(otpState)
        }
        onChange={handleChange}
      >
        <InputOTPGroup className="w-full text-black caret-slate-600">
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      {otpState === "idle" && (
        <div className="text-center text-sm text-[#71717A]">
          We&apos;ve emailed a one-time passcode to {email}. Please enter it to
          continue.
        </div>
      )}
      {otpState === "loading" && (
        <div className="text-center text-sm text-[#71717A]">
          Verifying OTP...
        </div>
      )}
      {otpState === "success" && <UserInfo />}
      {otpState === "error" && (
        <div className="text-center text-sm text-red-500">
          Invalid one-time password.
        </div>
      )}
    </div>
  );
}

export function UserInfo() {
  const { user } = usePrivy();

  const email = user?.email?.address;

  if (!email) {
    return null;
  }

  return (
    <div className="text-center text-sm text-[#71717A]">
      Signed in as {email}
    </div>
  );
}
