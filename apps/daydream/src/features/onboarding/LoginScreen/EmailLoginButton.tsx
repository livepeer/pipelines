import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/design-system/components/ui/input-otp";
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { useState } from "react";

export default function EmailLoginButton() {
  const [email, setEmail] = useState("");
  const [inputState, setInputState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const { sendCode } = useLoginWithEmail();

  const handleLogin = async () => {
    try {
      setInputState("loading");
      await sendCode({ email: "ashwin@livepeer.org" });
      setInputState("success");
    } catch (error) {
      console.error(error);
      setInputState("error");
    }
  };

  return inputState === "success" ? (
    <InputOTPControlled />
  ) : (
    <>
      {/* Email input */}
      <input
        type="email"
        placeholder="name@example.com"
        className="w-full h-[44px] px-4 py-2.5 border border-[#E4E4E7] rounded-[6px] text-[14px] font-inter text-[#71717A] outline-none"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      {/* Sign in button */}
      <button
        className="w-full h-[44px] py-[10px] bg-[#18181B] rounded-[6px] text-[14px] font-inter font-medium text-white"
        onClick={handleLogin}
      >
        Sign In with Email
      </button>
    </>
  );
}

export function InputOTPControlled() {
  const [value, setValue] = useState("");
  const { loginWithCode } = useLoginWithEmail();

  const handleChange = async (value: string) => {
    setValue(value);
    if (value.length === 6) {
      try {
        await loginWithCode({ code: value });
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-2 bg-pink-50">
      <InputOTP
        maxLength={6}
        value={value}
        disabled={value.length === 6}
        onChange={handleChange}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <div className="text-center text-sm">
        {value === "" ? (
          <>Enter your one-time password.</>
        ) : (
          <>You entered: {value}</>
        )}
      </div>
      <UserInfo />
    </div>
  );
}

export function UserInfo() {
  const { user } = usePrivy();

  const email = user?.email?.address;

  if (!email) {
    return null;
  }

  return <div>{email}</div>;
}
