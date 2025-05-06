import { getSharedParamsAuthor } from "@/app/api/streams/share-params";
import { User } from "@/hooks/usePrivy";
import mixpanel from "mixpanel-browser";

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

const getSharedParamsInfo = async (): Promise<SharedInfo> => {
  if (typeof window === "undefined") return {};

  const urlParams = new URLSearchParams(window.location.search);
  const sharedParam = urlParams.get("shared");

  let sharedInfo: SharedInfo = {};
  if (sharedParam) {
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

const ensureUserIdentity = (user?: User) => {
  if (!user || typeof window === "undefined") return;

  const currentDistinctId = mixpanel.get_distinct_id();

  if (user.id && user.id !== currentDistinctId) {
    mixpanel.alias(user.id, currentDistinctId);

    mixpanel.identify(user.id);

    console.log(
      `Mixpanel: Aliased ${currentDistinctId} to ${user.id} and identified user`,
    );
  }
};

const track = async (
  eventName: string,
  eventProperties?: TrackProperties,
  user?: User,
): Promise<boolean> => {
  if (
    process.env.DISABLE_ANALYTICS === "true" ||
    typeof window === "undefined"
  ) {
    console.log(
      "Analytics disabled or running on server, skipping event tracking.",
    );
    return false;
  }

  if (user) {
    ensureUserIdentity(user);
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

  try {
    mixpanel.track(eventName, {
      referrer_type: referrerType,
      ...sharedInfo,
      ...browserInfo,
      ...eventProperties,
    });
    return true;
  } catch (error) {
    console.error("Error tracking event:", error);
    return false;
  }
};

export default track;
