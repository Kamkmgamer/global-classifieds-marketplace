'use client';

import { useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import * as React from 'react';

export default function AxeDev() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // Allow disabling axe-core via environment variable or localStorage
    if (process.env.NEXT_PUBLIC_DISABLE_AXE === 'true' || 
        localStorage.getItem('disable-axe') === 'true') {
      return;
    }

    // Wait a bit for dynamic content (like Clerk components) to load
    const timeoutId = setTimeout(() => {
      // Lazy import to avoid bundling in prod
      import('@axe-core/react')
        .then(({ default: axe }) => {
          try {
            // Configure axe-core with increased delay for dynamic content
            // Clerk components load asynchronously, so we need to wait
            axe(React, ReactDOM, 2000, {
              rules: {},
            });
            console.info('[a11y] axe-core/react initialized (dev only)');
          } catch (e) {
            // Silently fail - accessibility checks are nice-to-have, not critical
            console.debug('[a11y] axe-core/react initialization skipped', e);
          }
        })
        .catch(() => {
          // Silently ignore import errors
        });
    }, 1000); // Wait 1 second for Clerk and other dynamic components to load

    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
