import { User } from "@privy-io/react-auth";
import { isProduction } from "./env";

// Add session end tracking when the page is unloaded
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    const sessionId = sessionStorage.getItem("mixpanel_session_id");
    if (sessionId) {
      // Get the distinct ID and user info first
      const distinctId = localStorage.getItem("mixpanel_distinct_id");
      const userId = localStorage.getItem("mixpanel_user_id"); // This might be undefined if user isn't logged in

      const data = {
        event: "$session_end",
        properties: {
          $session_id: sessionId,
          distinct_id: distinctId,
          $user_id: userId,
          $current_url: window.location.href,
        },
      };

      navigator.sendBeacon("/api/mixpanel", JSON.stringify(data));
      sessionStorage.removeItem("mixpanel_session_id");
    }
  });
}

async function getDistinctId(user: User | undefined) {
  // Try to get existing distinct ID
  let distinctId = localStorage.getItem("mixpanel_distinct_id");
  console.log("Distinct ID from localStorage:", distinctId);

  // If user just logged in, identify them
  if (user?.id && distinctId && user.id !== distinctId) {
    await identifyUser(user.id, distinctId);
  }

  if (user) {
    localStorage.setItem("mixpanel_user_id", user.id);
    localStorage.setItem("mixpanel_distinct_id", user.id);
    return user.id;
  }

  if (!distinctId) {
    console.log("No distinct ID found, generating new one");
    // Generate new UUID if none exists
    distinctId = crypto.randomUUID();
    localStorage.setItem("mixpanel_distinct_id", distinctId);
  }

  return distinctId;
}

function getSessionId(user: User | undefined) {
  let sessionId = sessionStorage.getItem("mixpanel_session_id");

  console.log("Session ID already exists", sessionId);
  if (!sessionId) {
    // Generate new session ID if none exists
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("mixpanel_session_id", sessionId);
    console.log("Generating new session ID", sessionId);
    // Track session start
    track("$session_start", undefined, user);
  }

  return sessionId;
}

async function identifyUser(userId: string, anonymousId: string) {
  try {
    const response = await fetch(`/api/mixpanel/identify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        distinct_id: userId,
        anonymous_id: anonymousId,
      }),
    });
  } catch (error) {
    console.error("Error identifying user:", error);
  }
}

const track = async (
  eventName: string,
  eventProperties?: Record<string, any>,
  user?: User
) => {
  if (!isProduction()) {
    console.log("Not in production, skipping track");
    return;
  }

  const sessionId = getSessionId(user);
  const distinctId = await getDistinctId(user);

  const data = {
    event: eventName,
    properties: {
      distinct_id: distinctId,
      $user_id: user?.id,
      $session_id: sessionId,
      user_agent: navigator.userAgent,
      $browser:
        navigator.userAgent.match(
          /(?:Chrome|Firefox|Safari|Opera|Edge|IE)/
        )?.[0] || "Unknown Browser",
      $browser_version:
        navigator.userAgent.match(
          /(?:Version|Chrome|Firefox|Safari|Opera|Edge|IE)\/?\s*(\d+)/
        )?.[1] || "",
      $current_url: window.location.href,
      $device: navigator.userAgent.match(/\((.*?)\)/)?.[1] || "Unknown Device",
      $initial_referrer: document.referrer ? document.referrer : undefined,
      $initial_referring_domain: document.referrer
        ? new URL(document.referrer).hostname
        : undefined,
      $os:
        navigator.userAgent.match(/\(([^)]+)\)/)?.[1]?.split(";")[0] ||
        "Unknown OS",
      $screen_height: window.screen.height,
      $screen_width: window.screen.width,
      ...eventProperties,
    },
  };
  console.log("Tracking event", eventName, distinctId, sessionId);
  try {
    const response = await fetch(`/api/mixpanel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error tracking event:", error);
  }
};

export default track;
