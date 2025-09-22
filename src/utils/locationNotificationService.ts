'use client';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
}

interface NotificationData {
  title: string;
  message: string;
  jobId?: string;
  type: 'job_assigned' | 'appointment_scheduled' | 'job_update' | 'general';
  urgent?: boolean;
}

class LocationNotificationService {
  private watchId: number | null = null;
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private isTracking = false;
  private lastKnownLocation: LocationData | null = null;
  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    this.initializeService();
  }

  /**
   * Inițializează serviciul și verifică suportul pentru funcționalități
   */
  private initializeService() {
    console.log('📍 LocationNotificationService: Initializing...');
    
    // Verifică suportul pentru geolocation
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation is not supported by this browser');
      return;
    }

    // Verifică suportul pentru notificări
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications');
      return;
    }

    this.notificationPermission = Notification.permission;
    console.log('🔔 Current notification permission:', this.notificationPermission);
  }

  /**
   * Detectează dacă utilizatorul este pe mobil
   */
  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
           ('ontouchstart' in window) || 
           (window.innerWidth <= 768);
  }

  /**
   * Cere permisiunea pentru notificări
   */
  async requestNotificationPermission(): Promise<boolean> {
    console.log('🔔 Requesting notification permission...');
    
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications');
      return false;
    }

    // Dacă permisiunea este deja acordată
    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      this.notificationPermission = 'granted';
      return true;
    }

    // Cere permisiunea
    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted!');
        // Trimite o notificare de test
        this.showNotification({
          title: '🔔 Notificări activate!',
          message: 'Vei primi notificări pentru joburi noi și programări.',
          type: 'general'
        });
        return true;
      } else {
        console.warn('❌ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Cere permisiunea pentru locație
   */
  async requestLocationPermission(): Promise<boolean> {
    console.log('📍 Requesting location permission...');
    
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation not supported');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location permission granted!');
          this.lastKnownLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy
          };
          resolve(true);
        },
        (error) => {
          console.error('❌ Location permission denied or error:', error.message);
          // Continuă să ceară permisiunea
          this.showLocationPermissionPrompt();
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  /**
   * Afișează un prompt persistent pentru locație
   */
  private showLocationPermissionPrompt() {
    if (this.isMobileDevice()) {
      const message = '📍 Pentru a oferi servicii mai bune, aplicația are nevoie de acces la locația ta. Te rog activează locația în setări.';
      
      // Afișează alert-ul și continuă să ceară permisiunea la fiecare 30 secunde
      alert(message);
      
      setTimeout(() => {
        if (!this.isTracking) {
          this.requestLocationPermission();
        }
      }, 30000); // Cere din nou după 30 secunde
    }
  }

  /**
   * Începe urmărirea locației
   */
  startLocationTracking(): boolean {
    console.log('📍 Starting location tracking...');
    
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation not supported');
      return false;
    }

    if (this.isTracking) {
      console.log('📍 Location tracking already active');
      return true;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000 // Cache locația pentru 30 secunde
    };

    // Urmărire continuă cu watchPosition
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy
        };

        this.lastKnownLocation = locationData;
        this.saveLocationToStorage(locationData);
        console.log('📍 Location updated:', locationData);
      },
      (error) => {
        console.error('❌ Location tracking error:', error.message);
        
        // Dacă pierde permisiunea, cere din nou
        if (error.code === error.PERMISSION_DENIED) {
          console.log('🔄 Location permission lost, requesting again...');
          setTimeout(() => {
            this.requestLocationPermission();
          }, 5000);
        }
      },
      options
    );

    // Backup: trimite locația la server la fiecare 2 minute
    this.locationUpdateInterval = setInterval(() => {
      if (this.lastKnownLocation) {
        this.sendLocationToServer(this.lastKnownLocation);
      }
    }, 120000); // 2 minute

    this.isTracking = true;
    console.log('✅ Location tracking started successfully');
    return true;
  }

  /**
   * Oprește urmărirea locației
   */
  stopLocationTracking() {
    console.log('📍 Stopping location tracking...');
    
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }

    this.isTracking = false;
    console.log('🛑 Location tracking stopped');
  }

  /**
   * Salvează locația în localStorage
   */
  private saveLocationToStorage(location: LocationData) {
    try {
      const locationHistory = this.getLocationHistory();
      locationHistory.push(location);
      
      // Păstrează doar ultimele 100 de locații
      if (locationHistory.length > 100) {
        locationHistory.splice(0, locationHistory.length - 100);
      }

      localStorage.setItem('worker_location_history', JSON.stringify(locationHistory));
      localStorage.setItem('worker_current_location', JSON.stringify(location));
    } catch (error) {
      console.error('❌ Error saving location to storage:', error);
    }
  }

  /**
   * Obține istoricul locațiilor
   */
  getLocationHistory(): LocationData[] {
    try {
      const history = localStorage.getItem('worker_location_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('❌ Error loading location history:', error);
      return [];
    }
  }

  /**
   * Obține locația curentă
   */
  getCurrentLocation(): LocationData | null {
    try {
      const current = localStorage.getItem('worker_current_location');
      return current ? JSON.parse(current) : null;
    } catch (error) {
      console.error('❌ Error loading current location:', error);
      return null;
    }
  }

  /**
   * Trimite locația la server
   */
  private async sendLocationToServer(location: LocationData) {
    try {
      const response = await fetch('/api/worker/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location),
      });

      if (response.ok) {
        console.log('📍 Location sent to server successfully');
      } else {
        console.warn('⚠️ Failed to send location to server');
      }
    } catch (error) {
      console.error('❌ Error sending location to server:', error);
    }
  }

  /**
   * Afișează o notificare
   */
  showNotification(data: NotificationData) {
    console.log('🔔 Showing notification:', data);
    
    if (this.notificationPermission !== 'granted') {
      console.warn('⚠️ No notification permission, showing alert instead');
      alert(`${data.title}: ${data.message}`);
      return;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.message,
        icon: '/icon-192x192.png', // Adaugă o iconită pentru notificare
        badge: '/icon-72x72.png',
        tag: data.jobId || `notification-${Date.now()}`,
        requireInteraction: data.urgent || false,
        silent: false,
      });
      
      // Vibrează dispozitivul dacă este suportat
      if ('vibrate' in navigator && data.urgent) {
        navigator.vibrate([200, 100, 200]);
      } else if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }

      // Gestionează click-ul pe notificare
      notification.onclick = () => {
        console.log('🔔 Notification clicked');
        window.focus();
        
        // Navighează la job dacă este relevant
        if (data.jobId && data.type === 'job_assigned') {
          window.location.href = '/worker/dashboard';
        } else if (data.type === 'appointment_scheduled') {
          window.location.href = '/worker/appointments';
        }
        
        notification.close();
      };

      // Auto-închide după 10 secunde (dacă nu este urgent)
      if (!data.urgent) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

    } catch (error) {
      console.error('❌ Error showing notification:', error);
      // Fallback la alert
      alert(`${data.title}: ${data.message}`);
    }
  }

  /**
   * Inițializează serviciul pentru un lucrător
   */
  async initializeForWorker(): Promise<void> {
    console.log('🚀 Initializing LocationNotificationService for worker...');
    
    // Doar pentru dispozitive mobile
    if (!this.isMobileDevice()) {
      console.log('💻 Desktop detected, skipping mobile-specific features');
      return;
    }

    console.log('📱 Mobile device detected, requesting permissions...');

    // Cere permisiunile pas cu pas
    const notificationPermission = await this.requestNotificationPermission();
    console.log('🔔 Notification permission result:', notificationPermission);

    const locationPermission = await this.requestLocationPermission();
    console.log('📍 Location permission result:', locationPermission);

    // Începe urmărirea locației dacă a fost acordată permisiunea
    if (locationPermission) {
      this.startLocationTracking();
    } else {
      // Continuă să ceară permisiunea la fiecare minut
      setInterval(() => {
        if (!this.isTracking) {
          console.log('🔄 Retrying location permission...');
          this.requestLocationPermission().then((granted) => {
            if (granted) {
              this.startLocationTracking();
            }
          });
        }
      }, 60000); // La fiecare minut
    }
  }

  /**
   * Curățenie la închidere
   */
  cleanup() {
    console.log('🧹 Cleaning up LocationNotificationService...');
    this.stopLocationTracking();
  }
}

// Export singleton instance
export const locationNotificationService = new LocationNotificationService();