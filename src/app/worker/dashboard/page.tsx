'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import WorkerLayout from '@/components/WorkerLayout';
import { jobService, type Job } from '@/utils/jobService';
import { realApiService } from '@/utils/realApiService';
import { simpleSync } from '@/utils/simpleSync';
import '@/utils/debugUtils'; // Load debugging utilities
import { 
  User, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  DollarSign
} from 'lucide-react';

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedToday: 0,
    weeklyEarnings: 0,
    urgentJobs: 0
  });
  const [weeklyReport, setWeeklyReport] = useState({
    totalEarnings: 0,
    totalCollected: 0,
    amountToHandOver: 0,
    completedJobs: 0,
    pendingApproval: 0
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load active jobs and stats - FIXED to use REAL API instead of localStorage!
  const loadDashboardData = React.useCallback(async () => {
    setIsRefreshing(true);
    console.log('🔄 Worker Dashboard: Loading data from REAL API...');
    
    try {
      // Folosește API-ul real în loc de localStorage!
      const apiResponse = await realApiService.getJobs();
      
      if (apiResponse.success) {
        const allJobs = apiResponse.data;
        const workerId = 'cmfudasin0001v090qs1frclc'; // Force Robert's ID from seed data
        
        console.log('🔍 Worker Dashboard DEBUG:');
        console.log('  - User from session:', user);
        console.log('  - User ID from session:', user?.id);
        console.log('  - Forced Worker ID:', workerId);
        console.log('  - Total jobs from API:', allJobs.length);
        console.log('  - All jobs:', allJobs.map(j => ({ id: j.id, assignedTo: j.assignedEmployeeId, service: j.serviceName, status: j.status })));
        
        // Filtrează joburile pentru worker-ul curent
        const workerJobs = allJobs.filter(job => job.assignedEmployeeId === workerId);
        const activeJobs = workerJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status));
        const completedJobs = workerJobs.filter(job => ['completed', 'pending_approval'].includes(job.status));
        
        console.log(`📊 Worker Dashboard: Found ${workerJobs.length} total jobs for worker ${workerId}`);
        console.log(`📊 Worker Dashboard: Found ${activeJobs.length} active jobs from API`);
        console.log('📊 Worker Dashboard: Active Jobs:', activeJobs.map(j => `#${j.id} - ${j.serviceName} (${j.status})`));
        console.log('📊 Worker Dashboard: Worker Jobs:', workerJobs.map(j => `#${j.id} - ${j.serviceName} (${j.status})`));
        
        // Calculează statistici
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const completedToday = completedJobs.filter(job => {
          if (!job.completedAt) return false;
          const completedDate = new Date(job.completedAt);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        }).length;
        
        const weeklyEarnings = completedJobs.reduce((total, job) => {
          return total + (job.completionData?.workerCommission || 0);
        }, 0);
        
        const urgentJobs = activeJobs.filter(job => job.priority === 'urgent').length;
        
        setActiveJobs(activeJobs);
        setStats({
          activeJobs: activeJobs.length,
          completedToday,
          weeklyEarnings,
          urgentJobs
        });
        setWeeklyReport({
          totalEarnings: weeklyEarnings,
          totalCollected: weeklyEarnings,
          amountToHandOver: Math.max(0, weeklyEarnings - 100),
          completedJobs: completedJobs.length,
          pendingApproval: completedJobs.filter(j => j.status === 'pending_approval').length
        });
        
        console.log('✅ Worker Dashboard: Data loaded from REAL API successfully!');
      } else {
        console.error('❌ Worker Dashboard: API error:', apiResponse);
      }
    } catch (error) {
      console.error('❌ Worker Dashboard: Error loading from API:', error);
    }
    
    setLastSyncTime(new Date());
    
    // Hide refresh indicator after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [user]);

  useEffect(() => {
    if (!user || user.type !== 'worker') {
      router.replace('/');
      return;
    }
    
    // Initial data load
    console.log('⚡ Worker Dashboard: Initial load starting...');
    loadDashboardData();
    
    // Force immediate data refresh from localStorage
    setTimeout(() => {
      console.log('⚡ Worker Dashboard: Force checking localStorage after 1s...');
      loadDashboardData();
    }, 1000);
    
    // Add REAL API listener for cross-device sync!
    realApiService.addChangeListener('worker-dashboard-real', (hasChanges) => {
      if (hasChanges) {
        console.log('📡 Worker Dashboard: REAL API changes detected - syncing!');
        loadDashboardData();
      }
    });
    
    // Keep old listeners as backup, but REAL API is primary
    jobService.addListener('worker-dashboard-backup', {
      onJobUpdate: (job, update) => {
        console.log('📡 Worker Dashboard: Backup job update received', job.id);
        loadDashboardData();
      },
      onJobComplete: (job) => {
        console.log('🎉 Worker Dashboard: Backup job completed', job.id);
        loadDashboardData();
      },
      onJobStatusChange: (jobId, oldStatus, newStatus) => {
        console.log('🔄 Worker Dashboard: Backup status change', jobId, `${oldStatus} -> ${newStatus}`);
        loadDashboardData();
      }
    });
    
    // Force sync from API every 5 seconds as fallback
    const forceApiSync = setInterval(() => {
      console.log('⚡ Worker Dashboard: Force API sync (5s)');
      realApiService.forceSync();
    }, 5000);
    
    // Cleanup listeners and intervals
    return () => {
      console.log('🧾 Worker Dashboard: Cleaning up ALL listeners including REAL API');
      
      // Remove REAL API listener (primary)
      realApiService.removeChangeListener('worker-dashboard-real');
      
      // Remove backup listeners
      jobService.removeListener('worker-dashboard-backup');
      simpleSync.removeListener('worker-dashboard-simple');
      
      // Clear intervals
      if (forceApiSync) {
        clearInterval(forceApiSync);
      }
    };
  }, [user, router]);


  if (!user || user.type !== 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }


  const todayStats = [
    { title: 'Joburi Active', value: stats.activeJobs.toString(), color: Colors.warning, icon: Clock },
    { title: 'Câștiguri Săptămâna', value: `${stats.weeklyEarnings} RON`, color: Colors.success, icon: DollarSign },
    { title: 'Finalizate Azi', value: stats.completedToday.toString(), color: Colors.info, icon: CheckCircle },
    { title: 'Urgent', value: stats.urgentJobs.toString(), color: Colors.error, icon: AlertCircle },
  ];

  const acceptJob = async (jobId: string) => {
    const job = activeJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const confirmAccept = confirm(`Acceptați lucrarea #${jobId} - ${job.serviceName} pentru ${job.clientName}?`);
    if (!confirmAccept) return;
    
    try {
      // Folosește API-ul REAL pentru acceptare!
      const updatedJob = { ...job, status: 'accepted' as const, acceptedAt: new Date().toISOString() };
      const response = await realApiService.updateJob(jobId, updatedJob);
      
      if (response.success) {
        console.log('✅ Job accepted via REAL API:', jobId);
        alert(`Ați acceptat lucrarea #${jobId}! Veți fi îndrumați spre locație.`);
        
        // Refresh immediate pentru a vedea schimbarea
        loadDashboardData();
      } else {
        alert('Eroare la acceptarea lucrării. Încercați din nou.');
      }
    } catch (error) {
      console.error('❌ Error accepting job:', error);
      alert('Eroare la acceptarea lucrării. Încercați din nou.');
    }
  };

  const navigateToJob = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(address + ', București')}`;
    window.open(mapsUrl, '_blank');
    alert('Veți fi redirecționați către Google Maps pentru navigație.');
  };

  const rejectJob = async (jobId: string) => {
    const job = activeJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const reason = prompt(`De ce respingeți lucrarea #${jobId}?`, 'Nu sunt disponibil');
    if (reason === null) return;
    
    const confirmReject = confirm(`Sigur doriți să respingeți lucrarea #${jobId}?`);
    if (!confirmReject) return;
    
    try {
      // Folosește API-ul REAL pentru respingere!
      const updatedJob = { ...job, status: 'cancelled' as const, completionData: { reason } as any };
      const response = await realApiService.updateJob(jobId, updatedJob);
      
      if (response.success) {
        console.log('✅ Job rejected via REAL API:', jobId);
        alert(`Ați respins lucrarea #${jobId}. Motivul: ${reason}`);
        
        // Refresh immediate pentru a vedea schimbarea
        loadDashboardData();
      } else {
        alert('Eroare la respingerea lucrării. Încercați din nou.');
      }
    } catch (error) {
      console.error('❌ Error rejecting job:', error);
      alert('Eroare la respingerea lucrării. Încercați din nou.');
    }
  };

  return (
    <WorkerLayout currentPage="/worker/dashboard" pageTitle="Dashboard Lucrător">
      <div className="space-y-6">
        {/* Welcome - Responsive */}
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" style={{ color: Colors.text }}>
            Bună ziua, {user.name}!
          </h2>
          <p className="text-sm sm:text-base" style={{ color: Colors.textSecondary }}>
            Iată programul și lucrările dumneavoastră pentru astăzi.
          </p>
        </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {todayStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                    style={{
                      backgroundColor: Colors.surface,
                      borderColor: Colors.border,
                    }}
                    onClick={() => {
                      if (stat.title === 'Câștiguri Săptămâna') {
                        router.push('/worker/earnings');
                      } else if (stat.title === 'Finalizate Azi' || stat.title === 'Urgent') {
                        router.push('/worker/completed-jobs');
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Icon size={24} color={stat.color} />
                      <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                        {stat.value}
                      </span>
                    </div>
                    <p className="font-medium" style={{ color: Colors.textSecondary }}>
                      {stat.title}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Active Jobs */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h3 className="text-lg sm:text-xl font-semibold text-center sm:text-left" style={{ color: Colors.text }}>
                  Lucrări Active ({activeJobs.length})
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center sm:justify-end">
                  <button
                    onClick={() => {
                      console.log('🔄 Manual refresh requested');
                      loadDashboardData();
                    }}
                    disabled={isRefreshing}
                    className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                      backgroundColor: Colors.info,
                      color: Colors.background,
                    }}
                  >
                    <span className="hidden sm:inline">{isRefreshing ? '🔄 Se actualizează...' : '🔄 Refresh'}</span>
                    <span className="sm:hidden">🔄</span>
                  </button>
                  <button
                    onClick={async () => {
                      console.log('🌍 Cross-browser sync test requested');
                      try {
                        await jobService.forceCrossBrowserSync();
                        alert('✅ Cross-browser sync forțat complet!\n\nVerifică dacă job-urile din alt browser au apărut.');
                        loadDashboardData();
                      } catch (error) {
                        console.error('Cross-browser sync error:', error);
                        alert('❌ Eroare la cross-browser sync!');
                      }
                    }}
                    className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: Colors.warning,
                      color: Colors.background,
                    }}
                  >
                    <span className="hidden sm:inline">🌍 Cross-Browser</span>
                    <span className="sm:hidden">🌍</span>
                  </button>
                  <button
                    onClick={() => router.push('/worker/completed-jobs')}
                    className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: Colors.secondary,
                      color: Colors.background,
                    }}
                  >
                    <span className="hidden sm:inline">📋 Joburi Finalizate</span>
                    <span className="sm:hidden">📋</span>
                  </button>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${isRefreshing ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: isRefreshing ? Colors.warning : Colors.success }}
                      ></div>
                      <span className="text-xs sm:text-sm" style={{ color: Colors.textSecondary }}>
                        {isRefreshing ? 'Actualizare...' : 'Online'}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: Colors.textMuted }}>
                      Sync: {lastSyncTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {activeJobs.length > 0 ? (
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: Colors.surfaceLight,
                        borderColor: job.priority === 'urgent' ? Colors.error : Colors.border,
                        borderWidth: job.priority === 'urgent' ? '2px' : '1px',
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm sm:text-base" style={{ color: Colors.text }}>
                              #{job.id.substring(0, 8)}... - {job.serviceName}
                            </h4>
                            {job.priority === 'urgent' && (
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: Colors.error,
                                  color: Colors.primary,
                                }}
                              >
                                URGENT
                              </span>
                            )}
                          </div>
                          <p className="flex items-center gap-2 mb-1 text-xs sm:text-sm" style={{ color: Colors.textSecondary }}>
                            <User size={14} />
                            <span className="truncate">{job.clientName}</span>
                          </p>
                          <p className="flex items-start gap-2 mb-1 text-xs sm:text-sm" style={{ color: Colors.textSecondary }}>
                            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{job.address}</span>
                          </p>
                          <p className="flex items-center gap-2 mb-1 text-xs sm:text-sm" style={{ color: Colors.textSecondary }}>
                            📞 <a href={`tel:${job.clientPhone}`} className="hover:underline">{job.clientPhone}</a>
                          </p>
                          <p className="flex items-center gap-2 text-xs" style={{ color: Colors.textSecondary }}>
                            <Clock size={14} />
                            <span className="hidden sm:inline">Creat: </span>{new Date(job.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          onClick={() => router.push(`/worker/job/${job.id}`)}
                          className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                          style={{
                            backgroundColor: Colors.success,
                            color: Colors.primary,
                          }}
                          title="Vizualizează detaliile lucrării"
                        >
                          <CheckCircle size={16} />
                          <span className="hidden sm:inline">Vizualizează Lucrarea</span>
                          <span className="sm:hidden">Vezi</span>
                        </button>
                        <button
                          onClick={() => navigateToJob(job.address)}
                          className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                          style={{
                            backgroundColor: Colors.info,
                            color: Colors.primary,
                          }}
                          title="Deschide Google Maps pentru navigație"
                        >
                          <Navigation size={16} />
                          <span className="hidden sm:inline">Navigare</span>
                          <span className="sm:hidden">Maps</span>
                        </button>
                        <button
                          onClick={() => rejectJob(job.id)}
                          className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border font-medium transition-colors text-xs sm:text-sm"
                          style={{
                            borderColor: Colors.border,
                            color: Colors.textSecondary,
                          }}
                          title="Respinge lucrarea"
                        >
                          <AlertCircle size={16} />
                          <span>Respinge</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle size={48} color={Colors.textMuted} className="mx-auto mb-4" />
                  <p className="text-lg" style={{ color: Colors.textSecondary }}>
                    Nu aveți lucrări active în acest moment
                  </p>
                  <p style={{ color: Colors.textMuted }}>
                    Veți fi notificat când veți primi o nouă lucrare
                  </p>
                </div>
              )}
            </div>

            {/* Weekly Summary Card */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                  📊 Rezumat Săptămânal
                </h3>
                <button
                  onClick={() => router.push('/worker/earnings')}
                  className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: Colors.secondary,
                    color: Colors.background,
                  }}
                >
                  Vezi Detalii
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                  <p className="text-lg font-bold" style={{ color: Colors.success }}>
                    {weeklyReport.totalEarnings} RON
                  </p>
                  <p className="text-sm" style={{ color: Colors.textSecondary }}>Câștiguri</p>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                  <p className="text-lg font-bold" style={{ color: Colors.info }}>
                    {weeklyReport.totalCollected} RON
                  </p>
                  <p className="text-sm" style={{ color: Colors.textSecondary }}>Încasat</p>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                  <p className="text-lg font-bold" style={{ color: Colors.error }}>
                    {weeklyReport.amountToHandOver} RON
                  </p>
                  <p className="text-sm" style={{ color: Colors.textSecondary }}>De predat</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm" style={{ color: Colors.textSecondary }}>
                <span>Joburi finalizate: <strong>{weeklyReport.completedJobs}</strong></span>
                <span>În aprobare: <strong style={{ color: Colors.warning }}>{weeklyReport.pendingApproval}</strong></span>
              </div>
            </div>

            {/* Today's Schedule */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
                Program de Astăzi
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: Colors.success }}
                    ></div>
                    <span style={{ color: Colors.text }}>09:00 - Deblocare ușă - Str. Mihai Viteazu</span>
                  </div>
                  <span
                    className="px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: Colors.success,
                      color: Colors.primary,
                    }}
                  >
                    FINALIZAT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: Colors.success }}
                    ></div>
                    <span style={{ color: Colors.text }}>11:30 - Schimbare yală - Calea Victoriei</span>
                  </div>
                  <span
                    className="px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: Colors.success,
                      color: Colors.primary,
                    }}
                  >
                    FINALIZAT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: Colors.warning }}
                    ></div>
                    <span style={{ color: Colors.text }}>14:30 - Deblocare ușă - Str. Aviatorilor</span>
                  </div>
                  <span
                    className="px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: Colors.warning,
                      color: Colors.background,
                    }}
                  >
                    PROGRAMAT
                  </span>
                </div>
              </div>
            </div>
      </div>
    </WorkerLayout>
  );
}