import { getSharedParamsAuthor } from "@/app/api/streams/share-params";
import {
  useDistinctIdStore,
  useSessionIdStore,
} from "@/hooks/useMixpanelStore";
import { User } from "@/hooks/usePrivy";

interface TrackProperties {
  [key: string]: any;
}

let lastTrackedEvents: { [key: string]: number } = {};
const DEBOUNCE_TIME = 1000; // 1000ms debounce

// Cache for shared params data
let sharedParamsCache: { [key: string]: any } = {};

interface SharedInfo {
  shared_id?: string;
  shared_author_id?: string;
  shared_pipeline_id?: string;
  shared_created_at?: string;
}

const getSharedParamsInfo = async (): Promise<SharedInfo> => {
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
  if (typeof window === "undefined") return {};

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
) => {
  const now = Date.now();
  const lastTracked = lastTrackedEvents[eventName] || 0;

  if (process.env.DISABLE_ANALYTICS === "true") {
    return;
  }

  // Skip if event was tracked less than DEBOUNCE_TIME ago
  if (now - lastTracked < DEBOUNCE_TIME) {
    console.log(
      `Debouncing ${eventName}, last tracked ${now - lastTracked}ms ago`,
    );
    return false;
  }

  const distinctId = useDistinctIdStore.getState().distinctId;
  const sessionId = useSessionIdStore.getState().sessionId;
  const userId = user?.id;

  const browserInfo = await getBrowserInfo();
  const sharedInfo = await getSharedParamsInfo();
  const referrerType = sharedInfo.shared_id
    ? "shared_link"
    : document.referrer
      ? "external"
      : "direct";
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
