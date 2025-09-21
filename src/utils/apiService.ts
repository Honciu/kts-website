'use client';

/**
 * API Service simulat care se comportă ca un backend real
 * Pentru sincronizare cross-browser și pregătire pentru producție
 */

import { Job, NotificationData } from './jobService';

// Simulez un storage central accesibil de toate browserele
// În producție, acesta va fi înlocuit cu apeluri API reale
const CENTRAL_STORAGE_KEY = 'kts-central-api-data';
const LAST_SYNC_KEY = 'kts-last-sync-timestamp';
const CHANGE_LOG_KEY = 'kts-change-log';

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

interface CentralData {
  jobs: [string, Job][];
  notifications: [string, NotificationData][];
  timestamp: string;
  version: number;
  changeLog: ChangeLogEntry[];
}

class APIService {
  private baseUrl = 'http://localhost:3000/api'; // Pentru viitor
  private pollInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, (hasChanges: boolean) => void> = new Map();
  private lastKnownVersion = 0;
  private isPolling = false;
  
  constructor() {
    this.startPolling();
  }

  /**
   * Simulează GET /api/jobs - Obține toate job-urile
   */
  async getJobs(): Promise<APIResponse<Job[]>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const centralData = this.getCentralData();
          const jobs = centralData.jobs.map(([id, job]) => job);
          
          console.log('🌐 API: Fetched', jobs.length, 'jobs from central storage');
          
          resolve({
            success: true,
            data: jobs,
            timestamp: new Date().toISOString(),
            version: centralData.version
          });
        } catch (error) {
          console.error('❌ API: Error fetching jobs:', error);
          resolve({
            success: false,
            data: [],
            timestamp: new Date().toISOString(),
            version: 0
          });
        }
      }, Math.random() * 300 + 100); // Simulez latența 100-400ms
    });
  }

  /**
   * Simulează POST /api/jobs - Creează un job nou
   */
  async createJob(job: Omit<Job, 'id' | 'createdAt'>): Promise<APIResponse<Job>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const centralData = this.getCentralData();
          const jobId = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
          const timestamp = new Date().toISOString();
          
          const newJob: Job = {
            ...job,
            id: jobId,
            createdAt: timestamp
          };

          // Adaugă job-ul în storage central
          centralData.jobs.push([jobId, newJob]);
          centralData.version++;
          centralData.timestamp = timestamp;

          // Adaugă în change log
          centralData.changeLog.push({
            id: `change_${Date.now()}`,
            type: 'job_created',
            timestamp,
            data: newJob
          });

          this.setCentralData(centralData);
          
          console.log('🌐 API: Created job', jobId, 'in central storage');
          
          resolve({
            success: true,
            data: newJob,
            timestamp,
            version: centralData.version
          });
        } catch (error) {
          console.error('❌ API: Error creating job:', error);
          resolve({
            success: false,
            data: {} as Job,
            timestamp: new Date().toISOString(),
            version: 0
          });
        }
      }, Math.random() * 200 + 50);
    });
  }

  /**
   * Simulează PUT /api/jobs/:id - Actualizează un job
   */
  async updateJob(jobId: string, updates: Partial<Job>): Promise<APIResponse<Job>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const centralData = this.getCentralData();
          const jobIndex = centralData.jobs.findIndex(([id]) => id === jobId);
          
          if (jobIndex === -1) {
            resolve({
              success: false,
              data: {} as Job,
              timestamp: new Date().toISOString(),
              version: centralData.version
            });
            return;
          }

          const timestamp = new Date().toISOString();
          const existingJob = centralData.jobs[jobIndex][1];
          const updatedJob: Job = { ...existingJob, ...updates };
          
          centralData.jobs[jobIndex] = [jobId, updatedJob];
          centralData.version++;
          centralData.timestamp = timestamp;

          // Adaugă în change log
          centralData.changeLog.push({
            id: `change_${Date.now()}`,
            type: 'job_updated',
            timestamp,
            data: { jobId, updates, fullJob: updatedJob }
          });

          this.setCentralData(centralData);
          
          console.log('🌐 API: Updated job', jobId, 'in central storage');
          
          resolve({
            success: true,
            data: updatedJob,
            timestamp,
            version: centralData.version
          });
        } catch (error) {
          console.error('❌ API: Error updating job:', error);
          resolve({
            success: false,
            data: {} as Job,
            timestamp: new Date().toISOString(),
            version: 0
          });
        }
      }, Math.random() * 200 + 50);
    });
  }

  /**
   * Simulează DELETE /api/jobs/:id - Șterge un job
   */
  async deleteJob(jobId: string): Promise<APIResponse<boolean>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const centralData = this.getCentralData();
          const jobIndex = centralData.jobs.findIndex(([id]) => id === jobId);
          
          if (jobIndex === -1) {
            resolve({
              success: false,
              data: false,
              timestamp: new Date().toISOString(),
              version: centralData.version
            });
            return;
          }

          const timestamp = new Date().toISOString();
          const deletedJob = centralData.jobs[jobIndex][1];
          
          centralData.jobs.splice(jobIndex, 1);
          centralData.version++;
          centralData.timestamp = timestamp;

          // Adaugă în change log
          centralData.changeLog.push({
            id: `change_${Date.now()}`,
            type: 'job_deleted',
            timestamp,
            data: { jobId, deletedJob }
          });

          this.setCentralData(centralData);
          
          console.log('🌐 API: Deleted job', jobId, 'from central storage');
          
          resolve({
            success: true,
            data: true,
            timestamp,
            version: centralData.version
          });
        } catch (error) {
          console.error('❌ API: Error deleting job:', error);
          resolve({
            success: false,
            data: false,
            timestamp: new Date().toISOString(),
            version: 0
          });
        }
      }, Math.random() * 200 + 50);
    });
  }

  /**
   * Verifică dacă există schimbări (simulez polling)
   */
  async checkForChanges(): Promise<APIResponse<{ hasChanges: boolean; version: number }>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const centralData = this.getCentralData();
          const hasChanges = centralData.version > this.lastKnownVersion;
          
          if (hasChanges) {
            console.log(`🔄 API: Changes detected - version ${this.lastKnownVersion} -> ${centralData.version}`);
            this.lastKnownVersion = centralData.version;
          }
          
          resolve({
            success: true,
            data: { hasChanges, version: centralData.version },
            timestamp: new Date().toISOString(),
            version: centralData.version
          });
        } catch (error) {
          console.error('❌ API: Error checking changes:', error);
          resolve({
            success: false,
            data: { hasChanges: false, version: 0 },
            timestamp: new Date().toISOString(),
            version: 0
          });
        }
      }, 50); // Check foarte rapid
    });
  }

  /**
   * Obține change log-ul pentru debug
   */
  getChangeLog(): ChangeLogEntry[] {
    try {
      const centralData = this.getCentralData();
      return centralData.changeLog.slice(-20); // Ultimele 20 de modificări
    } catch (error) {
      return [];
    }
  }

  /**
   * Storage-ul central simulat (în locul unui backend real)
   */
  private getCentralData(): CentralData {
    if (typeof window === 'undefined') {
      return {
        jobs: [],
        notifications: [],
        timestamp: new Date().toISOString(),
        version: 0,
        changeLog: []
      };
    }

    try {
      const stored = localStorage.getItem(CENTRAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error reading central data:', error);
    }

    // Inițializez cu date goale
    const initialData: CentralData = {
      jobs: [],
      notifications: [],
      timestamp: new Date().toISOString(),
      version: 1,
      changeLog: [{
        id: 'init',
        type: 'job_created',
        timestamp: new Date().toISOString(),
        data: { message: 'Central storage initialized' }
      }]
    };

    this.setCentralData(initialData);
    return initialData;
  }

  private setCentralData(data: CentralData): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Keep only last 50 change log entries to prevent storage bloat
      if (data.changeLog.length > 50) {
        data.changeLog = data.changeLog.slice(-50);
      }
      
      localStorage.setItem(CENTRAL_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(LAST_SYNC_KEY, data.timestamp);
      console.log('💾 API: Central data saved, version', data.version);
    } catch (error) {
      console.error('❌ Error saving central data:', error);
    }
  }

  /**
   * Polling pentru schimbări (simulez WebSocket/SSE)
   */
  private startPolling(): void {
    if (typeof window === 'undefined') return;
    
    console.log('🔄 API: Starting change polling every 2 seconds');
    
    this.pollInterval = setInterval(async () => {
      if (this.isPolling) return; // Previne multiple polling-uri simultane
      
      this.isPolling = true;
      
      try {
        const response = await this.checkForChanges();
        if (response.success && response.data.hasChanges) {
          console.log('📡 API: Broadcasting changes to listeners');
          this.listeners.forEach((callback) => {
            try {
              callback(true);
            } catch (error) {
              console.error('❌ Error notifying API listener:', error);
            }
          });
        }
      } catch (error) {
        console.error('❌ Error during polling:', error);
      } finally {
        this.isPolling = false;
      }
    }, 2000); // Check la fiecare 2 secunde
  }

  /**
   * Adaugă listener pentru schimbări
   */
  addChangeListener(id: string, callback: (hasChanges: boolean) => void): void {
    this.listeners.set(id, callback);
    console.log(`👂 API: Added change listener ${id}`);
  }

  /**
   * Elimină listener
   */
  removeChangeListener(id: string): void {
    this.listeners.delete(id);
    console.log(`🔇 API: Removed change listener ${id}`);
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
    console.log('🛑 API: Service destroyed');
  }

  /**
   * Sincronizare forțată - reîncarcă toate datele
   */
  async forceSync(): Promise<void> {
    console.log('⚡ API: Force sync requested');
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
   * Migrează datele din jobService local către storage central
   */
  async migrateLocalData(jobs: Map<string, Job>): Promise<void> {
    console.log('🔄 API: Migrating local data to central storage');
    
    const centralData = this.getCentralData();
    
    // Adaugă job-urile locale care nu există în central
    const existingIds = centralData.jobs.map(([id]) => id);
    
    jobs.forEach((job, id) => {
      if (!existingIds.includes(id)) {
        centralData.jobs.push([id, job]);
        centralData.changeLog.push({
          id: `migrate_${Date.now()}_${id}`,
          type: 'job_created',
          timestamp: new Date().toISOString(),
          data: { ...job, migrated: true }
        });
        console.log('📦 API: Migrated job', id, 'to central storage');
      }
    });
    
    centralData.version++;
    centralData.timestamp = new Date().toISOString();
    this.setCentralData(centralData);
    
    console.log('✅ API: Migration completed');
  }
}

// Export singleton
export const apiService = new APIService();
export type { APIResponse, ChangeLogEntry };