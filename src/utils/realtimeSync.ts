'use client';

// Tipuri pentru sincronizare în timp real
export interface SyncMessage {
  type: 'JOB_CREATED' | 'JOB_UPDATED' | 'JOB_DELETED' | 'NOTIFICATION_CREATED' | 'FORCE_REFRESH';
  data: any;
  timestamp: string;
  source: string;
}

export interface SyncListener {
  id: string;
  callback: (message: SyncMessage) => void;
}

class RealtimeSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, (message: SyncMessage) => void> = new Map();
  private isInitialized = false;
  private readonly CHANNEL_NAME = 'kts-sync-channel';
  private readonly STORAGE_SYNC_KEY = 'kts-sync-trigger';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    try {
      // Initialize BroadcastChannel for modern browsers
      this.channel = new BroadcastChannel(this.CHANNEL_NAME);
      
      this.channel.addEventListener('message', (event: MessageEvent<SyncMessage>) => {
        this.handleMessage(event.data);
      });

      // Fallback with localStorage events for older browsers
      window.addEventListener('storage', this.handleStorageEvent.bind(this));
      
      this.isInitialized = true;
      console.log('🔄 RealtimeSync: Initialized with BroadcastChannel + localStorage fallback');
    } catch (error) {
      console.warn('⚠️ BroadcastChannel not supported, using localStorage only:', error);
      // Only use localStorage events
      window.addEventListener('storage', this.handleStorageEvent.bind(this));
      this.isInitialized = true;
    }
  }

  private handleMessage(message: SyncMessage): void {
    console.log('📡 RealtimeSync: Received message:', message);
    
    // Notify all listeners
    this.listeners.forEach((callback, id) => {
      try {
        callback(message);
      } catch (error) {
        console.error(`❌ Error notifying listener ${id}:`, error);
      }
    });
  }

  private handleStorageEvent(event: StorageEvent): void {
    if (event.key === this.STORAGE_SYNC_KEY && event.newValue) {
      try {
        const message: SyncMessage = JSON.parse(event.newValue);
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ Error parsing storage sync message:', error);
      }
    }
  }

  /**
   * Broadcast a message to all tabs/windows
   */
  broadcast(message: Omit<SyncMessage, 'timestamp' | 'source'>): void {
    if (!this.isInitialized) {
      console.warn('⚠️ RealtimeSync not initialized');
      return;
    }

    const fullMessage: SyncMessage = {
      ...message,
      timestamp: new Date().toISOString(),
      source: `tab-${Date.now()}`
    };

    try {
      // Send via BroadcastChannel
      if (this.channel) {
        this.channel.postMessage(fullMessage);
      }
      
      // Send via localStorage as fallback - use a unique key each time
      const uniqueKey = `${this.STORAGE_SYNC_KEY}_${Date.now()}`;
      localStorage.setItem(uniqueKey, JSON.stringify(fullMessage));
      
      // Also trigger via the main sync key
      localStorage.setItem(this.STORAGE_SYNC_KEY, JSON.stringify(fullMessage));
      
      // Clean up after a short delay
      setTimeout(() => {
        localStorage.removeItem(uniqueKey);
        localStorage.removeItem(this.STORAGE_SYNC_KEY);
      }, 100);
      
      console.log('📤 RealtimeSync: Message broadcasted:', fullMessage);
    } catch (error) {
      console.error('❌ Error broadcasting message:', error);
    }
  }

  /**
   * Add a listener for sync messages
   */
  addListener(id: string, callback: (message: SyncMessage) => void): void {
    this.listeners.set(id, callback);
    console.log(`👂 RealtimeSync: Added listener ${id}`);
  }

  /**
   * Remove a listener
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
    console.log(`🔇 RealtimeSync: Removed listener ${id}`);
  }

  /**
   * Force refresh all tabs
   */
  forceRefresh(reason: string): void {
    this.broadcast({
      type: 'FORCE_REFRESH',
      data: { reason }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close();
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent.bind(this));
    }
    
    this.listeners.clear();
    this.isInitialized = false;
    console.log('🛑 RealtimeSync: Destroyed');
  }
}

// Export singleton instance
export const realtimeSync = new RealtimeSyncService();

// Utility functions
export const broadcastJobCreated = (job: any) => {
  realtimeSync.broadcast({
    type: 'JOB_CREATED',
    data: { job }
  });
};

export const broadcastJobUpdated = (job: any, update: any) => {
  realtimeSync.broadcast({
    type: 'JOB_UPDATED',
    data: { job, update }
  });
};

export const broadcastJobDeleted = (jobId: string) => {
  realtimeSync.broadcast({
    type: 'JOB_DELETED',
    data: { jobId }
  });
};

export const broadcastNotification = (notification: any) => {
  realtimeSync.broadcast({
    type: 'NOTIFICATION_CREATED',
    data: { notification }
  });
};