import { v4 as uuidv4 } from "uuid";
import { User as PrivyUser } from "@/hooks/usePrivy";

export async function identifyUser(
  userId: string,
  anonymousId: string,
  user: PrivyUser,
) {
  try {
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString();
    const userEmail =
      user?.email?.address || user?.google?.email || user?.discord?.email;

    const payload = {
      userId,
      anonymousId,
      properties: {
        $name: userId,
        distinct_id: userId,
        $email: userEmail,
        user_id: userId,
        user_type: "authenticated",
        $last_login: currentDateString,
        authenticated: true,
        first_time_properties: {
          $first_login: currentDateString,
          first_wallet_address: user?.wallet?.address,
          first_email: userEmail,
        },
      },
    };

    console.log("Sending identify request:", payload);

    const response = await fetch("/api/mixpanel/identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to identify user: ${errorData.error || response.statusText}`,
      );
    }

    const data = await response.json();
    console.log("Identify response:", data);
  } catch (error) {
    console.error("Error in identifyUser:", error);
  }
}

export function handleDistinctId() {
  let distinctId = localStorage.getItem("mixpanel_distinct_id");
  if (!distinctId) {
    distinctId = uuidv4();
    localStorage.setItem("mixpanel_distinct_id", distinctId);
  }

  return distinctId;
}

export function handleSessionId() {
  let sessionId = sessionStorage.getItem("mixpanel_session_id");
  if (!sessionId) {
    sessionId = uuidv4();
    console.log(
      "Initializing Mixpanel Session: sessionId is null, generating new sessionId",
      sessionId,
    );
    sessionStorage.setItem("mixpanel_session_id", sessionId);
  }

  return sessionId;
}

// export function setCookies(
//   distinctId: string,
//   sessionId: string,
//   userId?: string,
// ) {
//   document.cookie = `mixpanel_distinct_id=${distinctId}; path=/`;
//   document.cookie = `mixpanel_session_id=${sessionId}; path=/`;
//   if (userId) {
//     document.cookie = `mixpanel_user_id=${userId}; path=/`;
//   }
// }

export function handleSessionEnd() {
  const sessionId = localStorage.getItem("mixpanel_session_id");
  if (sessionId) {
    localStorage.removeItem("mixpanel_session_id");
    console.log("Cleaning Up Mixpanel Session: sessionId is", sessionId);
  }
}
