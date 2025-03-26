import { useLoginWithOAuth } from "@privy-io/react-auth";
import { useAuth } from "./AuthContext";
import track from "@/lib/track";

function DiscordIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.66674 11.3333C5.66674 12 4.76274 13.3333 4.44541 13.3333C3.49274 13.3333 2.64674 12.222 2.22341 11.3333C1.80007 10.222 1.90607 7.44466 3.17541 3.66666C4.10074 2.98999 5.03007 2.77332 6.00007 2.66666L6.65007 3.94866C7.54413 3.79432 8.45802 3.79432 9.35207 3.94866L10.0001 2.66666C11.0001 2.77332 12.0287 2.98999 13.0001 3.66666C14.3334 7.44466 14.4447 10.222 14.0001 11.3333C13.5554 12.222 12.6667 13.3333 11.6667 13.3333C11.3334 13.3333 10.3334 12 10.3334 11.3333M4.66667 11C7 11.6667 9 11.6667 11.3333 11M5.33333 7.99999C5.33333 8.1768 5.40357 8.34637 5.5286 8.47139C5.65362 8.59642 5.82319 8.66666 6 8.66666C6.17681 8.66666 6.34638 8.59642 6.4714 8.47139C6.59643 8.34637 6.66667 8.1768 6.66667 7.99999C6.66667 7.82318 6.59643 7.65361 6.4714 7.52859C6.34638 7.40356 6.17681 7.33332 6 7.33332C5.82319 7.33332 5.65362 7.40356 5.5286 7.52859C5.40357 7.65361 5.33333 7.82318 5.33333 7.99999ZM9.33333 7.99999C9.33333 8.1768 9.40357 8.34637 9.5286 8.47139C9.65362 8.59642 9.82319 8.66666 10 8.66666C10.1768 8.66666 10.3464 8.59642 10.4714 8.47139C10.5964 8.34637 10.6667 8.1768 10.6667 7.99999C10.6667 7.82318 10.5964 7.65361 10.4714 7.52859C10.3464 7.40356 10.1768 7.33332 10 7.33332C9.82319 7.33332 9.65362 7.40356 9.5286 7.52859C9.40357 7.65361 9.33333 7.82318 9.33333 7.99999Z"
        stroke="#161616"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DiscordLoginButton() {
  const { initOAuth, oAuthState } = useAuth();

  const handleLogin = async () => {
    track("daydream_login_discord_clicked");
    await initOAuth({ provider: "discord" });
  };

  return (
    <button
      className="flex items-center justify-center h-9 gap-2 py-2.5 px-4 w-1/2 border border-[#E4E4E7] rounded-[6px] bg-white hover:bg-[#F5F5F5] transition-colors duration-200"
      onClick={handleLogin}
      disabled={oAuthState.status === "loading"}
    >
      <DiscordIcon />
      <span className="text-[14px] font-inter font-medium text-[#09090B]">
        Discord
      </span>
    </button>
  );
}
