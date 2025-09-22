'use client';

import { useEffect, useState } from 'react';
import { locationNotificationService } from '@/utils/locationNotificationService';

export const useLocationNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
             ('ontouchstart' in window) || 
             (window.innerWidth <= 768);
    };

    setIsMobile(detectMobile());
  }, []);

  const initializeService = async () => {
    if (!isMobile) {
      console.log('💻 Desktop detected - skipping mobile features');
      return;
    }

    console.log('📱 Initializing location and notification services...');
    
    try {
      await locationNotificationService.initializeForWorker();
      setIsInitialized(true);
      
      // Verifică statusul permisiunilor
      setHasNotificationPermission(Notification.permission === 'granted');
      
      // Verifică locația curentă
      const location = locationNotificationService.getCurrentLocation();
      setCurrentLocation(location);
      setHasLocationPermission(!!location);
      
    } catch (error) {
      console.error('❌ Error initializing services:', error);
    }
  };

  const requestPermissions = async () => {
    if (!isMobile) return;

    console.log('🔄 Manually requesting permissions...');
    
    const notificationResult = await locationNotificationService.requestNotificationPermission();
    setHasNotificationPermission(notificationResult);

    const locationResult = await locationNotificationService.requestLocationPermission();
    setHasLocationPermission(locationResult);

    if (locationResult) {
      locationNotificationService.startLocationTracking();
    }
  };

  const showNotification = (data: {
    title: string;
    message: string;
    jobId?: string;
    type: 'job_assigned' | 'appointment_scheduled' | 'job_update' | 'general';
    urgent?: boolean;
  }) => {
    locationNotificationService.showNotification(data);
  };

  const getLocationHistory = () => {
    return locationNotificationService.getLocationHistory();
  };

  const cleanup = () => {
    locationNotificationService.cleanup();
  };

  return {
    isInitialized,
    isMobile,
    hasLocationPermission,
    hasNotificationPermission,
    currentLocation,
    initializeService,
    requestPermissions,
    showNotification,
    getLocationHistory,
    cleanup,
  };
};