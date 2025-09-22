'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { realApiService } from '@/utils/realApiService';
import { 
  Users,
  Activity,
  Clock,
  CheckCircle,
  TrendingUp,
  User,
  Star,
  Phone,
  AlertTriangle
} from 'lucide-react';

interface EmployeeStats {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  rating?: number;
  totalJobs: number;
  activeJobs: number;
  assignedJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  pendingApprovalJobs: number;
  weeklyEarnings: number;
  jobs: any[];
}

export default function EmployeesDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    
    loadEmployeeStats();
    
    // Add real-time listener for updates
    realApiService.addChangeListener('employee-dashboard', (hasChanges) => {
      if (hasChanges) {
        console.log('🔄 Employee Dashboard: Changes detected - refreshing stats');
        loadEmployeeStats();
      }
    });
    
    return () => {
      realApiService.removeChangeListener('employee-dashboard');
    };
  }, [user, router]);

  const loadEmployeeStats = async () => {
    setLoading(true);
    try {
      const [jobsResponse] = await Promise.all([
        realApiService.getJobs()
      ]);
      
      if (jobsResponse.success) {
        const allJobs = jobsResponse.data;
        
        // Employee IDs from seed data
        const employees = [
          {
            id: 'cmfudasin0001v090qs1frclc',
            name: 'Robert',
            phone: '+40712345678',
            email: 'robert@kts.com',
            rating: 4.8
          },
          {
            id: 'cmfudasm70002v090fuu57u5k', 
            name: 'Demo User',
            phone: '+40721000000',
            email: 'demo@kts.com',
            rating: 4.5
          },
          {
            id: 'cmfudaspq0003v09023ejiha2',
            name: 'Lacatus 01', 
            phone: '+40731000000',
            email: 'lacatus01@kts.com',
            rating: 4.9
          }
        ];
        
        const stats: EmployeeStats[] = employees.map(employee => {
          const employeeJobs = allJobs.filter(job => job.assignedEmployeeId === employee.id);
          const activeJobs = employeeJobs.filter(job => ['assigned', 'accepted', 'in_progress'].includes(job.status));
          const assignedJobs = employeeJobs.filter(job => job.status === 'assigned');
          const inProgressJobs = employeeJobs.filter(job => job.status === 'in_progress');
          const completedJobs = employeeJobs.filter(job => job.status === 'completed');
          const pendingApprovalJobs = employeeJobs.filter(job => job.status === 'pending_approval');
          
          // Calculate weekly earnings
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 7);
          const recentCompletedJobs = completedJobs.filter(job => 
            new Date(job.completedAt || job.createdAt) >= weekStart
          );
          const weeklyEarnings = recentCompletedJobs.reduce((total, job) => 
            total + (job.completionData?.workerCommission || 0), 0
          );
          
          return {
            ...employee,
            totalJobs: employeeJobs.length,
            activeJobs: activeJobs.length,
            assignedJobs: assignedJobs.length,
            inProgressJobs: inProgressJobs.length,
            completedJobs: completedJobs.length,
            pendingApprovalJobs: pendingApprovalJobs.length,
            weeklyEarnings,
            jobs: employeeJobs
          };
        });
        
        // Sort by active jobs (descending)
        stats.sort((a, b) => b.activeJobs - a.activeJobs);
        
        setEmployeeStats(stats);
        setLastUpdate(new Date());
        console.log('✅ Employee Dashboard: Stats loaded successfully');
      }
    } catch (error) {
      console.error('❌ Employee Dashboard: Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const totalActiveJobs = employeeStats.reduce((sum, emp) => sum + emp.activeJobs, 0);
  const totalEmployees = employeeStats.length;
  const avgJobsPerEmployee = totalEmployees > 0 ? (totalActiveJobs / totalEmployees).toFixed(1) : '0';

  return (
    <AdminLayout currentPage="/admin/employees-dashboard" pageTitle="Dashboard Angajați">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
              Dashboard Angajați
            </h2>
            <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
              Monitorizează activitatea și workload-ul fiecărui angajat în timp real
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadEmployeeStats}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: Colors.info,
                color: Colors.background,
              }}
              disabled={loading}
            >
              <Activity size={16} />
              {loading ? 'Se încarcă...' : 'Refresh'}
            </button>
            <div className="text-center">
              <p className="text-xs" style={{ color: Colors.textSecondary }}>
                Ultimul update
              </p>
              <p className="text-sm font-medium" style={{ color: Colors.text }}>
                {lastUpdate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Users size={24} color={Colors.info} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {totalEmployees}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Total Angajați
            </p>
          </div>

          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Clock size={24} color={Colors.warning} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {totalActiveJobs}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Joburi Active Totale
            </p>
          </div>

          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp size={24} color={Colors.success} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {avgJobsPerEmployee}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Medie Job/Angajat
            </p>
          </div>
        </div>

        {/* Employee Table */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
            <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
              Status Angajați & Workload
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
              <p style={{ color: Colors.textSecondary }}>Se încarcă datele...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: Colors.border, backgroundColor: Colors.surfaceLight }}>
                    <th className="text-left p-4 font-medium" style={{ color: Colors.text }}>Angajat</th>
                    <th className="text-center p-4 font-medium" style={{ color: Colors.text }}>Joburi Active</th>
                    <th className="text-center p-4 font-medium" style={{ color: Colors.text }}>Atribuite</th>
                    <th className="text-center p-4 font-medium" style={{ color: Colors.text }}>În Progres</th>
                    <th className="text-center p-4 font-medium" style={{ color: Colors.text }}>Completate</th>
                    <th className="text-center p-4 font-medium" style={{ color: Colors.text }}>Câștiguri (7 zile)</th>
                    <th className="text-center p-4 font-medium" style={{ color: Colors.text }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeStats.map((employee, index) => (
                    <tr 
                      key={employee.id} 
                      className={`border-b transition-colors hover:bg-opacity-50 ${index % 2 === 0 ? '' : 'bg-opacity-30'}`}
                      style={{ 
                        borderColor: Colors.border,
                        backgroundColor: index % 2 === 0 ? 'transparent' : Colors.surfaceLight
                      }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <User size={32} color={Colors.textSecondary} />
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: Colors.text }}>
                              {employee.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                              <Phone size={12} />
                              {employee.phone}
                            </div>
                            {employee.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star size={12} color={Colors.warning} fill={Colors.warning} />
                                <span className="text-sm" style={{ color: Colors.textSecondary }}>
                                  {employee.rating}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <span 
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            employee.activeJobs > 3 ? 'text-red-700' : employee.activeJobs > 1 ? 'text-yellow-700' : 'text-green-700'
                          }`}
                          style={{
                            backgroundColor: employee.activeJobs > 3 ? '#fef2f2' : employee.activeJobs > 1 ? '#fffbeb' : '#f0fdf4'
                          }}
                        >
                          {employee.activeJobs}
                          {employee.activeJobs > 3 && <AlertTriangle size={14} className="ml-1" />}
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-sm font-medium" style={{ color: Colors.info }}>
                          {employee.assignedJobs}
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-sm font-medium" style={{ color: Colors.warning }}>
                          {employee.inProgressJobs}
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-sm font-medium" style={{ color: Colors.success }}>
                          {employee.completedJobs}
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className="text-sm font-semibold" style={{ color: Colors.secondary }}>
                          {employee.weeklyEarnings} RON
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              employee.activeJobs > 0 ? 'animate-pulse' : ''
                            }`}
                            style={{
                              backgroundColor: employee.activeJobs > 0 ? Colors.success : Colors.textMuted
                            }}
                          ></div>
                          <span className="text-xs" style={{ color: Colors.textSecondary }}>
                            {employee.activeJobs > 0 ? 'Activ' : 'Liber'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-4 rounded-lg border" style={{ backgroundColor: Colors.surfaceLight, borderColor: Colors.border }}>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f0fdf4' }}></div>
              <span style={{ color: Colors.textSecondary }}>0-1 joburi active (OK)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fffbeb' }}></div>
              <span style={{ color: Colors.textSecondary }}>2-3 joburi active (Ocupat)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fef2f2' }}></div>
              <AlertTriangle size={12} color="red" />
              <span style={{ color: Colors.textSecondary }}>4+ joburi active (Supraaglomerat)</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}