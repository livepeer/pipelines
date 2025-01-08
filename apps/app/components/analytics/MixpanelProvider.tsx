'use client';

import { ReactNode, useEffect } from 'react';
import mixpanel from 'mixpanel-browser';
import { mixpanel as mixpanelConfig } from '@/lib/env';
import { usePrivy } from '@privy-io/react-auth';

async function identifyUser(userId: string, anonymousId: string, user: any) {
  try {
    const payload = {
      userId,
      anonymousId,
      properties: {
        $name: userId,
        distinct_id: userId,
        $email: user?.email?.address,
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
    
    const response = await fetch('/api/mixpanel/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to identify user: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error in identifyUser:", error);
  }
}

export function MixpanelProvider({ children }: { children: ReactNode }) {
  const { user, authenticated, ready } = usePrivy();

  useEffect(() => {    
    if (mixpanelConfig.projectToken) {
      try {
        mixpanel.init(mixpanelConfig.projectToken, { 
          debug: true, 
          ignore_dnt: true,
          track_pageview: true,
          persistence: 'localStorage'
        });
        console.log('Mixpanel initialized successfully');
      } catch (error) {
        console.error('Error initializing Mixpanel:', error);
      }
    } else {
      console.warn('No Mixpanel project token found in environment variables');
    }
  }, []);

  // Handle user identification
  useEffect(() => {
    if (!ready) return;

    const handleIdentification = async () => {
      let distinctId;
      
      if (authenticated && user?.id) {
        distinctId = user.id;
        // Use server-side identification
        const anonymousId = localStorage.getItem('mixpanel_anonymous_id') || crypto.randomUUID();
        await identifyUser(user.id, anonymousId, user);
        mixpanel.identify(user.id);
      } else {
        // For anonymous users
        distinctId = localStorage.getItem('mixpanel_anonymous_id') || crypto.randomUUID();
        localStorage.setItem('mixpanel_anonymous_id', distinctId);
        mixpanel.identify(distinctId);
      }
    };

    handleIdentification();
  }, [user, authenticated, ready]);

  return <>{children}</>;
}