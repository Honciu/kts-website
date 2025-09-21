'use client';

import { Job, NotificationData } from './jobService';

interface APIResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  version: number;
}

interface ChangeLogEntry {
  id: string;
  type: 'job_created' | 'job_updated' | 'job_deleted' | 'notification_created';
  timestamp: string;
  data: any;
}

/**
 * API Service real pentru producție
 * Înlocuiește simulatorul cu apeluri HTTP reale
 */
class RealAPIService {
  private baseUrl: string;
  private pollInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, (hasChanges: boolean) => void> = new Map();
  private lastKnownVersion = 0;
  private isPolling = false;
  
  constructor() {
    // Detectează automat URL-ul API-ului
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                   (typeof window !== 'undefined' ? window.location.origin + '/api' : 'http://localhost:3000/api');
    
    console.log('🌐 RealAPIService initialized with baseUrl:', this.baseUrl);
    this.startPolling();
  }

  /**
   * GET /api/jobs - Obține toate joburile
   */
  async getJobs(): Promise<APIResponse<Job[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Cache bust pentru sincronizare live
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🌐 RealAPI: Fetched', data.data?.length || 0, 'jobs from server');
      
      return data;
    } catch (error) {
      console.error('❌ RealAPI: Error fetching jobs:', error);
      return {
        success: false,
        data: [],
        timestamp: new Date().toISOString(),
        version: 0
      };
    }
  }

  /**
   * POST /api/jobs - Creează un job nou
   */
  async createJob(job: Omit<Job, 'id' | 'createdAt'>): Promise<APIResponse<Job>> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🌐 RealAPI: Created job:', data.data?.id);
      
      return data;
    } catch (error) {
      console.error('❌ RealAPI: Error creating job:', error);
      return {
        success: false,
        data: {} as Job,
        timestamp: new Date().toISOString(),
        version: 0
      };
    }
  }

  /**
   * PUT /api/jobs/:id - Actualizează un job
   */
  async updateJob(jobId: string, updates: Partial<Job>): Promise<APIResponse<Job>> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🌐 RealAPI: Updated job:', jobId);
      
      return data;
    } catch (error) {
      console.error('❌ RealAPI: Error updating job:', error);
      return {
        success: false,
        data: {} as Job,
        timestamp: new Date().toISOString(),
        version: 0
      };
    }
  }

  /**
   * DELETE /api/jobs/:id - Șterge un job
   */
  async deleteJob(jobId: string): Promise<APIResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🌐 RealAPI: Deleted job:', jobId);
      
      return data;
    } catch (error) {
      console.error('❌ RealAPI: Error deleting job:', error);
      return {
        success: false,
        data: false,
        timestamp: new Date().toISOString(),
        version: 0
      };
    }
  }

  /**
   * GET /api/sync/status - Verifică versiunea pentru polling
   */
  async checkForChanges(): Promise<APIResponse<{ hasChanges: boolean; version: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/sync/status`, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const hasChanges = data.version > this.lastKnownVersion;
      
      if (hasChanges) {
        console.log(`🔄 RealAPI: Changes detected - version ${this.lastKnownVersion} -> ${data.version}`);
        this.lastKnownVersion = data.version;
      }
      
      return {
        success: true,
        data: { hasChanges, version: data.version },
        timestamp: new Date().toISOString(),
        version: data.version
      };
    } catch (error) {
      // Silent fail pentru polling
      return {
        success: false,
        data: { hasChanges: false, version: 0 },
        timestamp: new Date().toISOString(),
        version: 0
      };
    }
  }

  /**
   * Polling pentru schimbări (simulez WebSocket/SSE)
   */
  private startPolling(): void {
    if (typeof window === 'undefined') return;
    
    console.log('🔄 RealAPI: Starting server polling every 3 seconds');
    
    this.pollInterval = setInterval(async () => {
      if (this.isPolling) return;
      
      this.isPolling = true;
      
      try {
        const response = await this.checkForChanges();
        if (response.success && response.data.hasChanges) {
          console.log('📡 RealAPI: Broadcasting server changes to listeners');
          this.listeners.forEach((callback) => {
            try {
              callback(true);
            } catch (error) {
              console.error('❌ Error notifying RealAPI listener:', error);
            }
          });
        }
      } catch (error) {
        console.error('❌ Error during server polling:', error);
      } finally {
        this.isPolling = false;
      }
    }, 3000); // Polling la 3 secunde pentru producție
  }

  /**
   * Adaugă listener pentru schimbări
   */
  addChangeListener(id: string, callback: (hasChanges: boolean) => void): void {
    this.listeners.set(id, callback);
    console.log(`👂 RealAPI: Added change listener ${id}`);
  }

  /**
   * Elimină listener
   */
  removeChangeListener(id: string): void {
    this.listeners.delete(id);
    console.log(`🔇 RealAPI: Removed change listener ${id}`);
  }

  /**
   * Curăță resursele
   */
  destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
    console.log('🛑 RealAPI: Service destroyed');
  }

  /**
   * Sincronizare forțată
   */
  async forceSync(): Promise<void> {
    console.log('⚡ RealAPI: Force sync from server');
    const response = await this.checkForChanges();
    if (response.success) {
      this.listeners.forEach((callback) => {
        try {
          callback(true);
        } catch (error) {
          console.error('❌ Error during force sync:', error);
        }
      });
    }
  }

  /**
   * Pentru compatibilitate cu simulatorul - nu fac nimic în versiunea reală
   */
  async migrateLocalData(jobs: Map<string, Job>): Promise<void> {
    console.log('🔄 RealAPI: Migration not needed - using server database');
  }

  /**
   * Change log fake pentru debugging
   */
  getChangeLog(): ChangeLogEntry[] {
    return [
      {
        id: 'real-api-active',
        type: 'job_created',
        timestamp: new Date().toISOString(),
        data: { message: 'Real API service active' }
      }
    ];
  }
}

// Export singleton
export const realApiService = new RealAPIService();
export type { APIResponse, ChangeLogEntry };