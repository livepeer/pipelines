import track from "@/lib/track";
import { useAuth } from "./AuthContext";

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.8587 3.40536C10.8128 2.52702 9.49855 2.03178 8.13311 2.00148C6.76767 1.97118 5.43276 2.40763 4.34895 3.23872C3.26514 4.06981 2.49731 5.24579 2.17233 6.57234C1.84735 7.89889 1.98468 9.29661 2.56162 10.5345C3.13855 11.7725 4.12057 12.7765 5.3454 13.3808C6.57023 13.9851 7.96457 14.1534 9.298 13.8579C10.6314 13.5625 11.8242 12.8209 12.6791 11.7558C13.534 10.6907 14 9.36581 14 8.00003H8.66667"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function GoogleLoginButton() {
  const { initOAuth, oAuthState } = useAuth();

  const handleLogin = async () => {
    track("daydream_login_google_clicked");
    try {
      await initOAuth({ provider: "google" });
    } catch (error) {
      console.error("Error initializing Google OAuth:", error);
    }
  };

  return (
    <button
      className="flex items-center justify-center h-9 gap-2 py-2.5 px-4 w-full border border-[#E4E4E7] rounded-[6px] bg-white hover:bg-[#F5F5F5] transition-colors duration-200"
      onClick={handleLogin}
      disabled={oAuthState.status === "loading"}
    >
      <GoogleIcon />
      <span className="text-[14px] font-inter font-medium text-[#09090B]">
        Google
      </span>
    </button>
  );
}
