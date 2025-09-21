// Notification Service for Browser Push Notifications

export class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  // Check if notifications are supported
  public isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Register service worker
  public async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Send notification to specific employee
  public async sendJobNotification(
    employeeName: string,
    jobId: string,
    clientName: string,
    address: string,
    serviceName: string,
    priority: 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<boolean> {
    try {
      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Create notification options
      const options: NotificationOptions = {
        body: `Nouă lucrare pentru ${clientName}\nAdresa: ${address}\nServiciu: ${serviceName}`,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: `job-${jobId}`,
        requireInteraction: priority === 'urgent',
        data: {
          jobId,
          clientName,
          address,
          serviceName,
          employeeName,
          type: 'job_assignment'
        }
      };

      // Show notification
      if (this.registration && this.registration.showNotification) {
        await this.registration.showNotification(
          `🔧 ${priority === 'urgent' ? '🚨 URGENT' : 'Nouă Lucrare'} - ${serviceName}`,
          options
        );
      } else {
        new Notification(
          `🔧 ${priority === 'urgent' ? '🚨 URGENT' : 'Nouă Lucrare'} - ${serviceName}`,
          options
        );
      }

      // Simulate sending push to mobile device
      console.log(`📱 Push notification sent to ${employeeName} for job #${jobId}`);
      
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  // Send SMS simulation (în aplicația reală ar integra cu un serviciu SMS)
  public async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Simulare trimitere SMS
      console.log(`📨 SMS sent to ${phoneNumber}: ${message}`);
      
      // În aplicația reală aici ar fi integrarea cu Twilio, SMS.ro, etc.
      // const response = await fetch('/api/sms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phoneNumber, message })
      // });

      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  // Make phone call (open dialer)
  public makePhoneCall(phoneNumber: string): void {
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // For mobile devices
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      window.location.href = `tel:${cleanNumber}`;
    } else {
      // For desktop, show a dialog with the number
      const confirmed = confirm(
        `Apelează numărul: ${phoneNumber}\n\nDacă folosești un desktop, copiază numărul și apelează de pe telefonul tău.`
      );
      if (confirmed) {
        // Copy to clipboard if available
        if (navigator.clipboard) {
          navigator.clipboard.writeText(phoneNumber);
          alert('Numărul a fost copiat în clipboard!');
        }
      }
    }
  }

  // Open navigation to address
  public navigateToAddress(address: string): void {
    const encodedAddress = encodeURIComponent(`${address}, București, România`);
    
    // Try to open Google Maps
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      // Mobile - try Google Maps app first
      window.location.href = `google.navigation:q=${encodedAddress}`;
      
      // Fallback to web version
      setTimeout(() => {
        window.open(`https://maps.google.com/maps?daddr=${encodedAddress}`, '_blank');
      }, 1000);
    } else {
      // Desktop - open in new tab
      window.open(`https://maps.google.com/maps?daddr=${encodedAddress}`, '_blank');
    }
  }

  // Send completion notification to admin
  public async sendJobCompletionNotification(
    jobId: string,
    workerName: string,
    clientName: string,
    serviceName: string
  ): Promise<boolean> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') return false;

      const options: NotificationOptions = {
        body: `Lucrarea #${jobId} pentru ${clientName} a fost finalizată de ${workerName}`,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: `job-completed-${jobId}`,
        data: {
          jobId,
          workerName,
          clientName,
          serviceName,
          type: 'job_completion'
        }
      };

      if (this.registration && this.registration.showNotification) {
        await this.registration.showNotification(
          `✅ Lucrare Finalizată - ${serviceName}`,
          options
        );
      } else {
        new Notification(`✅ Lucrare Finalizată - ${serviceName}`, options);
      }

      return true;
    } catch (error) {
      console.error('Failed to send completion notification:', error);
      return false;
    }
  }

  // Subscribe to push notifications (for production use)
  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        await this.registerServiceWorker();
      }

      if (!this.registration) {
        throw new Error('Service Worker not registered');
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
applicationServerKey: this.urlB64ToUint8Array(
          // În producție aici ar fi cheia VAPID reală
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NpQq7lNdAoHFYrdKUYfgJGaP5MWaFcnWPXoWq3e4q_Vt8PbQWcH6w'
        ) as BufferSource
      });

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();