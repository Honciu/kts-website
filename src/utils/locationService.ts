interface WorkerLocation {
  id: string;
  workerName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'on_job';
  currentJobId?: string;
  batteryLevel?: number;
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

class LocationService {
  private watchId: number | null = null;
  private isTracking = false;
  private currentPosition: GeolocationPosition | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private workerLocations: Map<string, WorkerLocation> = new Map();

  // Default options pentru geolocation
  private readonly defaultOptions: LocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000 // 30 secunde
  };

  /**
   * Verifică dacă geolocation este disponibil în browser
   */
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Solicită permisiunea de locație de la utilizator
   */
  async requestLocationPermission(): Promise<boolean> {
    if (!this.isGeolocationSupported()) {
      throw new Error('Geolocation nu este suportat de acest browser');
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'granted') {
        return true;
      } else if (permission.state === 'prompt') {
        // Încearcă să obțină locația pentru a declanșa prompt-ul
        await this.getCurrentPosition();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Eroare la solicitarea permisiunii de locație:', error);
      return false;
    }
  }

  /**
   * Obține poziția curentă o singură dată
   */
  getCurrentPosition(options?: LocationOptions): Promise<GeolocationPosition> {
    const opts = { ...this.defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      if (!this.isGeolocationSupported()) {
        reject(new Error('Geolocation nu este suportat'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = position;
          resolve(position);
        },
        (error) => {
          console.error('Eroare geolocation:', error);
          reject(this.handleGeolocationError(error));
        },
        opts
      );
    });
  }

  /**
   * Începe tracking-ul locației în timp real pentru un lucrător
   */
  async startTracking(workerId: string, workerName: string, options?: LocationOptions): Promise<void> {
    if (this.isTracking) {
      console.warn('Tracking-ul este deja activ');
      return;
    }

    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Permisiunea pentru locație a fost refuzată');
    }

    const opts = { ...this.defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.currentPosition = position;
          this.updateWorkerLocation(workerId, workerName, position);
          
          if (!this.isTracking) {
            this.isTracking = true;
            resolve();
          }
        },
        (error) => {
          console.error('Eroare tracking locație:', error);
          if (!this.isTracking) {
            reject(this.handleGeolocationError(error));
          }
        },
        opts
      );
    });
  }

  /**
   * Oprește tracking-ul locației
   */
  stopTracking(workerId?: string): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isTracking = false;

    if (workerId) {
      const worker = this.workerLocations.get(workerId);
      if (worker) {
        this.workerLocations.set(workerId, {
          ...worker,
          status: 'inactive',
          lastUpdated: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Actualizează locația unui lucrător
   */
  private updateWorkerLocation(workerId: string, workerName: string, position: GeolocationPosition): void {
    const workerLocation: WorkerLocation = {
      id: workerId,
      workerName,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      lastUpdated: new Date().toISOString(),
      status: 'active'
    };

    // Încearcă să obțină nivelul bateriei dacă e disponibil
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        workerLocation.batteryLevel = Math.round(battery.level * 100);
      }).catch(() => {
        // Ignoră eroarea dacă API-ul bateriei nu e disponibil
      });
    }

    this.workerLocations.set(workerId, workerLocation);

    // Trimite locația către server (simulat)
    this.sendLocationToServer(workerLocation);
  }

  /**
   * Simulează trimiterea locației către server
   */
  private async sendLocationToServer(location: WorkerLocation): Promise<void> {
    try {
      // În aplicația reală aici ar fi un API call
      console.log('📍 Locație actualizată pentru:', {
        worker: location.workerName,
        coords: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
        accuracy: `${Math.round(location.accuracy)}m`,
        time: new Date(location.lastUpdated).toLocaleTimeString('ro-RO'),
        battery: location.batteryLevel ? `${location.batteryLevel}%` : 'N/A'
      });

      // Simulează delay-ul de rețea
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Eroare la trimiterea locației:', error);
    }
  }

  /**
   * Obține locația curentă a unui lucrător
   */
  getWorkerLocation(workerId: string): WorkerLocation | null {
    return this.workerLocations.get(workerId) || null;
  }

  /**
   * Obține toate locațiile lucrătorilor
   */
  getAllWorkerLocations(): WorkerLocation[] {
    return Array.from(this.workerLocations.values());
  }

  /**
   * Verifică dacă tracking-ul este activ
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Obține poziția curentă stocată local
   */
  getCurrentStoredPosition(): GeolocationPosition | null {
    return this.currentPosition;
  }

  /**
   * Marchează lucrătorul ca fiind pe un job
   */
  setWorkerOnJob(workerId: string, jobId: string): void {
    const worker = this.workerLocations.get(workerId);
    if (worker) {
      this.workerLocations.set(workerId, {
        ...worker,
        status: 'on_job',
        currentJobId: jobId,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  /**
   * Marchează lucrătorul ca fiind disponibil (nu pe job)
   */
  setWorkerAvailable(workerId: string): void {
    const worker = this.workerLocations.get(workerId);
    if (worker) {
      this.workerLocations.set(workerId, {
        ...worker,
        status: 'active',
        currentJobId: undefined,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  /**
   * Calculează distanța dintre două puncte geografice
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raza Pământului în km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distanța în km
  }

  /**
   * Convertește grade în radiani
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Gestionează erorile de geolocation
   */
  private handleGeolocationError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Accesul la locație a fost refuzat de utilizator');
      case error.POSITION_UNAVAILABLE:
        return new Error('Informațiile de locație nu sunt disponibile');
      case error.TIMEOUT:
        return new Error('Cererea de locație a expirat');
      default:
        return new Error('A apărut o eroare necunoscută la obținerea locației');
    }
  }

  /**
   * Mock data pentru demonstrație - simulează locațiile lucrătorilor
   */
  getMockWorkerLocations(): WorkerLocation[] {
    return [
      {
        id: 'worker1',
        workerName: 'Robert',
        latitude: 44.4268,
        longitude: 26.1025,
        accuracy: 15,
        lastUpdated: new Date().toISOString(),
        status: 'active',
        batteryLevel: 85
      },
      {
        id: 'worker2',
        workerName: 'Demo User',
        latitude: 44.4378,
        longitude: 26.0969,
        accuracy: 12,
        lastUpdated: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        status: 'on_job',
        currentJobId: '1001',
        batteryLevel: 72
      },
      {
        id: 'worker3',
        workerName: 'Lacatus 01',
        latitude: 44.4184,
        longitude: 26.1118,
        accuracy: 20,
        lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'active',
        batteryLevel: 43
      }
    ];
  }
}

// Exportă o instanță singleton
export const locationService = new LocationService();
export type { WorkerLocation, LocationOptions };