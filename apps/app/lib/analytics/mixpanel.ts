import mixpanel from "mixpanel-browser";
import { mixpanel as mixpanelConfig } from "@/lib/env";

export async function identifyUser(
  userId: string,
  anonymousId: string,
  user: any,
) {
  try {
    const payload = {
      userId,
      anonymousId,
      properties: {
        $name: userId,
        distinct_id: userId,
        $email: user?.email?.address,
        user_id: userId,
        user_type: "authenticated",
        $last_login: new Date().toISOString(),
        authenticated: true,
        first_time_properties: {
          $first_login: new Date().toISOString(),
          first_wallet_address: user?.wallet?.address,
          first_email: user?.email?.address,
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

export async function handleDistinctId(user: any) {
  let distinctId = localStorage.getItem("mixpanel_distinct_id");
  if (!distinctId) {
    distinctId = crypto.randomUUID();
    localStorage.setItem("mixpanel_distinct_id", distinctId);
  }

  return distinctId;
}

export async function handleSessionId() {
  let sessionId = localStorage.getItem("mixpanel_session_id");
  console.log("SessionTracker sessionId:", sessionId);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    console.log(
      "Initializing Mixpanel Session: sessionId is null, generating new sessionId",
      sessionId,
    );
    localStorage.setItem("mixpanel_session_id", sessionId);
  }

  return sessionId;
}

export function setCookies(
  distinctId: string,
  sessionId: string,
  userId?: string,
) {
  document.cookie = `mixpanel_distinct_id=${distinctId}; path=/`;
  document.cookie = `mixpanel_session_id=${sessionId}; path=/`;
  if (userId) {
    document.cookie = `mixpanel_user_id=${userId}; path=/`;
  }
}

export function handleSessionEnd() {
  const sessionId = localStorage.getItem("mixpanel_session_id");
  if (sessionId) {
    localStorage.removeItem("mixpanel_session_id");
    console.log("Cleaning Up Mixpanel Session: sessionId is", sessionId);
  }
}
