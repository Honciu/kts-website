import { locationService } from './locationService';
import { realtimeSync, broadcastJobCreated, broadcastJobUpdated, broadcastJobDeleted, broadcastNotification, type SyncMessage } from './realtimeSync';
import { simpleSync, triggerJobSync, triggerFullSync } from './simpleSync';
import { apiService } from './apiConfig'; // Folosește configuratorul automat

interface Job {
  id: string;
  clientName: string;
  clientPhone: string;
  address: string;
  serviceName: string;
  serviceDescription?: string;
  specialInstructions?: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'pending_approval';
  priority: 'normal' | 'high' | 'urgent';
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  
  // Completion details
  completionData?: {
    paymentMethod: 'cash' | 'card' | 'bank_transfer';
    totalAmount: number;
    workerCommission: number;
    bankAccount?: string;
    onlyTravelFee: boolean;
    workDescription: string;
    photos: string[];
    notes?: string;
  };
}

interface JobUpdate {
  jobId: string;
  status: Job['status'];
  timestamp: string;
  workerId: string;
  workerName: string;
  data?: any;
}

interface JobServiceListener {
  onJobUpdate: (job: Job, update: JobUpdate) => void;
  onJobComplete: (job: Job) => void;
  onJobStatusChange: (jobId: string, oldStatus: Job['status'], newStatus: Job['status']) => void;
  onNotification?: (notification: NotificationData) => void;
}

interface NotificationData {
  id: string;
  type: 'job_assigned' | 'job_accepted' | 'job_rejected' | 'job_completed' | 'appointment_reminder';
  title: string;
  message: string;
  jobId?: string;
  workerId?: string;
  timestamp: string;
  read: boolean;
  urgent: boolean;
}

class JobService {
  private jobs: Map<string, Job> = new Map();
  private listeners: Map<string, JobServiceListener> = new Map();
  private notifications: Map<string, NotificationData> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private readonly STORAGE_KEY = 'kts_jobs_data';
  private readonly NOTIFICATIONS_KEY = 'kts_notifications_data';

  constructor() {
    this.loadFromStorage();
    this.loadNotificationsFromStorage();
    this.startRealTimeSync();
    this.initializeRealtimeSync();
    this.initializeCrossBrowserSync();
  }

  /**
   * Încarcă datele din localStorage sau inițializează cu mock data
   */
  private loadFromStorage(): void {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      this.initializeMockData();
      return;
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.jobs = new Map(data.jobs || []);
        console.log('🔄 JobService: Loaded', this.jobs.size, 'jobs from localStorage');
        return;
      }
    } catch (error) {
      console.error('❌ JobService: Error loading from localStorage:', error);
    }
    
    // Fallback to mock data
    this.initializeMockData();
  }

  /**
   * Inițializează cu date mock pentru demonstrație
   */
  private initializeMockData(): void {
    const mockJobs: Job[] = [
      {
        id: '1001',
        clientName: 'Ion Popescu',
        clientPhone: '+40721123456',
        address: 'Str. Aviatorilor nr. 15, Sector 1',
        serviceName: 'Deblocare ușă',
        serviceDescription: 'Ușa de la apartament s-a blocat și nu se deschide cu cheia',
        specialInstructions: 'Apelează înainte de sosire, apartament la etajul 3',
        assignedEmployeeId: 'worker1',
        assignedEmployeeName: 'Robert',
        status: 'assigned',
        priority: 'urgent',
        createdAt: new Date().toISOString(),
      },
      {
        id: '1002',
        clientName: 'Maria Ionescu',
        clientPhone: '+40731112233',
        address: 'Bd. Unirii nr. 45',
        serviceName: 'Schimbare yală',
        serviceDescription: 'Yala veche nu mai funcționează',
        assignedEmployeeId: 'worker2',
        assignedEmployeeName: 'Demo User',
        status: 'completed',
        priority: 'normal',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completionData: {
          paymentMethod: 'bank_transfer',
          totalAmount: 80,
          workerCommission: 80,
          bankAccount: 'KTS',
          onlyTravelFee: true,
          workDescription: 'Client nu era acasă. Am încasat doar deplasarea.',
          photos: ['/mock-photo-1.jpg'],
        }
      },
      {
        id: '1003',
        clientName: 'Andrei Popescu',
        clientPhone: '+40744555666',
        address: 'Str. Florilor nr. 12',
        serviceName: 'Montare broască',
        assignedEmployeeId: 'worker1',
        assignedEmployeeName: 'Robert',
        status: 'completed',
        priority: 'normal',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        completionData: {
          paymentMethod: 'card',
          totalAmount: 200,
          workerCommission: 60,
          onlyTravelFee: false,
          workDescription: 'Am montat broasca nouă și am testat funcționarea.',
          photos: ['/mock-photo-2.jpg', '/mock-photo-3.jpg'],
        }
      },
      {
        id: '1004',
        clientName: 'Elena Vasile',
        clientPhone: '+40755777888',
        address: 'Calea Victoriei nr. 85',
        serviceName: 'Deblocare ușă metalică',
        assignedEmployeeId: 'worker3',
        assignedEmployeeName: 'Lacatus 01',
        status: 'completed',
        priority: 'high',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        completionData: {
          paymentMethod: 'cash',
          totalAmount: 180,
          workerCommission: 54,
          onlyTravelFee: false,
          workDescription: 'Ușă metalică blocată, am deblocat și lubrifiat.',
          photos: ['/mock-photo-4.jpg'],
        }
      }
    ];

    mockJobs.forEach(job => this.jobs.set(job.id, job));
    this.saveToStorage();
    console.log('🔄 JobService: Initialized with mock data');
  }

  /**
   * Salvează datele în localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        jobs: Array.from(this.jobs.entries()),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('💾 JobService: Data saved to localStorage');
    } catch (error) {
      console.error('❌ JobService: Error saving to localStorage:', error);
    }
  }

  /**
   * Încarcă notificările din localStorage
   */
  private loadNotificationsFromStorage(): void {
    if (typeof window === 'undefined') {
      console.log('🔔 JobService: Server environment - no notifications loaded');
      return;
    }
    
    try {
      const stored = localStorage.getItem(this.NOTIFICATIONS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.notifications = new Map(data.notifications || []);
        console.log('🔔 JobService: Loaded', this.notifications.size, 'notifications from localStorage');
        return;
      }
    } catch (error) {
      console.error('❌ JobService: Error loading notifications from localStorage:', error);
    }
    console.log('🔔 JobService: No stored notifications found');
  }

  /**
   * Salvează notificările în localStorage
   */
  private saveNotificationsToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        notifications: Array.from(this.notifications.entries()),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(data));
      console.log('💾 JobService: Notifications saved to localStorage');
    } catch (error) {
      console.error('❌ JobService: Error saving notifications to localStorage:', error);
    }
  }

  /**
   * Pornește sincronizarea în timp real
   */
  private startRealTimeSync(): void {
    this.isConnected = true;
    
    // Simulează conexiunea în timp real cu polling la fiecare 5 secunde
    this.updateInterval = setInterval(() => {
      this.checkForUpdates();
    }, 5000);

    // Adaugă listener pentru evenimente localStorage (sincronizare cross-tab)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      console.log('🔄 JobService: Real-time sync started with cross-tab support');
    } else {
      console.log('🔄 JobService: Real-time sync started (server-side)');
    }
  }

  /**
   * Oprește sincronizarea
   */
  stopRealTimeSync(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Remove storage listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this));
    }
    
    this.isConnected = false;
    console.log('⏹️ JobService: Real-time sync stopped');
  }

  /**
   * Handle localStorage changes (cross-tab sync)
   */
  private handleStorageChange(e: StorageEvent): void {
    if (e.key === this.STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        const newJobs = new Map(data.jobs || []);
        
        // Check if there are any changes
        const hasChanges = newJobs.size !== this.jobs.size || 
          Array.from(newJobs.keys()).some(key => !this.jobs.has(key)) ||
          Array.from(this.jobs.keys()).some(key => !newJobs.has(key));
        
        if (hasChanges) {
          console.log('🔄 JobService: Detected changes from another tab, syncing...');
          this.jobs = newJobs;
          this.notifyListenersOfSync();
        }
      } catch (error) {
        console.error('❌ JobService: Error syncing from localStorage:', error);
      }
    }
    
    if (e.key === this.NOTIFICATIONS_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        this.notifications = new Map(data.notifications || []);
        console.log('🔔 JobService: Synced notifications from another tab');
      } catch (error) {
        console.error('❌ JobService: Error syncing notifications:', error);
      }
    }
  }

  /**
   * Verifică pentru actualizări (simulează WebSocket-uri)
   */
  private checkForUpdates(): void {
    // Reloading data from localStorage to sync with other tabs
    if (typeof window !== 'undefined') {
      this.syncFromStorage();
    }
    
    // Simulează actualizări random pentru demonstrație
    if (Math.random() < 0.1) { // 10% șansă să fie o actualizare
      console.log('📡 JobService: Checking for updates...');
    }
  }

  /**
   * Sync from storage without triggering events
   */
  private syncFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const newJobs = new Map(data.jobs || []);
        
        if (newJobs.size !== this.jobs.size) {
          this.jobs = newJobs;
          this.notifyListenersOfSync();
        }
      }
    } catch (error) {
      console.error('❌ JobService: Error during sync:', error);
    }
  }

  /**
   * Adaugă un listener pentru evenimente
   */
  addListener(id: string, listener: JobServiceListener): void {
    this.listeners.set(id, listener);
    console.log(`👂 JobService: Added listener ${id}`);
  }

  /**
   * Elimină un listener
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
    console.log(`🔇 JobService: Removed listener ${id}`);
  }

  /**
   * Notifică toți listenerii despre actualizări
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener, id) => {
      // Simulează notificări pentru demo
      console.log(`📢 JobService: Notifying listener ${id}`);
    });
  }

  /**
   * Notifică listenerii despre sincronizare (fără să trigger-ez notificări)
   */
  private notifyListenersOfSync(): void {
    this.listeners.forEach((listener, id) => {
      console.log(`🔄 JobService: Syncing data for listener ${id}`);
      
      // Apelează toate callback-urile pentru a forța actualizarea UI-ului
      const dummyJob = Array.from(this.jobs.values())[0]; // Ia primul job pentru exemplu
      if (dummyJob) {
        const dummyUpdate: JobUpdate = {
          jobId: dummyJob.id,
          status: dummyJob.status,
          timestamp: new Date().toISOString(),
          workerId: 'system',
          workerName: 'System Sync',
          data: { action: 'cross_tab_sync' }
        };
        
        // Trigger toate callback-urile pentru refresh
        try {
          listener.onJobUpdate && listener.onJobUpdate(dummyJob, dummyUpdate);
          listener.onJobStatusChange && listener.onJobStatusChange(dummyJob.id, dummyJob.status, dummyJob.status);
        } catch (error) {
          console.error(`❌ Error notifying listener ${id}:`, error);
        }
      }
    });
  }

  /**
   * Obține toate joburile
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Obține joburile pentru un anumit worker
   */
  getJobsForWorker(workerId: string): Job[] {
    return Array.from(this.jobs.values())
      .filter(job => job.assignedEmployeeId === workerId);
  }

  /**
   * Obține joburile active pentru un worker
   */
  getActiveJobsForWorker(workerId: string): Job[] {
    return this.getJobsForWorker(workerId)
      .filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status));
  }

  /**
   * Obține joburile finalizate pentru un worker
   */
  getCompletedJobsForWorker(workerId: string): Job[] {
    return this.getJobsForWorker(workerId)
      .filter(job => ['completed', 'pending_approval'].includes(job.status))
      .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());
  }

  /**
   * Obține un job după ID
   */
  getJob(jobId: string): Job | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Actualizează statusul unui job
   */
  updateJobStatus(jobId: string, newStatus: Job['status'], workerId: string, workerName: string, data?: any): Job | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const oldStatus = job.status;
    const timestamp = new Date().toISOString();

    // Actualizează job-ul
    const updatedJob: Job = {
      ...job,
      status: newStatus,
      ...(newStatus === 'accepted' && { acceptedAt: timestamp }),
      ...(newStatus === 'in_progress' && { startedAt: timestamp }),
      ...(newStatus === 'completed' && { completedAt: timestamp }),
      ...(data && { completionData: data })
    };

    this.jobs.set(jobId, updatedJob);
    this.saveToStorage();

    // Crează update object
    const update: JobUpdate = {
      jobId,
      status: newStatus,
      timestamp,
      workerId,
      workerName,
      data
    };

    // Broadcast change to all tabs
    broadcastJobUpdated(updatedJob, update);
    
    // Trigger simplu de sincronizare imediat
    triggerJobSync(`Job status updated: #${jobId} to ${newStatus}`);
    
    // Forțează refresh pentru toate tab-urile după o scurtă întârziere
    setTimeout(() => {
      realtimeSync.forceRefresh(`Job status updated: #${jobId} to ${newStatus}`);
      triggerFullSync(`Job status delayed: #${jobId} to ${newStatus}`);
    }, 200);

    // Actualizează statusul lucrătorului în locationService
    if (newStatus === 'in_progress') {
      locationService.setWorkerOnJob(workerId, jobId);
    } else if (['completed', 'cancelled'].includes(newStatus)) {
      locationService.setWorkerAvailable(workerId);
    }

    // Creează și trimite notificări
    this.createJobStatusNotifications(updatedJob, oldStatus, newStatus, workerName);

    // Notifică listenerii
    this.listeners.forEach(listener => {
      listener.onJobStatusChange(jobId, oldStatus, newStatus);
      listener.onJobUpdate(updatedJob, update);
      
      if (newStatus === 'completed') {
        listener.onJobComplete(updatedJob);
      }
    });

    console.log(`🔄 JobService: Job ${jobId} status updated from ${oldStatus} to ${newStatus} by ${workerName}`);
    
    return updatedJob;
  }

  /**
   * Completează un job cu detalii complete
   */
  completeJob(jobId: string, workerId: string, workerName: string, completionData: Job['completionData']): Job | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const newStatus = completionData?.paymentMethod === 'bank_transfer' ? 'pending_approval' : 'completed';
    
    return this.updateJobStatus(jobId, newStatus, workerId, workerName, completionData);
  }

  /**
   * Filtrează joburile finalizate după săptămână
   */
  getCompletedJobsForWeek(workerId: string, weekDate: Date): Job[] {
    const startOfWeek = this.getWeekStart(weekDate);
    const endOfWeek = this.getWeekEnd(weekDate);

    return this.getCompletedJobsForWorker(workerId)
      .filter(job => {
        if (!job.completedAt) return false;
        const completedDate = new Date(job.completedAt);
        return completedDate >= startOfWeek && completedDate <= endOfWeek;
      });
  }

  /**
   * Helper pentru începutul săptămânii (Luni)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * Helper pentru sfârșitul săptămânii (Duminică)
   */
  private getWeekEnd(date: Date): Date {
    const start = this.getWeekStart(date);
    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Verifică dacă serviciul este conectat
   */
  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  /**
   * Obține statistici pentru dashboard
   */
  getWorkerStats(workerId: string): {
    activeJobs: number;
    completedToday: number;
    weeklyEarnings: number;
    urgentJobs: number;
  } {
    const activeJobs = this.getActiveJobsForWorker(workerId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedJobs = this.getCompletedJobsForWorker(workerId);
    const completedToday = completedJobs.filter(job => {
      if (!job.completedAt) return false;
      const completedDate = new Date(job.completedAt);
      return completedDate >= today;
    });

    const weeklyJobs = this.getCompletedJobsForWeek(workerId, new Date());
    const weeklyEarnings = weeklyJobs
      .filter(job => job.status === 'completed')
      .reduce((sum, job) => sum + (job.completionData?.workerCommission || 0), 0);

    return {
      activeJobs: activeJobs.length,
      completedToday: completedToday.length,
      weeklyEarnings,
      urgentJobs: activeJobs.filter(job => job.priority === 'urgent').length
    };
  }

  /**
   * Obține raportul săptămânal financiar pentru un worker
   */
  getWeeklyFinancialReport(workerId: string, weekDate: Date): {
    weekJobs: Job[];
    totalEarnings: number;
    totalCollected: number;
    amountToHandOver: number;
    completedJobs: number;
    pendingApproval: number;
    travelOnlyJobs: number;
  } {
    const weekJobs = this.getCompletedJobsForWeek(workerId, weekDate);
    const completedJobs = weekJobs.filter(job => job.status === 'completed');
    
    const totalEarnings = completedJobs.reduce((sum, job) => {
      return sum + (job.completionData?.workerCommission || 0);
    }, 0);
    
    const totalCollected = weekJobs.reduce((sum, job) => {
      return sum + (job.completionData?.totalAmount || 0);
    }, 0);
    
    const amountToHandOver = totalCollected - totalEarnings;
    
    return {
      weekJobs,
      totalEarnings,
      totalCollected,
      amountToHandOver,
      completedJobs: completedJobs.length,
      pendingApproval: weekJobs.filter(job => job.status === 'pending_approval').length,
      travelOnlyJobs: weekJobs.filter(job => job.completionData?.onlyTravelFee).length
    };
  }

  /**
   * Obține raportul săptămânal pentru toți lucrătorii (pentru admin)
   */
  getAllWorkersWeeklyReport(weekDate: Date): {
    workerId: string;
    workerName: string;
    totalEarnings: number;
    totalCollected: number;
    amountToHandOver: number;
    completedJobs: number;
    pendingApproval: number;
  }[] {
    // Lista tuturor worker-ilor (in real ar veni din database)
    const workers = [
      { id: 'worker1', name: 'Robert' },
      { id: 'worker2', name: 'Demo User' },
      { id: 'worker3', name: 'Lacatus 01' }
    ];
    
    return workers.map(worker => {
      const report = this.getWeeklyFinancialReport(worker.id, weekDate);
      return {
        workerId: worker.id,
        workerName: worker.name,
        totalEarnings: report.totalEarnings,
        totalCollected: report.totalCollected,
        amountToHandOver: report.amountToHandOver,
        completedJobs: report.completedJobs,
        pendingApproval: report.pendingApproval
      };
    });
  }

  /**
   * Creează notificări pentru schimbările de status ale joburilor
   */
  private createJobStatusNotifications(job: Job, oldStatus: Job['status'], newStatus: Job['status'], actorName: string): void {
    const notifications: NotificationData[] = [];
    const timestamp = new Date().toISOString();

    // Notificări pentru lucrători
    if (newStatus === 'assigned' && oldStatus !== 'assigned') {
      notifications.push({
        id: `notif_${Date.now()}_${job.id}_worker`,
        type: 'job_assigned',
        title: '🆕 Job Nou Assignat',
        message: `Ați primit o nouă lucrare: ${job.serviceName} pentru ${job.clientName}`,
        jobId: job.id,
        workerId: job.assignedEmployeeId,
        timestamp,
        read: false,
        urgent: job.priority === 'urgent'
      });
    }

    // Notificări pentru administratori când joburile sunt acceptate/respinse
    if (newStatus === 'accepted' && oldStatus === 'assigned') {
      notifications.push({
        id: `notif_${Date.now()}_${job.id}_admin_accepted`,
        type: 'job_accepted',
        title: '✅ Job Acceptat',
        message: `${actorName} a acceptat lucrarea #${job.id} - ${job.serviceName}`,
        jobId: job.id,
        workerId: job.assignedEmployeeId,
        timestamp,
        read: false,
        urgent: false
      });
    }

    if (newStatus === 'cancelled' && oldStatus === 'assigned') {
      notifications.push({
        id: `notif_${Date.now()}_${job.id}_admin_rejected`,
        type: 'job_rejected',
        title: '❌ Job Respins',
        message: `${actorName} a respins lucrarea #${job.id} - ${job.serviceName}`,
        jobId: job.id,
        workerId: job.assignedEmployeeId,
        timestamp,
        read: false,
        urgent: true
      });
    }

    if (newStatus === 'completed') {
      notifications.push({
        id: `notif_${Date.now()}_${job.id}_admin_completed`,
        type: 'job_completed',
        title: '🎉 Job Finalizat',
        message: `${actorName} a finalizat lucrarea #${job.id} - ${job.serviceName}`,
        jobId: job.id,
        workerId: job.assignedEmployeeId,
        timestamp,
        read: false,
        urgent: false
      });
    }

    // Salvează notificările și notifică listenerii
    notifications.forEach(notification => {
      this.notifications.set(notification.id, notification);
      this.notifyListenersOfNotification(notification);
      
      // Broadcast notification to all tabs
      broadcastNotification(notification);
    });

    if (notifications.length > 0) {
      this.saveNotificationsToStorage();
    }
  }

  /**
   * Notifică listenerii despre o nouă notificare
   */
  private notifyListenersOfNotification(notification: NotificationData): void {
    this.listeners.forEach((listener, listenerId) => {
      if (listener.onNotification) {
        listener.onNotification(notification);
      }
    });
    console.log(`🔔 JobService: Notification sent - ${notification.title}`);
  }

  /**
   * Obține notificările pentru un utilizator
   */
  getNotificationsForUser(userId: string, userType: 'worker' | 'admin'): NotificationData[] {
    return Array.from(this.notifications.values())
      .filter(notif => {
        if (userType === 'worker') {
          return notif.workerId === userId || 
                 ['job_assigned', 'appointment_reminder'].includes(notif.type);
        } else {
          return ['job_accepted', 'job_rejected', 'job_completed'].includes(notif.type);
        }
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Marchează o notificare ca citită
   */
  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.notifications.set(notificationId, notification);
      this.saveNotificationsToStorage();
      console.log(`📖 JobService: Notification ${notificationId} marked as read`);
    }
  }

  /**
   * Șterge o notificare
   */
  deleteNotification(notificationId: string): void {
    if (this.notifications.delete(notificationId)) {
      this.saveNotificationsToStorage();
      console.log(`🗑️ JobService: Notification ${notificationId} deleted`);
    }
  }

  /**
   * Obține numărul de notificări necitite pentru un utilizator
   */
  getUnreadNotificationCount(userId: string, userType: 'worker' | 'admin'): number {
    return this.getNotificationsForUser(userId, userType)
      .filter(notif => !notif.read).length;
  }

  /**
   * Creează notificare de reminder pentru programări
   */
  createAppointmentReminder(workerId: string, jobId: string, appointmentTime: Date): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const notification: NotificationData = {
      id: `notif_${Date.now()}_${jobId}_reminder`,
      type: 'appointment_reminder',
      title: '⏰ Reminder Programare',
      message: `Programare în 30 min: ${job.serviceName} la ${job.address}`,
      jobId,
      workerId,
      timestamp: new Date().toISOString(),
      read: false,
      urgent: true
    };

    this.notifications.set(notification.id, notification);
    this.saveNotificationsToStorage();
    this.notifyListenersOfNotification(notification);
    
    // Broadcast notification to all tabs
    broadcastNotification(notification);
  }

  /**
   * Actualizează un job existent
   */
  updateJob(jobId: string, updatedJob: Job): Job | null {
    const existingJob = this.jobs.get(jobId);
    if (!existingJob) {
      console.error(`❌ JobService: Job ${jobId} not found for update`);
      return null;
    }

    // Păstrează anumite proprietăți originale
    const finalJob: Job = {
      ...updatedJob,
      id: jobId, // ID-ul rămâne neschimbat
      createdAt: existingJob.createdAt, // Data creării rămâne neschimbată
      acceptedAt: existingJob.acceptedAt,
      startedAt: existingJob.startedAt,
      completedAt: existingJob.completedAt,
      completionData: existingJob.completionData
    };

    this.jobs.set(jobId, finalJob);
    this.saveToStorage();

    // Notifică listenerii
    const update: JobUpdate = {
      jobId,
      status: finalJob.status,
      timestamp: new Date().toISOString(),
      workerId: 'admin1',
      workerName: 'Administrator',
      data: { action: 'job_updated' }
    };

    // Broadcast change to all tabs
    broadcastJobUpdated(finalJob, update);

    this.listeners.forEach(listener => {
      listener.onJobUpdate(finalJob, update);
    });

    console.log(`🔄 JobService: Job ${jobId} updated by admin`);
    return finalJob;
  }

  /**
   * Șterge un job
   */
  deleteJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.error(`❌ JobService: Job ${jobId} not found for deletion`);
      return false;
    }

    // Șterge job-ul
    const deleted = this.jobs.delete(jobId);
    
    if (deleted) {
      this.saveToStorage();
      
      // Broadcast deletion to all tabs
      broadcastJobDeleted(jobId);
      
      // Notifică listenerii
      const update: JobUpdate = {
        jobId,
        status: 'cancelled',
        timestamp: new Date().toISOString(),
        workerId: 'admin1',
        workerName: 'Administrator',
        data: { action: 'job_deleted' }
      };

      this.listeners.forEach(listener => {
        listener.onJobUpdate(job, update);
      });

      console.log(`🗑️ JobService: Job ${jobId} deleted by admin`);
    }
    
    return deleted;
  }

  /**
   * Inițializează sincronizarea în timp real cross-tab
   */
  private initializeRealtimeSync(): void {
    if (typeof window === 'undefined') return;

    realtimeSync.addListener('jobService', (message: SyncMessage) => {
      console.log('📡 JobService: Received sync message:', message.type);
      
      switch (message.type) {
        case 'JOB_CREATED':
        case 'JOB_UPDATED':
        case 'JOB_DELETED':
        case 'FORCE_REFRESH':
          // Reload data from storage and notify listeners
          this.reloadFromStorage();
          break;
          
        case 'NOTIFICATION_CREATED':
          // Handle notification updates
          this.reloadNotificationsFromStorage();
          break;
      }
    });
    
    console.log('🔄 JobService: Realtime sync initialized');
  }

  /**
   * Reload data from storage and notify all listeners
   */
  private reloadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    console.log('🔄 JobService: Starting reload from storage...');
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const newJobs = new Map(data.jobs || []);
        const oldSize = this.jobs.size;
        
        console.log(`📊 JobService: Storage has ${newJobs.size} jobs, current cache has ${oldSize}`);
        
        // Log job differences for debugging
        const newJobIds = Array.from(newJobs.keys());
        const oldJobIds = Array.from(this.jobs.keys());
        const addedJobs = newJobIds.filter(id => !oldJobIds.includes(id));
        const removedJobs = oldJobIds.filter(id => !newJobIds.includes(id));
        
        if (addedJobs.length > 0) {
          console.log(`➕ JobService: New jobs detected:`, addedJobs);
        }
        if (removedJobs.length > 0) {
          console.log(`➖ JobService: Removed jobs detected:`, removedJobs);
        }
        
        // Always update and notify, even if size is same (jobs might have changed)
        this.jobs = newJobs;
        
        // Notify all listeners about the update
        console.log(`📢 JobService: Notifying ${this.listeners.size} listeners...`);
        this.listeners.forEach((listener, listenerId) => {
          try {
            console.log(`📡 JobService: Notifying listener ${listenerId}`);
            
            // Create a dummy update to trigger refresh
            const firstJob = Array.from(this.jobs.values())[0];
            if (firstJob) {
              const update: JobUpdate = {
                jobId: firstJob.id,
                status: firstJob.status,
                timestamp: new Date().toISOString(),
                workerId: 'sync',
                workerName: 'Live Sync',
                data: { action: 'live_sync_reload', totalJobs: newJobs.size }
              };
              
              if (listener.onJobUpdate) {
                listener.onJobUpdate(firstJob, update);
                console.log(`✅ JobService: Sent onJobUpdate to ${listenerId}`);
              }
            }
            
            // Also trigger generic status change for refresh
            if (listener.onJobStatusChange) {
              listener.onJobStatusChange('sync', 'assigned', 'assigned');
              console.log(`✅ JobService: Sent onJobStatusChange to ${listenerId}`);
            }
          } catch (error) {
            console.error(`❌ Error notifying listener ${listenerId} during reload:`, error);
          }
        });
        
        console.log(`✨ JobService: Live reloaded ${newJobs.size} jobs from storage - ALL LISTENERS NOTIFIED`);
      } else {
        console.log('⚠️ JobService: No data found in localStorage');
      }
    } catch (error) {
      console.error('❌ JobService: Error during live reload:', error);
    }
  }

  /**
   * Reload notifications from storage
   */
  private reloadNotificationsFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.NOTIFICATIONS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.notifications = new Map(data.notifications || []);
        console.log('🔔 JobService: Live reloaded notifications from storage');
      }
    } catch (error) {
      console.error('❌ JobService: Error reloading notifications:', error);
    }
  }

  /**
   * Adaugă un job nou - VERSIUNE CU CROSS-BROWSER SYNC
   */
  addJob(newJob: Omit<Job, 'id' | 'createdAt'>): Job {
    const jobId = `${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const job: Job = {
      ...newJob,
      id: jobId,
      createdAt: timestamp
    };

    // 1. ADAUGĂ LOCAL
    this.jobs.set(jobId, job);
    this.saveToStorage();
    console.log(`🚀 JobService: Job #${job.id} added locally`);

    // 2. SYNC CROSS-BROWSER via API Service
    this.syncJobToAPI(job).then(() => {
      console.log(`🌍 JobService: Job #${job.id} synced to cross-browser API`);
    }).catch(error => {
      console.error(`❌ JobService: Failed to sync job #${job.id} to API:`, error);
    });

    // 3. LOCAL BROWSER TABS SYNC (keep pentru same-browser)
    console.log(`🚀 JobService: Broadcasting job #${job.id} to same-browser tabs...`);
    broadcastJobCreated(job);
    triggerJobSync(`New job created: #${job.id}`);
    
    // 4. MULTIPLE broadcast waves pentru garantie completă
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        realtimeSync.forceRefresh(`New job wave ${i + 1}: #${job.id}`);
        triggerFullSync(`New job sync wave ${i + 1}: #${job.id}`);
      }, (i + 1) * 300);
    }

    // 5. Creează notificare pentru lucrător
    this.createJobStatusNotifications(job, 'pending_approval', 'assigned', 'Administrator');

    // 6. Notifică listenerii locali
    const update: JobUpdate = {
      jobId,
      status: job.status,
      timestamp,
      workerId: 'admin1',
      workerName: 'Administrator',
      data: { action: 'job_created_with_api_sync' }
    };

    this.listeners.forEach(listener => {
      try {
        listener.onJobUpdate && listener.onJobUpdate(job, update);
        listener.onJobStatusChange && listener.onJobStatusChange(jobId, 'pending_approval', job.status);
      } catch (error) {
        console.error(`❌ Error notifying listener about new job:`, error);
      }
    });

    console.log(`✨ JobService: Job ${jobId} COMPLETELY SYNCED - local + cross-browser API`);
    return job;
  }

  /**
   * Simulează trimiterea de notificări (pentru compatibilitate înapoi)
   */
  async sendNotification(workerId: string, message: string, jobId?: string): Promise<void> {
    console.log(`📱 Legacy Notification to ${workerId}: ${message}${jobId ? ` (Job: ${jobId})` : ''}`);
    
    // Simulează delay de rețea
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return Promise.resolve();
  }

  /**
   * CROSS-BROWSER SYNC METHODS
   */

  /**
   * Inițializează sincronizarea cross-browser prin API Service
   */
  private initializeCrossBrowserSync(): void {
    if (typeof window === 'undefined') return;

    console.log('🌍 JobService: Initializing cross-browser sync...');
    
    // Migrate existing local data to central API
    apiService.migrateLocalData(this.jobs);
    
    // Listen for changes from API (other browsers)
    apiService.addChangeListener('jobService', (hasChanges) => {
      if (hasChanges) {
        console.log('📡 JobService: Cross-browser changes detected, syncing...');
        this.syncFromAPI();
      }
    });
    
    console.log('✅ JobService: Cross-browser sync initialized');
  }

  /**
   * Sync un job către API pentru cross-browser access
   */
  private async syncJobToAPI(job: Job): Promise<void> {
    try {
      const response = await apiService.createJob({
        clientName: job.clientName,
        clientPhone: job.clientPhone,
        address: job.address,
        serviceName: job.serviceName,
        serviceDescription: job.serviceDescription,
        specialInstructions: job.specialInstructions,
        assignedEmployeeId: job.assignedEmployeeId,
        assignedEmployeeName: job.assignedEmployeeName,
        status: job.status,
        priority: job.priority
      });
      
      if (response.success) {
        console.log(`🌍 JobService: Successfully synced job to API`);
      } else {
        throw new Error('API sync failed');
      }
    } catch (error) {
      console.error('❌ JobService: Failed to sync job to API:', error);
      throw error;
    }
  }

  /**
   * Sync de la API către local storage (primire schimbări)
   */
  private async syncFromAPI(): Promise<void> {
    try {
      console.log('📥 JobService: Syncing FROM API...');
      const response = await apiService.getJobs();
      
      if (response.success && response.data) {
        const apiJobs = response.data;
        const oldSize = this.jobs.size;
        
        console.log(`📊 JobService: API has ${apiJobs.length} jobs, local has ${oldSize}`);
        
        // Update local jobs map with API data
        const newJobsMap = new Map<string, Job>();
        const newJobIds: string[] = [];
        
        apiJobs.forEach(job => {
          newJobsMap.set(job.id, job);
          if (!this.jobs.has(job.id)) {
            newJobIds.push(job.id);
          }
        });
        
        // Log new jobs
        if (newJobIds.length > 0) {
          console.log(`🔥 JobService: NEW JOBS from API:`, newJobIds);
          newJobIds.forEach(id => {
            const job = newJobsMap.get(id);
            console.log(`  • #${id}: ${job?.serviceName} for ${job?.clientName}`);
          });
        }
        
        // Update local state
        this.jobs = newJobsMap;
        this.saveToStorage();
        
        // Notify all listeners about sync
        this.notifyListenersOfAPISync(newJobIds.length > 0);
        
        console.log(`✨ JobService: Synced ${apiJobs.length} jobs from API`);
      }
    } catch (error) {
      console.error('❌ JobService: Error syncing from API:', error);
    }
  }

  /**
   * Notifică listenerii despre sync API
   */
  private notifyListenersOfAPISync(hasNewJobs: boolean): void {
    console.log(`📢 JobService: Notifying ${this.listeners.size} listeners about API sync (new jobs: ${hasNewJobs})`);
    
    this.listeners.forEach((listener, listenerId) => {
      try {
        const firstJob = Array.from(this.jobs.values())[0];
        if (firstJob) {
          const update: JobUpdate = {
            jobId: firstJob.id,
            status: firstJob.status,
            timestamp: new Date().toISOString(),
            workerId: 'api-sync',
            workerName: 'Cross-Browser Sync',
            data: { action: 'cross_browser_sync', hasNewJobs, totalJobs: this.jobs.size }
          };
          
          listener.onJobUpdate && listener.onJobUpdate(firstJob, update);
          listener.onJobStatusChange && listener.onJobStatusChange('api-sync', 'assigned', 'assigned');
          
          console.log(`✅ JobService: Notified ${listenerId} about API sync`);
        }
      } catch (error) {
        console.error(`❌ Error notifying ${listenerId} about API sync:`, error);
      }
    });
  }

  /**
   * Forțează sync complet de la API
   */
  async forceCrossBrowserSync(): Promise<void> {
    console.log('⚡ JobService: Force cross-browser sync requested');
    await this.syncFromAPI();
    await apiService.forceSync();
  }
}

// Exportă o instanță singleton
export const jobService = new JobService();
export type { Job, JobUpdate, JobServiceListener, NotificationData };
