import { User as PrivyUser } from "@/hooks/usePrivy";
import { v4 as uuidv4 } from "uuid";

export const DISTINCT_ID_KEY = "mixpanel_distinct_id";

export function handleDistinctId() {
  let distinctId = localStorage.getItem(DISTINCT_ID_KEY);
  if (!distinctId) {
    distinctId = uuidv4();
    localStorage.setItem(DISTINCT_ID_KEY, distinctId);
  }

  return distinctId;
}

export const SESSION_ID_KEY = "mixpanel_session_id";
const SESSION_TIMESTAMP_KEY = "mixpanel_session_timestamp";
const SESSION_TIMEOUT = 60 * 60 * 1000;

export function handleSessionId() {
  const currentTime = Date.now();
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

  const sessionTimestampStr = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
  const sessionTimestamp = sessionTimestampStr
    ? parseInt(sessionTimestampStr, 10)
    : null;

  if (
    !sessionId ||
    !sessionTimestamp ||
    currentTime - sessionTimestamp > SESSION_TIMEOUT
  ) {
    sessionId = uuidv4();
    console.log(
      "Initializing Mixpanel Session: sessionId is missing or expired, generating new sessionId",
      sessionId,
    );
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, currentTime.toString());
  } else {
    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, currentTime.toString());
  }

  return sessionId;
}
