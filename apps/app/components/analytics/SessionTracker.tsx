'use client';

import { useEffect } from 'react';
import track from '@/lib/track';
import { usePrivy } from '@privy-io/react-auth';

async function identifyUser(userId: string, anonymousId: string, user: any) {
  try {
    const payload = {
      userId,
      anonymousId,
      properties: {
        $name: userId,
        distinct_id: userId,
        user_id: userId,
        user_type: 'authenticated',
        $last_login: new Date().toISOString(),
        authenticated: true,
        first_time_properties: {
          $first_login: new Date().toISOString(),
          first_wallet_address: user?.wallet?.address,
          first_email: user?.email?.address
        }
      }
    };
    
    console.log("Sending identify request:", payload);
    
    const response = await fetch('/api/mixpanel/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to identify user: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log("Identify response:", data);

  } catch (error) {
    console.error("Error in identifyUser:", error);
  }
}

async function handleDistinctId(user: any) {
  let distinctId = localStorage.getItem('mixpanel_distinct_id');
  
  if (!distinctId) {
    distinctId = crypto.randomUUID();
    localStorage.setItem('mixpanel_distinct_id', distinctId);
  }

  await identifyUser(user.id, distinctId, user);
  // Only handle user identification if there is an authenticated user
  if (user?.id) {
    if (distinctId !== user.id) {
      await identifyUser(user.id, distinctId, user);
    }
    localStorage.setItem('mixpanel_user_id', user.id);
    localStorage.setItem('mixpanel_distinct_id', user.id);
    distinctId = user.id;
  }

  return distinctId;
}

async function handleSessionId(user: any, distinctId: string) {
  let sessionId = localStorage.getItem('mixpanel_session_id');
  console.log("SessionTracker sessionId:", sessionId);
  if (!sessionId) {
    console.log("SessionTracker sessionId is null, generating new sessionId");
    sessionId = crypto.randomUUID();
    localStorage.setItem('mixpanel_session_id', sessionId);
    
    await track('$session_start', {
      $session_id: sessionId,
      $session_start_time: Date.now(),
      path: window.location.pathname,
      distinct_id: distinctId,
      $user_id: user?.id,
    });
  }

  return sessionId;
}

function setCookies(distinctId: string, sessionId: string, userId?: string) {
  document.cookie = `mixpanel_distinct_id=${distinctId}; path=/`;
  document.cookie = `mixpanel_session_id=${sessionId}; path=/`;
  if (userId) {
    document.cookie = `mixpanel_user_id=${userId}; path=/`;
  }
}

async function handleSessionEnd() {
  const sessionId = localStorage.getItem('mixpanel_session_id');
  if (sessionId) {
    const distinctId = localStorage.getItem('mixpanel_distinct_id');
    const userId = localStorage.getItem('mixpanel_user_id');

    await track('$session_end', {
      $session_id: sessionId,
      distinct_id: distinctId,
      $user_id: userId,
      $current_url: window.location.href,
    });
    localStorage.removeItem('mixpanel_session_id');
  }
}

export default function SessionTracker() {
  const { user, authenticated, ready } = usePrivy();

  useEffect(() => {
    if (!ready) return;

    const initSession = async () => {
      const distinctId = await handleDistinctId(authenticated ? user : null);
      const sessionId = await handleSessionId(authenticated ? user : null, distinctId || '');
      if (authenticated) {
        setCookies(distinctId || '', sessionId || '', user?.id || '');
      } else {
        setCookies(distinctId || '', sessionId || '');
      }
    };

    initSession();

    return () => {
      handleSessionEnd();
    };
  }, [user, authenticated, ready]);

  return null;
}
