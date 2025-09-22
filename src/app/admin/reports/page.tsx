'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { realApiService } from '@/utils/realApiService';
import { 
  BarChart3,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface PeriodStats {
  revenue: number;
  expenses: number;
  profit: number;
  completedJobs: number;
}

export default function AdminReports() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [weekStats, setWeekStats] = useState<PeriodStats>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    completedJobs: 0
  });
  const [monthStats, setMonthStats] = useState<PeriodStats>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    completedJobs: 0
  });
  const [yearStats, setYearStats] = useState<PeriodStats>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    completedJobs: 0
  });

  const loadReportsData = async () => {
    setLoading(true);
    try {
      console.log('📊 Reports: Loading data from REAL API...');
      const response = await realApiService.getJobs();
      
      if (response.success) {
        const allJobs = response.data;
        const completedJobs = allJobs.filter(job => job.status === 'completed');
        
        // Calculate periods
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        
        // Filter jobs by period
        const weekJobs = completedJobs.filter(job => new Date(job.completedAt || job.createdAt) >= weekAgo);
        const monthJobs = completedJobs.filter(job => new Date(job.completedAt || job.createdAt) >= monthAgo);
        const yearJobs = completedJobs.filter(job => new Date(job.completedAt || job.createdAt) >= yearAgo);
        
        // Calculate stats
        const calculateStats = (jobs: any[]) => {
          const revenue = jobs.reduce((total, job) => {
            return total + (job.completionData?.totalAmount || 0);
          }, 0);
          
          const workerCommissions = jobs.reduce((total, job) => {
            return total + (job.completionData?.workerCommission || 0);
          }, 0);
          
          return {
            revenue,
            expenses: workerCommissions, // Worker commissions are company expenses
            profit: revenue - workerCommissions,
            completedJobs: jobs.length
          };
        };
        
        setWeekStats(calculateStats(weekJobs));
        setMonthStats(calculateStats(monthJobs));
        setYearStats(calculateStats(yearJobs));
        
        console.log('✅ Reports: Data loaded successfully!');
      } else {
        console.error('❌ Reports: API error:', response.error);
      }
    } catch (error) {
      console.error('❌ Reports: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    
    loadReportsData();
    
    // Add REAL API listener for real-time updates
    realApiService.addChangeListener('admin-reports-real', (hasChanges) => {
      if (hasChanges) {
        console.log('📊 Reports: REAL API changes detected - syncing!');
        loadReportsData();
      }
    });
    
    return () => {
      console.log('🧹 Reports: Cleaning up listeners');
      realApiService.removeChangeListener('admin-reports-real');
    };
  }, [user, router]);

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  return (
    <AdminLayout currentPage="/admin/reports" pageTitle="Rapoarte și Statistici">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
              Rapoarte și Statistici
            </h2>
            <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
              Date LIVE din baza de date - sincronizate în timp real cu toate joburile
            </p>
          </div>
          
          <button
            onClick={loadReportsData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: Colors.info,
              color: Colors.background,
            }}
            disabled={loading}
          >
            <BarChart3 size={16} />
            {loading ? 'Se încarcă...' : 'Actualizare Date'}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
            <p style={{ color: Colors.textSecondary }}>Se încarcă datele din baza de date...</p>
          </div>
        ) : (
        <>
        {/* Period Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar size={24} color={Colors.info} />
              <TrendingUp size={20} color={Colors.success} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
              Această Săptămână
            </h3>
            <div className="space-y-2">
              <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                <span>Venituri:</span>
                <span className="font-semibold" style={{ color: Colors.success }}>{weekStats.revenue.toLocaleString('ro-RO')} RON</span>
              </p>
              <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                <span>Cheltuieli:</span>
                <span className="font-semibold" style={{ color: Colors.error }}>{weekStats.expenses.toLocaleString('ro-RO')} RON</span>
              </p>
              <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                <span>Profit:</span>
                <span className="font-semibold" style={{ color: Colors.secondary }}>{weekStats.profit.toLocaleString('ro-RO')} RON</span>
              </p>
            </div>
          </div>

          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar size={24} color={Colors.warning} />
              <TrendingUp size={20} color={Colors.success} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
              Luna Aceasta
            </h3>
            <div className="space-y-2">
              <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                <span>Venituri:</span>
                <span className="font-semibold" style={{ color: Colors.success }}>{monthStats.revenue.toLocaleString('ro-RO')} RON</span>
              </p>
              <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                <span>Cheltuieli:</span>
                <span className="font-semibold" style={{ color: Colors.error }}>{monthStats.expenses.toLocaleString('ro-RO')} RON</span>
              </p>
              <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                <span>Profit:</span>
                <span className="font-semibold" style={{ color: Colors.secondary }}>{monthStats.profit.toLocaleString('ro-RO')} RON</span>
              </p>
            </div>
          </div>

          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart3 size={24} color={Colors.secondary} />
              <TrendingUp size={20} color={Colors.success} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
              Anul Acesta
            </h3>
            <div className="space-y-2">
              <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                <span>Venituri:</span>
                <span className="font-semibold" style={{ color: Colors.success }}>{yearStats.revenue.toLocaleString('ro-RO')} RON</span>
              </p>
              <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                <span>Cheltuieli:</span>
                <span className="font-semibold" style={{ color: Colors.error }}>{yearStats.expenses.toLocaleString('ro-RO')} RON</span>
              </p>
              <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                <span>Profit:</span>
                <span className="font-semibold" style={{ color: Colors.secondary }}>{yearStats.profit.toLocaleString('ro-RO')} RON</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Data Info */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="text-center">
            <BarChart3 size={48} color={Colors.success} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2" style={{ color: Colors.text }}>
              🔄 Date LIVE din Baza de Date
            </h3>
            <p className="mb-4" style={{ color: Colors.textSecondary }}>
              Toate datele sunt calculate în timp real pe baza joburilor finalizate din sistemul expert.
              Sincronizare automată la fiecare schimbare de status job.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: Colors.success }}>
                  {(weekStats.completedJobs + monthStats.completedJobs + yearStats.completedJobs) || 0}
                </div>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>Total Joburi Finalizate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: Colors.info }}>
                  85%
                </div>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>Comision Expert Robert</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: Colors.secondary }}>
                  15%
                </div>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>Comision Companie</p>
              </div>
            </div>
            
            <div className="p-4 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
              <p className="text-sm" style={{ color: Colors.textMuted }}>
                📊 <strong>Cum funcionează:</strong> Datele sunt calculate automat din joburile cu status "completed" din baza de date PostgreSQL. 
                Venitul = suma totală încasată, Cheltuielile = comisioanele lucrătorilor, Profitul = diferența pentru companie.
              </p>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </AdminLayout>
  );
}