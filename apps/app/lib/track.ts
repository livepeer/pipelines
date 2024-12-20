import { User } from "@privy-io/react-auth";
import { isProduction } from "./env";
import mixpanel from 'mixpanel-browser';
interface TrackProperties {
  [key: string]: any;
}

function getStoredIds() {
  if (typeof window === 'undefined') return {};
  
  return {
    distinctId: localStorage.getItem('mixpanel_distinct_id'),
    sessionId: localStorage.getItem('mixpanel_session_id'),
    userId: localStorage.getItem('mixpanel_user_id'),
  };
}

function getBrowserInfo() {
  if (typeof window === 'undefined') return {};

  return {
    $os: navigator.platform,
    $browser: navigator.userAgent.split('(')[0].trim(),
    $device: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    $current_url: window.location.href,
    $referrer: document.referrer,
    user_agent: navigator.userAgent,
  };
}

const track = async (
  eventName: string,
  eventProperties?: TrackProperties,
  user?: User
) => {

  const { distinctId, sessionId, userId } = getStoredIds();
  const browserInfo = getBrowserInfo();

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

  console.log("Tracking event:", eventName);

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
