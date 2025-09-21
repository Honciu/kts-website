'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import WorkerLayout from '@/components/WorkerLayout';
import { jobService, type Job } from '@/utils/jobService';
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

  // Load active jobs and stats - moved outside useEffect to be accessible
  const loadDashboardData = React.useCallback(() => {
    setIsRefreshing(true);
    console.log('🔄 Worker Dashboard: Loading data...');
    
    const jobs = jobService.getActiveJobsForWorker('worker1'); // În aplicația reală ar fi user.id
    const workerStats = jobService.getWorkerStats('worker1');
    const currentWeekReport = jobService.getWeeklyFinancialReport('worker1', new Date());
    
    console.log(`📊 Worker Dashboard: Found ${jobs.length} active jobs`);
    console.log('📊 Worker Dashboard: Jobs:', jobs.map(j => `#${j.id} - ${j.serviceName}`));
    
    setActiveJobs(jobs);
    setStats(workerStats);
    setWeeklyReport({
      totalEarnings: currentWeekReport.totalEarnings,
      totalCollected: currentWeekReport.totalCollected,
      amountToHandOver: currentWeekReport.amountToHandOver,
      completedJobs: currentWeekReport.completedJobs,
      pendingApproval: currentWeekReport.pendingApproval
    });
    
    setLastSyncTime(new Date());
    
    // Hide refresh indicator after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, []);

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
    
    // Add listener for real-time updates
    jobService.addListener('worker-dashboard', {
      onJobUpdate: (job, update) => {
        console.log('📡 Worker Dashboard: Job update received', job.id, update.data?.action || 'unknown');
        loadDashboardData();
      },
      onJobComplete: (job) => {
        console.log('🎉 Worker Dashboard: Job completed', job.id);
        loadDashboardData();
      },
      onJobStatusChange: (jobId, oldStatus, newStatus) => {
        console.log('🔄 Worker Dashboard: Status change', jobId, `${oldStatus} -> ${newStatus}`);
        loadDashboardData();
      }
    });
    
    // Add periodic refresh to catch any missed updates
    const refreshInterval = setInterval(() => {
      console.log('🔄 Worker Dashboard: Periodic refresh (10s)');
      loadDashboardData();
    }, 10000); // Every 10 seconds
    
    // Add simple sync listener for guaranteed updates
    simpleSync.addListener('worker-dashboard-simple', () => {
      console.log('🔥 Worker Dashboard: Simple sync triggered - reloading data');
      loadDashboardData();
    });
    
    // Add frequent checks for missed updates
    const quickCheckInterval = setInterval(() => {
      console.log('⚡ Worker Dashboard: Quick check (3s)');
      loadDashboardData();
    }, 3000); // Every 3 seconds for debugging
    
    // Cleanup listener and interval
    return () => {
      console.log('🧾 Worker Dashboard: Cleaning up listeners');
      jobService.removeListener('worker-dashboard');
      simpleSync.removeListener('worker-dashboard-simple');
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (quickCheckInterval) {
        clearInterval(quickCheckInterval);
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

  const acceptJob = (jobId: string) => {
    const job = activeJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const confirmAccept = confirm(`Acceptați lucrarea #${jobId} - ${job.serviceName} pentru ${job.clientName}?`);
    if (!confirmAccept) return;
    
    jobService.updateJobStatus(jobId, 'accepted', 'worker1', user?.name || 'Worker');
    
    // Simulăm că primesc o programare în 30 min pentru demonstrare
    setTimeout(() => {
      jobService.createAppointmentReminder('worker1', jobId, new Date(Date.now() + 30 * 60 * 1000));
    }, 2000);
    
    alert(`Ați acceptat lucrarea #${jobId}! Veți fi îndrumați spre locație.`);
  };

  const navigateToJob = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(address + ', București')}`;
    window.open(mapsUrl, '_blank');
    alert('Veți fi redirecționați către Google Maps pentru navigație.');
  };

  const rejectJob = (jobId: string) => {
    const job = activeJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const reason = prompt(`De ce respingeți lucrarea #${jobId}?`, 'Nu sunt disponibil');
    if (reason === null) return;
    
    const confirmReject = confirm(`Sigur doriți să respingeți lucrarea #${jobId}?`);
    if (!confirmReject) return;
    
    jobService.updateJobStatus(jobId, 'cancelled', 'worker1', user?.name || 'Worker', { reason });
    alert(`Ați respins lucrarea #${jobId}. Motivul: ${reason}`);
  };

  return (
    <WorkerLayout currentPage="/worker/dashboard" pageTitle="Dashboard Lucrător">
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: Colors.text }}>
            Bună ziua, {user.name}!
          </h2>
          <p style={{ color: Colors.textSecondary }}>
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                  Lucrări Active ({activeJobs.length})
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      console.log('🔄 Manual refresh requested');
                      loadDashboardData();
                    }}
                    disabled={isRefreshing}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors mr-2 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                      backgroundColor: Colors.info,
                      color: Colors.background,
                    }}
                  >
                    {isRefreshing ? '🔄 Se actualizează...' : '🔄 Refresh'}
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
                    className="px-3 py-1 rounded-lg text-sm font-medium transition-colors mr-2"
                    style={{
                      backgroundColor: Colors.warning,
                      color: Colors.background,
                    }}
                  >
                    🌍 Cross-Browser
                  </button>
                  <button
                    onClick={() => router.push('/worker/completed-jobs')}
                    className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: Colors.secondary,
                      color: Colors.background,
                    }}
                  >
                    📋 Joburi Finalizate
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${isRefreshing ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: isRefreshing ? Colors.warning : Colors.success }}
                      ></div>
                      <span className="text-sm" style={{ color: Colors.textSecondary }}>
                        {isRefreshing ? 'Actualizare...' : 'Online'}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: Colors.textMuted }}>
                      Ultima sync: {lastSyncTime.toLocaleTimeString('ro-RO')}
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
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold" style={{ color: Colors.text }}>
                              #{job.id} - {job.serviceName}
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
                          <p className="flex items-center gap-2 mb-1" style={{ color: Colors.textSecondary }}>
                            <User size={16} />
                            {job.clientName}
                          </p>
                          <p className="flex items-center gap-2 mb-1" style={{ color: Colors.textSecondary }}>
                            <MapPin size={16} />
                            {job.address}
                          </p>
                          <p className="flex items-center gap-2 mb-1" style={{ color: Colors.textSecondary }}>
                            📞 {job.clientPhone}
                          </p>
                          <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                            <Clock size={16} />
                            Creat: {new Date(job.createdAt).toLocaleTimeString('ro-RO')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => router.push(`/worker/job/${job.id}`)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                          style={{
                            backgroundColor: Colors.success,
                            color: Colors.primary,
                          }}
                          title="Vizualizează detaliile lucrării"
                        >
                          <CheckCircle size={16} />
                          Vizualizează Lucrarea
                        </button>
                        <button
                          onClick={() => navigateToJob(job.address)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                          style={{
                            backgroundColor: Colors.info,
                            color: Colors.primary,
                          }}
                          title="Deschide Google Maps pentru navigație"
                        >
                          <Navigation size={16} />
                          Navigare
                        </button>
                        <button
                          onClick={() => rejectJob(job.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors"
                          style={{
                            borderColor: Colors.border,
                            color: Colors.textSecondary,
                          }}
                          title="Respinge lucrarea"
                        >
                          <AlertCircle size={16} />
                          Respinge
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