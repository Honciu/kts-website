'use client';

import { useEffect } from 'react';
import { notificationService } from '@/utils/notificationService';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      notificationService.registerServiceWorker();
      
      // Request notification permission
      notificationService.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
        } else {
          console.log('❌ Notification permission denied');
        }
      });
    }
  }, []);

  return null; // This component doesn't render anything
}