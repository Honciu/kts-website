'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { jobService, type Job } from '@/utils/jobService';
import { realtimeSync } from '@/utils/realtimeSync';
import { clearAllMockData, checkMockDataStatus } from '@/utils/clearMockData';
import { 
  TestTube,
  Plus,
  RefreshCw,
  Bell,
  CheckCircle,
  AlertTriangle,
  Users,
  Briefcase
} from 'lucide-react';

export default function AdminTest() {
  const { user } = useAuth();
  const router = useRouter();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }

    // Load jobs
    const loadJobs = () => {
      const jobs = jobService.getAllJobs();
      setAllJobs(jobs);
    };

    loadJobs();

    // Add listener for real-time updates
    jobService.addListener('admin-test', {
      onJobUpdate: (job, update) => {
        addToLog(`📡 Job updated: #${job.id} - ${job.serviceName} (${update.data?.action || 'unknown'})`);
        loadJobs();
      },
      onJobComplete: (job) => {
        addToLog(`✅ Job completed: #${job.id} - ${job.serviceName}`);
        loadJobs();
      },
      onJobStatusChange: (jobId, oldStatus, newStatus) => {
        addToLog(`🔄 Status changed: Job #${jobId} from ${oldStatus} to ${newStatus}`);
        loadJobs();
      }
    });

    return () => {
      jobService.removeListener('admin-test');
    };
  }, [user, router]);

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ro-RO');
    setTestLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]); // Keep only last 20 entries
  };

  const createTestJob = async () => {
    setIsCreatingJob(true);
    
    try {
      const testJob: Omit<Job, 'id' | 'createdAt'> = {
        clientName: `Test Client ${Date.now()}`,
        clientPhone: '+40700000000',
        address: `Str. Test nr. ${Math.floor(Math.random() * 100)}, București`,
        serviceName: 'Test Service - Sincronizare',
        serviceDescription: 'Aceasta este o lucrare de test pentru sincronizarea în timp real între administratori și lucrători.',
        specialInstructions: 'Verificați dashboard-ul lucrătorului pentru a vedea dacă lucrarea apare imediat.',
        assignedEmployeeId: 'worker1',
        assignedEmployeeName: 'Robert',
        status: 'assigned',
        priority: Math.random() > 0.5 ? 'urgent' : 'normal'
      };
      
      const createdJob = jobService.addJob(testJob);
      addToLog(`➕ Created test job: #${createdJob.id} - Priority: ${createdJob.priority.toUpperCase()}`);
      
      // Show success message
      alert(`✅ Test job #${createdJob.id} created successfully!\n\n🔧 Job Details:\n- Client: ${createdJob.clientName}\n- Service: ${createdJob.serviceName}\n- Priority: ${createdJob.priority.toUpperCase()}\n- Assigned to: ${createdJob.assignedEmployeeName}\n\n📱 Check the worker dashboard to see if it appears immediately!`);
      
    } catch (error) {
      console.error('Error creating test job:', error);
      addToLog('❌ Error creating test job');
      alert('❌ Error creating test job. Check console for details.');
    } finally {
      setIsCreatingJob(false);
    }
  };

  const forceRefreshAllTabs = () => {
    realtimeSync.forceRefresh('Admin test page requested refresh');
    addToLog('🔄 Sent refresh signal to all open tabs');
    alert('🔄 Refresh signal sent to all tabs!\n\nAll open worker and admin dashboards should reload their data now.');
  };

  const testNotification = () => {
    const futureTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    jobService.createAppointmentReminder('worker1', allJobs[0]?.id || '1001', futureTime);
    addToLog('🔔 Sent test notification to worker');
    alert('🔔 Test notification sent to worker!\n\nWorkers should receive a notification about an upcoming appointment.');
  };

  const simulateJobAcceptance = () => {
    const activeJobs = allJobs.filter(job => job.status === 'assigned');
    if (activeJobs.length === 0) {
      alert('⚠️ No assigned jobs to simulate acceptance for. Create a test job first.');
      return;
    }

    const jobToAccept = activeJobs[0];
    jobService.updateJobStatus(jobToAccept.id, 'accepted', 'worker1', 'Robert (Test)');
    addToLog(`✅ Simulated job acceptance: #${jobToAccept.id}`);
    alert(`✅ Simulated worker accepting job #${jobToAccept.id}!\n\nThis should trigger notifications for all admins.`);
  };

  const clearTestLog = () => {
    setTestLog([]);
    addToLog('📝 Test log cleared');
  };
  
  const clearMockData = () => {
    const status = checkMockDataStatus();
    
    if (status.totalEntries === 0) {
      alert('ℹ️ No mock data found to clear!\n\nOnly REAL API data is being used.');
      addToLog('ℹ️ No mock data found to clear');
      return;
    }
    
    const confirmed = confirm(
      `🧹 Clear ALL mock data?\n\n` +
      `Found ${status.totalEntries} mock data entries:\n` +
      `${status.keys.join(', ')}\n\n` +
      `This will force the app to use ONLY real API data from Prisma database.\n\n` +
      `Continue?`
    );
    
    if (confirmed) {
      const result = clearAllMockData();
      const message = `🧹 Cleared ${result.cleared} mock data entries - app will now use ONLY real API data`;
      addToLog(message);
      alert(`✅ Mock data cleared!\n\n${result.cleared} entries removed.\n\nThe app will now refresh and use ONLY real API data.`);
      
      // Force refresh after clearing
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const stats = [
    { title: 'Total Jobs', value: allJobs.length.toString(), color: Colors.info, icon: Briefcase },
    { title: 'Assigned Jobs', value: allJobs.filter(j => j.status === 'assigned').length.toString(), color: Colors.warning, icon: AlertTriangle },
    { title: 'Completed Jobs', value: allJobs.filter(j => j.status === 'completed').length.toString(), color: Colors.success, icon: CheckCircle },
    { title: 'Active Workers', value: '3', color: Colors.secondary, icon: Users },
  ];

  return (
    <AdminLayout currentPage="/admin/test" pageTitle="Test Sincronizare Timp Real">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <TestTube size={32} color={Colors.secondary} />
            <div>
              <h2 className="text-2xl font-bold" style={{ color: Colors.text }}>
                Test Sincronizare în Timp Real
              </h2>
              <p style={{ color: Colors.textSecondary }}>
                Testează funcționalitatea de sincronizare între administratori și lucrători
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
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

        {/* Test Actions */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
            🧪 Acțiuni de Test
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={createTestJob}
              disabled={isCreatingJob}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isCreatingJob ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: Colors.secondary,
                color: Colors.background,
              }}
            >
              {isCreatingJob ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: Colors.background }}></div>
              ) : (
                <Plus size={20} />
              )}
              {isCreatingJob ? 'Se creează...' : 'Creează Job de Test'}
            </button>

            <button
              onClick={forceRefreshAllTabs}
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: Colors.info,
                color: Colors.background,
              }}
            >
              <RefreshCw size={20} />
              Actualizează Toate Tab-urile
            </button>

            <button
              onClick={testNotification}
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: Colors.warning,
                color: Colors.background,
              }}
            >
              <Bell size={20} />
              Trimite Notificare Test
            </button>

            <button
              onClick={simulateJobAcceptance}
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: Colors.success,
                color: Colors.background,
              }}
            >
              <CheckCircle size={20} />
              Simulează Acceptare Job
            </button>
            
            <button
              onClick={clearMockData}
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors border"
              style={{
                borderColor: Colors.error,
                color: Colors.error,
              }}
            >
              🧹
              Cureaxă Date Mock
            </button>
          </div>

          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
            <p className="text-sm" style={{ color: Colors.textMuted }}>
              💡 <strong>Instrucțiuni:</strong>
            </p>
            <ul className="text-sm mt-2 space-y-1" style={{ color: Colors.textSecondary }}>
              <li>• <strong>Prima dată:</strong> Apasă "Cureaxă Date Mock" pentru a folosi doar date reale din API</li>
              <li>• Deschide dashboard-ul lucrătorului într-un alt tab sau browser</li>
              <li>• Crează un job de test și verifică dacă apare imediat la lucrător</li>
              <li>• Testează notificările și actualizările în timp real</li>
              <li>• Folosește "Actualizează Toate Tab-urile" pentru sincronizare forțată</li>
            </ul>
          </div>
        </div>

        {/* Live Test Log */}
        <div
          className="rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: Colors.border }}>
            <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
              📊 Log Sincronizare în Timp Real
            </h3>
            <button
              onClick={clearTestLog}
              className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: Colors.surfaceLight,
                color: Colors.textSecondary,
              }}
            >
              Șterge Log
            </button>
          </div>
          
          <div className="p-4">
            {testLog.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testLog.map((entry, index) => (
                  <div
                    key={index}
                    className="text-sm p-2 rounded"
                    style={{
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.textSecondary,
                      fontFamily: 'monospace'
                    }}
                  >
                    {entry}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TestTube size={48} color={Colors.textMuted} className="mx-auto mb-4" />
                <p style={{ color: Colors.textSecondary }}>
                  Log-ul de sincronizare va apărea aici când testezi funcționalitățile
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}