import { User } from "@privy-io/react-auth";
import { handleDistinctId, handleSessionId } from "@/lib/analytics/mixpanel";

interface TrackProperties {
  [key: string]: any;
}

let lastTrackedEvents: { [key: string]: number } = {};
const DEBOUNCE_TIME = 1000; // 1000ms debounce

async function getStoredIds(user?: User) {
  if (typeof window === "undefined") return {};

  const distinctId = await handleDistinctId(user);
  const sessionId = await handleSessionId();
  const userId = localStorage.getItem("mixpanel_user_id");

  return {
    distinctId,
    sessionId,
    userId,
  };
}

const getBrowserInfo = () => {
  if (typeof window === "undefined") return {};

  const urlParams = new URLSearchParams(window.location.search);
  const sharedParam = urlParams.get("shared");

  const browserInfo = {
    $os: navigator.platform,
    $browser: navigator.userAgent.split("(")[0].trim(),
    $device: /mobile/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
    $current_url: window.location.href,
    $pathname: window.location.pathname,
    $referrer: document.referrer,
    user_agent: navigator.userAgent,
    utm_source: urlParams.get("utm_source"),
    utm_medium: urlParams.get("utm_medium"),
    utm_campaign: urlParams.get("utm_campaign"),
    utm_term: urlParams.get("utm_term"),
    utm_content: urlParams.get("utm_content"),
    shared_id: sharedParam,
    referrer_type: sharedParam
      ? "shared_link"
      : document.referrer
        ? "external"
        : "direct",
  };

  return browserInfo;
};

const track = async (
  eventName: string,
  eventProperties?: TrackProperties,
  user?: User,
) => {
  const now = Date.now();
  const lastTracked = lastTrackedEvents[eventName] || 0;

  // Skip if event was tracked less than DEBOUNCE_TIME ago
  if (now - lastTracked < DEBOUNCE_TIME) {
    console.log(
      `Debouncing ${eventName}, last tracked ${now - lastTracked}ms ago`,
    );
    return false;
  }

  const { distinctId, sessionId, userId } = await getStoredIds(user);
  const browserInfo = getBrowserInfo();
  if (!sessionId) {
    console.log("No sessionId found, skipping event tracking");
    return;
  }

  const data = {
    event: eventName,
    properties: {
      distinct_id: distinctId,
      $user_id: userId,
      $session_id: sessionId,
      ...browserInfo,
      ...eventProperties,
    },
  };

  console.log("Tracking event:", eventName, "for sessionId:", sessionId);

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

    // Update last tracked time after successful tracking
    lastTrackedEvents[eventName] = now;
    return true;
  } catch (error) {
    console.error("Error tracking event:", error);
    return false;
  }
};

export default track;
