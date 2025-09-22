'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { realApiService } from '@/utils/realApiService';
import { 
  Wrench, 
  Users, 
  Briefcase, 
  FileText, 
  BarChart3,
  DollarSign,
  Menu,
  X,
  LogOut,
  Settings
} from 'lucide-react';

interface DashboardStats {
  activeJobs: number;
  activeEmployees: number;
  weeklyRevenue: number;
  weeklyProfit: number;
}

interface RecentActivity {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: string;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    activeJobs: 0,
    activeEmployees: 0,
    weeklyRevenue: 0,
    weeklyProfit: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // FORCE clear any mock data first
      if (typeof window !== 'undefined') {
        const mockKeys = ['kts_jobs_data', 'kts_notifications_data', 'kts_worker_location', 'kts_sync_data', 'kts_api_cache', 'kts_local_jobs'];
        mockKeys.forEach(key => localStorage.removeItem(key));
        console.log('🧹 Dashboard: Cleared all mock data from localStorage');
      }
      
      console.log('🏠 Dashboard: Loading REAL data ONLY from API...');
      const [jobsResponse, usersResponse] = await Promise.all([
        realApiService.getJobs(),
        fetch('/api/users').then(res => res.json())
      ]);
      
      if (jobsResponse.success) {
        const allJobs = jobsResponse.data;
        
        console.log('📋 Dashboard REAL DATA ANALYSIS:');
        console.log('  • Total jobs from API:', allJobs.length);
        console.log('  • Full job data:', allJobs.map(j => ({
          id: j.id,
          status: j.status,
          clientName: j.clientName,
          serviceName: j.serviceName,
          createdAt: j.createdAt,
          completedAt: j.completedAt
        })));
        
        const completedJobs = allJobs.filter(j => j.status === 'completed');
        const activeJobsCalc = allJobs.filter(j => !['completed', 'cancelled'].includes(j.status));
        
        console.log('  • Completed jobs:', completedJobs.length);
        console.log('  • Active jobs calculated:', activeJobsCalc.length);
        console.log('  • Active jobs details:', activeJobsCalc.map(j => `#${j.id}: ${j.status} - ${j.serviceName}`));
        
        // Calculate active jobs (not completed or cancelled)
        const activeJobs = allJobs.filter(job => 
          !['completed', 'cancelled'].includes(job.status)
        ).length;
        
        // Get TOTAL active employees from users API (not just those with jobs)
        let activeEmployees = 0;
        if (usersResponse.success) {
          const allUsers = usersResponse.data;
          const workers = allUsers.filter(user => user.type === 'WORKER' && user.isActive);
          activeEmployees = workers.length;
          
          console.log('👥 Users REAL DATA:');
          console.log('  • Total users from API:', allUsers.length);
          console.log('  • Active workers:', activeEmployees);
          workers.forEach(worker => {
            console.log(`    - ${worker.name} (${worker.email})`);
          });
        } else {
          console.error('❌ Users API failed, fallback to job-based calculation');
          const activeEmployeeIds = new Set(
            allJobs
              .filter(job => !['completed', 'cancelled'].includes(job.status))
              .map(job => job.assignedEmployeeId)
          );
          activeEmployees = activeEmployeeIds.size;
        }
        
        // Calculate weekly revenue and profit
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weeklyJobs = allJobs.filter(job => {
          const jobDate = new Date(job.completedAt || job.createdAt);
          return job.status === 'completed' && jobDate >= oneWeekAgo;
        });
        
        console.log('📋 Weekly Jobs Calculation:');
        console.log('  • Completed jobs this week:', weeklyJobs.length);
        weeklyJobs.forEach(job => {
          const total = job.completionData?.totalAmount || 0;
          const commission = job.completionData?.workerCommission || 0;
          console.log(`    - Job #${job.id}: ${total} RON total, ${commission} RON commission`);
        });
        
        const weeklyRevenue = weeklyJobs.reduce((total, job) => {
          return total + (job.completionData?.totalAmount || 0);
        }, 0);
        
        const weeklyExpenses = weeklyJobs.reduce((total, job) => {
          return total + (job.completionData?.workerCommission || 0);
        }, 0);
        
        const weeklyProfit = weeklyRevenue - weeklyExpenses;
        
        console.log('💰 Financial Summary:');
        console.log(`  • Weekly Revenue: ${weeklyRevenue} RON`);
        console.log(`  • Weekly Expenses: ${weeklyExpenses} RON`);
        console.log(`  • Weekly Profit: ${weeklyProfit} RON`);
        
        setDashboardStats({
          activeJobs,
          activeEmployees,
          weeklyRevenue,
          weeklyProfit
        });
        
        // Generate recent activities from actual jobs
        const recentCompletedJobs = allJobs
          .filter(job => job.status === 'completed')
          .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
          .slice(0, 3);
        
        const activities: RecentActivity[] = recentCompletedJobs.map(job => ({
          id: job.id,
          message: `Lucrarea #${job.id} a fost finalizată de ${job.assignedEmployeeName}`,
          type: 'success' as const,
          timestamp: job.completedAt || job.createdAt
        }));
        
        // Add recent new jobs
        const recentNewJobs = allJobs
          .filter(job => job.status === 'assigned')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2);
        
        recentNewJobs.forEach(job => {
          activities.push({
            id: job.id + '_new',
            message: `Nouă lucrare adăugată pentru ${job.address}`,
            type: 'info' as const,
            timestamp: job.createdAt
          });
        });
        
        // Sort by timestamp and limit to 5
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivities(activities.slice(0, 5));
        
        console.log('✅ Dashboard: Real data loaded successfully!');
      } else {
        console.error('❌ Dashboard: API error:', response.error);
      }
    } catch (error) {
      console.error('❌ Dashboard: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    
    loadDashboardData();
    
    // Add REAL API listener for real-time updates
    realApiService.addChangeListener('admin-dashboard-real', (hasChanges) => {
      if (hasChanges) {
        console.log('🏠 Dashboard: REAL API changes detected - syncing!');
        loadDashboardData();
      }
    });
    
    return () => {
      console.log('🧹 Dashboard: Cleaning up listeners');
      realApiService.removeChangeListener('admin-dashboard-real');
    };
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard', active: true },
    { icon: Users, label: 'Angajați', path: '/admin/employees' },
    { icon: Briefcase, label: 'Lucrări', path: '/admin/jobs' },
    { icon: FileText, label: 'Rapoarte', path: '/admin/reports' },
    { icon: DollarSign, label: 'Reclame', path: '/admin/ads' },
    { icon: Settings, label: 'Setări', path: '/admin/settings' },
  ];

  const stats = [
    { 
      title: 'Lucrări Active', 
      value: loading ? '...' : dashboardStats.activeJobs.toString(), 
      color: Colors.info, 
      icon: Briefcase 
    },
    { 
      title: 'Angajați Activi', 
      value: loading ? '...' : dashboardStats.activeEmployees.toString(), 
      color: Colors.success, 
      icon: Users 
    },
    { 
      title: 'Venit Săptămânal', 
      value: loading ? '...' : `${dashboardStats.weeklyRevenue.toLocaleString('ro-RO')} RON`, 
      color: Colors.warning, 
      icon: DollarSign 
    },
    { 
      title: 'Profit', 
      value: loading ? '...' : `${dashboardStats.weeklyProfit.toLocaleString('ro-RO')} RON`, 
      color: Colors.secondary, 
      icon: BarChart3 
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.background }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg transition-colors"
                style={{ backgroundColor: Colors.surfaceLight }}
              >
                {isMobileMenuOpen ? <X size={20} color={Colors.textSecondary} /> : <Menu size={20} color={Colors.textSecondary} />}
              </button>
              
              <Wrench size={32} color={Colors.secondary} />
              <div>
                <h1 className="text-lg md:text-xl font-bold" style={{ color: Colors.secondary }}>
                  Lăcătuș București
                </h1>
                <p className="text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                  Panou Administrator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-sm md:text-base" style={{ color: Colors.text }}>
                  {user.name}
                </p>
                <p className="text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                  Administrator{user.isManager ? ' Principal' : ''}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                style={{ backgroundColor: Colors.surfaceLight }}
                title="Logout"
              >
                <LogOut size={20} color={Colors.textSecondary} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r min-h-[calc(100vh-77px)]" style={{ 
          backgroundColor: Colors.surface, 
          borderColor: Colors.border 
        }}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    item.active ? 'font-medium' : ''
                  }`}
                  style={{
                    backgroundColor: item.active ? Colors.secondary : 'transparent',
                    color: item.active ? Colors.background : Colors.textSecondary,
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        
        {/* Mobile Sidebar */}
        <aside 
          className={`lg:hidden fixed top-0 left-0 h-full w-64 border-r z-50 transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ 
            backgroundColor: Colors.surface, 
            borderColor: Colors.border 
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: Colors.border }}>
            <div className="flex items-center gap-3">
              <Wrench size={24} color={Colors.secondary} />
              <h2 className="font-bold" style={{ color: Colors.secondary }}>
                Lăcătuș București
              </h2>
            </div>
          </div>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    item.active ? 'font-medium' : ''
                  }`}
                  style={{
                    backgroundColor: item.active ? Colors.secondary : 'transparent',
                    color: item.active ? Colors.background : Colors.textSecondary,
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 w-full min-w-0">
          <div className="space-y-6">
            {/* Welcome */}
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: Colors.text }}>
                Bun venit, {user.name}!
              </h2>
              <p style={{ color: Colors.textSecondary }}>
                Aici puteți gestiona toate aspectele afacerii dumneavoastră.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              <div
                className="p-6 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-colors"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                }}
                onClick={() => router.push('/admin/jobs')}
              >
                <Briefcase size={32} color={Colors.secondary} className="mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Gestionează Lucrări
                </h3>
                <p style={{ color: Colors.textSecondary }}>
                  Atribuie și monitorizează lucrările active
                </p>
              </div>

              <div
                className="p-6 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-colors"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                }}
                onClick={() => router.push('/admin/employees')}
              >
                <Users size={32} color={Colors.success} className="mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Gestionează Angajați
                </h3>
                <p style={{ color: Colors.textSecondary }}>
                  Adaugă și editează informațiile angajaților
                </p>
              </div>

              <div
                className="p-6 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-colors"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                }}
                onClick={() => router.push('/admin/reports')}
              >
                <FileText size={32} color={Colors.warning} className="mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Rapoarte
                </h3>
                <p style={{ color: Colors.textSecondary }}>
                  Vizualizează rapoarte și statistici
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
                Activitate Recentă
              </h3>
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2" style={{ borderColor: Colors.secondary }}></div>
                  <p className="text-sm" style={{ color: Colors.textSecondary }}>Se încarcă activitatea...</p>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center p-4">
                  <p style={{ color: Colors.textSecondary }}>Nu există activitate recentă.</p>
                  <p className="text-sm mt-1" style={{ color: Colors.textMuted }}>Activitatea va apărea după ce vor fi create sau finalizate joburi.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity) => {
                    const dotColor = activity.type === 'success' ? Colors.success : 
                                   activity.type === 'info' ? Colors.info : Colors.warning;
                    return (
                      <div key={activity.id} className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dotColor }}
                        ></div>
                        <p style={{ color: Colors.textSecondary }}>
                          {activity.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}