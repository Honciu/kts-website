'use client';

/**
 * Sistem de sincronizare simplu și robust care funcționează garantat
 * Folosește localStorage polling pentru a detecta schimbările
 */

export interface SyncData {
  jobs: any[];
  notifications: any[];
  timestamp: string;
  trigger: string;
}

class SimpleSyncService {
  private readonly SYNC_KEY = 'kts-simple-sync';
  private readonly TRIGGER_KEY = 'kts-sync-trigger';
  private listeners: Map<string, () => void> = new Map();
  private lastKnownTimestamp = '';
  private pollInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Start polling for changes
    this.pollInterval = setInterval(() => {
      this.checkForChanges();
    }, 1000); // Check every second

    this.isInitialized = true;
    console.log('🔄 SimpleSync: Initialized with 1s polling');
  }

  private checkForChanges(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.TRIGGER_KEY);
      if (stored && stored !== this.lastKnownTimestamp) {
        this.lastKnownTimestamp = stored;
        console.log('📡 SimpleSync: Change detected, notifying listeners');
        
        // Notify all listeners
        this.listeners.forEach((callback, id) => {
          try {
            callback();
            console.log(`✅ SimpleSync: Notified listener ${id}`);
          } catch (error) {
            console.error(`❌ SimpleSync: Error notifying ${id}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('❌ SimpleSync: Error checking changes:', error);
    }
  }

  /**
   * Trigger a sync event
   */
  trigger(reason: string): void {
    if (typeof window === 'undefined') return;

    const timestamp = new Date().toISOString();
    const triggerData = `${timestamp}|${reason}`;

    try {
      localStorage.setItem(this.TRIGGER_KEY, triggerData);
      console.log(`📤 SimpleSync: Triggered sync - ${reason}`);
    } catch (error) {
      console.error('❌ SimpleSync: Error triggering sync:', error);
    }
  }

  /**
   * Add a listener
   */
  addListener(id: string, callback: () => void): void {
    this.listeners.set(id, callback);
    console.log(`👂 SimpleSync: Added listener ${id}`);
  }

  /**
   * Remove a listener
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
    console.log(`🔇 SimpleSync: Removed listener ${id}`);
  }

  /**
   * Get current timestamp for debugging
   */
  getCurrentTrigger(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(this.TRIGGER_KEY) || '';
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
    console.log('🛑 SimpleSync: Destroyed');
  }
}

// Export singleton
export const simpleSync = new SimpleSyncService();

// Utility functions
export const triggerJobSync = (reason: string) => {
  simpleSync.trigger(`JOB_SYNC: ${reason}`);
};

export const triggerNotificationSync = (reason: string) => {
  simpleSync.trigger(`NOTIFICATION_SYNC: ${reason}`);
};

export const triggerFullSync = (reason: string) => {
  simpleSync.trigger(`FULL_SYNC: ${reason}`);
};