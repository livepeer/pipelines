'use client';

import { useEffect } from 'react';
import track from '@/lib/track';
import { usePrivy } from '@privy-io/react-auth';
import mixpanel from 'mixpanel-browser';
import { mixpanel as mixpanelConfig } from '@/lib/env';

function identifyUser(userId: string, anonymousId: string) {
  try {
   
    console.log("identifyUser userId:", userId);
    mixpanel.identify(userId);
    console.log("mixpanel.identify(userId);");

    mixpanel.people.set({
      $userId: userId,
      last_login: new Date().toISOString(),
      authenticated: true
    });

    mixpanel.register({
      user_id: userId,
      user_type: 'authenticated'
    });

    mixpanel.alias(userId, anonymousId);
    console.log("mixpanel.alias(userId, anonymousId);");

  } catch (error) {
    console.error("Error identifying user:", error);
  }
}

async function handleDistinctId(user: any) {
  let distinctId = localStorage.getItem('mixpanel_distinct_id');
  
  if (user?.id && distinctId && user.id !== distinctId) {
	identifyUser(user.id, distinctId);
  }

  if (user) {
    localStorage.setItem('mixpanel_user_id', user.id);
    localStorage.setItem('mixpanel_distinct_id', user.id);
    distinctId = user.id;
  }

  if (!distinctId) {
    distinctId = crypto.randomUUID();
    localStorage.setItem('mixpanel_distinct_id', distinctId);
    mixpanel.identify(distinctId);
  }

  identifyUser(user?.id, distinctId);

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

function handleSessionEnd() {
  const sessionId = localStorage.getItem('mixpanel_session_id');
  if (sessionId) {
    const distinctId = localStorage.getItem('mixpanel_distinct_id');
    const userId = localStorage.getItem('mixpanel_user_id');

    const data = {
      event: '$session_end',
      properties: {
        $session_id: sessionId,
        distinct_id: distinctId,
        $user_id: userId,
        $current_url: window.location.href,
      },
    };
	console.log("handleSessionEnd data:", data);
    navigator.sendBeacon('/api/mixpanel', JSON.stringify(data));
    localStorage.removeItem('mixpanel_session_id');
  }
}

export default function SessionTracker() {
  const { user, authenticated, ready } = usePrivy();
  useEffect(() => {
    if (!ready) return; // Don't initialize until Privy is ready and user is authenticated

    const initSession = async () => {
      const distinctId = await handleDistinctId(user);
      const sessionId = await handleSessionId(user, distinctId);
      setCookies(distinctId, sessionId, user?.id);
    };

    initSession();

    return () => {
      // Only end session if we're unmounting while authenticated
      if (authenticated) {
        handleSessionEnd();
      }
    };
  }, [user, authenticated, ready]);

  return null;
}
