'use client';

import { ReactNode, useEffect } from 'react';
import mixpanel from 'mixpanel-browser';
import { mixpanel as mixpanelConfig } from '@/lib/env';

export function MixpanelProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.log('MixpanelProvider mounted');
    console.log('Mixpanel config:', mixpanelConfig);
    
    if (mixpanelConfig.projectToken) {
      try {
        mixpanel.init(mixpanelConfig.projectToken, { debug: true, ignore_dnt: true });
        console.log('Mixpanel initialized successfully');
      } catch (error) {
        console.error('Error initializing Mixpanel:', error);
      }
    } else {
      console.warn('No Mixpanel project token found in environment variables');
    }
  }, []);

  return <>{children}</>;
}