import { handleDistinctId, handleSessionId } from "@/lib/analytics/mixpanel";
import { getSharedParamsAuthor } from "@/app/api/streams/share-params";
import { User } from "@/hooks/usePrivy";

interface TrackProperties {
  [key: string]: any;
}

// Cache for shared params data
let sharedParamsCache: { [key: string]: any } = {};

interface SharedInfo {
  shared_id?: string;
  shared_author_id?: string;
  shared_pipeline_id?: string;
  shared_created_at?: string;
}

function getStoredIds() {
  if (typeof window === "undefined") return {};

  const distinctId = handleDistinctId();
  const sessionId = handleSessionId();
  const userId = localStorage.getItem("mixpanel_user_id");

  return {
    distinctId,
    sessionId,
    userId,
  };
}

const getSharedParamsInfo = async (): Promise<SharedInfo> => {
  if (typeof window === "undefined") return {};

  const urlParams = new URLSearchParams(window.location.search);
  const sharedParam = urlParams.get("shared");

  let sharedInfo: SharedInfo = {};
  if (sharedParam) {
    // Check if we already have this shared param data in cache
    if (sharedParamsCache[sharedParam]) {
      sharedInfo = sharedParamsCache[sharedParam];
    } else {
      try {
        const { data, error } = await getSharedParamsAuthor(sharedParam);
        if (!error && data) {
          sharedInfo = {
            shared_id: sharedParam,
            shared_author_id: data.author,
            shared_pipeline_id: data.pipeline,
            shared_created_at: data.created_at,
          };
          // Store in cache for future use
          sharedParamsCache[sharedParam] = sharedInfo;
        }
      } catch (error) {
        console.error("Error fetching shared params info:", error);
      }
    }
  }
  return sharedInfo;
};

const getBrowserInfo = async () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return {};

  const urlParams = new URLSearchParams(window.location.search);

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
  };

  return browserInfo;
};

const track = async (
  eventName: string,
  eventProperties?: TrackProperties,
  user?: User,
): Promise<boolean> => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  if (navigator.webdriver) {
    return false;
  }

  if (process.env.DISABLE_ANALYTICS === "true") {
    console.log("Analytics disabled, skipping event tracking.");
    return false;
  }

  const { distinctId, sessionId, userId } = getStoredIds();

  if (!sessionId) {
    console.log("No sessionId found, skipping event tracking");
    return false;
  }

  const [browserInfo, sharedInfo] = await Promise.all([
    getBrowserInfo(),
    getSharedParamsInfo(),
  ]);

  const referrerType = sharedInfo.shared_id
    ? "shared_link"
    : typeof document !== "undefined" && document.referrer
      ? "external"
      : "direct";

  const data = {
    event: eventName,
    properties: {
      distinct_id: distinctId,
      $user_id: userId,
      $session_id: sessionId,
      referrer_type: referrerType,
      ...sharedInfo,
      ...browserInfo,
      ...eventProperties,
    },
  };

  try {
    const response = await fetch(`/api/mixpanel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      try {
        const errorBody = await response.text();
        console.error(
          `HTTP error! status: ${response.status}, body: ${errorBody}`,
        );
      } catch (e) {
        console.error(
          `HTTP error! status: ${response.status}. Failed to read error body.`,
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Error tracking event:", error);
    return false;
  }
};

export default track;
