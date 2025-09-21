'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import WorkerLayout from '@/components/WorkerLayout';
import { jobService, type Job } from '@/utils/jobService';
import { 
  DollarSign,
  TrendingUp,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  CheckCircle,
  Copy,
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export default function WorkerEarnings() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [weeklyReport, setWeeklyReport] = useState<{
    weekJobs: Job[];
    totalEarnings: number;
    totalCollected: number;
    amountToHandOver: number;
    completedJobs: number;
    pendingApproval: number;
    travelOnlyJobs: number;
  }>({
    weekJobs: [],
    totalEarnings: 0,
    totalCollected: 0,
    amountToHandOver: 0,
    completedJobs: 0,
    pendingApproval: 0,
    travelOnlyJobs: 0
  });

  useEffect(() => {
    if (!user || user.type !== 'worker') {
      router.replace('/');
      return;
    }
    
    // Load weekly financial report
    const loadWeeklyReport = () => {
      const report = jobService.getWeeklyFinancialReport('worker1', selectedWeek); // În aplicația reală ar fi user.id
      setWeeklyReport(report);
    };
    
    loadWeeklyReport();
    
    // Add listener for real-time updates
    jobService.addListener('worker-earnings', {
      onJobUpdate: (job, update) => {
        loadWeeklyReport();
      },
      onJobComplete: (job) => {
        loadWeeklyReport();
      },
      onJobStatusChange: (jobId, oldStatus, newStatus) => {
        loadWeeklyReport();
      }
    });
    
    // Cleanup listener
    return () => {
      jobService.removeListener('worker-earnings');
    };
  }, [user, router, selectedWeek]);

  if (!user || user.type !== 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  // Helper functions
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  };

  const formatWeekRange = (date: Date) => {
    const start = getWeekStart(date);
    const end = getWeekEnd(date);
    return `${start.getDate()}.${(start.getMonth() + 1).toString().padStart(2, '0')} - ${end.getDate()}.${(end.getMonth() + 1).toString().padStart(2, '0')}.${end.getFullYear()}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'prev' ? -7 : 7));
    setSelectedWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  const copyEarningsReport = () => {
    const report = `Raport Câștiguri - Săptămâna ${formatWeekRange(selectedWeek)}

Câștiguri Confirmate: ${weeklyReport.totalEarnings} RON
Suma Încasată Total: ${weeklyReport.totalCollected} RON
Suma de Predat: ${weeklyReport.amountToHandOver} RON

Joburi Finalizate: ${weeklyReport.completedJobs}
În Așteptarea Aprobării: ${weeklyReport.pendingApproval}
Doar Deplasării: ${weeklyReport.travelOnlyJobs}

Generat: ${new Date().toLocaleString('ro-RO')}`;
    
    navigator.clipboard.writeText(report);
    alert('✅ Raportul de câștiguri a fost copiat în clipboard!');
  };

  return (
    <WorkerLayout currentPage="/worker/earnings" pageTitle="Câștiguri Săptămânale">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
              Câștigurile Mele
            </h2>
            <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
              Raport săptămânal financiar cu suma de predat companiei
            </p>
          </div>
          
          <button
            onClick={copyEarningsReport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: Colors.secondary,
              color: Colors.background,
            }}
          >
            <Copy size={16} />
            Copiază Raport
          </button>
        </div>

        {/* Week Navigation */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.surfaceLight }}
            >
              <ChevronLeft size={20} color={Colors.textSecondary} />
            </button>
            
            <div className="text-center">
              <h2 className="text-lg font-bold" style={{ color: Colors.text }}>
                Săptămâna {formatWeekRange(selectedWeek)}
              </h2>
              <button
                onClick={goToCurrentWeek}
                className="text-sm mt-1 px-3 py-1 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: Colors.secondary,
                  color: Colors.background
                }}
              >
                Săptămâna curentă
              </button>
            </div>

            <button
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.surfaceLight }}
            >
              <ChevronRight size={20} color={Colors.textSecondary} />
            </button>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Câștiguri Confirmate */}
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
                {weeklyReport.totalEarnings} RON
              </span>
            </div>
            <p className="font-medium text-base" style={{ color: Colors.textSecondary }}>
              Câștiguri Confirmate
            </p>
            <p className="text-sm mt-1" style={{ color: Colors.textMuted }}>
              Comisionul tău din joburi
            </p>
          </div>

          {/* Suma Încasată */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Banknote size={24} color={Colors.info} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {weeklyReport.totalCollected} RON
              </span>
            </div>
            <p className="font-medium text-base" style={{ color: Colors.textSecondary }}>
              Suma Încasată Total
            </p>
            <p className="text-sm mt-1" style={{ color: Colors.textMuted }}>
              De la toți clienții
            </p>
          </div>

          {/* Suma de Predat */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <ArrowUp size={24} color={Colors.error} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {weeklyReport.amountToHandOver} RON
              </span>
            </div>
            <p className="font-medium text-base" style={{ color: Colors.textSecondary }}>
              Suma de Predat
            </p>
            <p className="text-sm mt-1" style={{ color: Colors.textMuted }}>
              Pentru companie
            </p>
          </div>
        </div>

        {/* Job Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle size={24} color={Colors.success} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {weeklyReport.completedJobs}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Joburi Finalizate
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
              <AlertCircle size={24} color={Colors.warning} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {weeklyReport.pendingApproval}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              În Așteptare
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
              <Calendar size={24} color={Colors.info} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {weeklyReport.travelOnlyJobs}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Doar Deplasări
            </p>
          </div>
        </div>

        {/* Summary Box */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
            Rezumatul Săptămânii
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3" style={{ color: Colors.text }}>
                💰 Analiza Financiară
              </h4>
              <div className="space-y-2 text-sm" style={{ color: Colors.textSecondary }}>
                <div className="flex justify-between">
                  <span>Suma totală încasată:</span>
                  <span className="font-medium">{weeklyReport.totalCollected} RON</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisionul tău:</span>
                  <span className="font-medium text-green-600">-{weeklyReport.totalEarnings} RON</span>
                </div>
                <div className="border-t pt-2" style={{ borderColor: Colors.border }}>
                  <div className="flex justify-between font-semibold">
                    <span>De predat companiei:</span>
                    <span style={{ color: Colors.error }}>{weeklyReport.amountToHandOver} RON</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3" style={{ color: Colors.text }}>
                📊 Statistici Joburi
              </h4>
              <div className="space-y-2 text-sm" style={{ color: Colors.textSecondary }}>
                <div className="flex justify-between">
                  <span>Joburi finalizate:</span>
                  <span className="font-medium">{weeklyReport.completedJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span>În așteptarea aprobării:</span>
                  <span className="font-medium" style={{ color: Colors.warning }}>{weeklyReport.pendingApproval}</span>
                </div>
                <div className="flex justify-between">
                  <span>Doar deplasări:</span>
                  <span className="font-medium">{weeklyReport.travelOnlyJobs}</span>
                </div>
                <div className="border-t pt-2" style={{ borderColor: Colors.border }}>
                  <div className="flex justify-between font-semibold">
                    <span>Total săptămânal:</span>
                    <span>{weeklyReport.completedJobs + weeklyReport.pendingApproval}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
            <p className="text-sm text-center" style={{ color: Colors.textMuted }}>
              💡 <strong>Notă:</strong> Suma de predat reprezintă diferența dintre suma totală încasată și comisionul tău. 
              Joburile în așteptarea aprobării nu sunt incluse în câștigurile confirmate.
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/worker/completed-jobs')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border"
              style={{
                borderColor: Colors.secondary,
                color: Colors.secondary,
              }}
            >
              <Eye size={16} />
              Vezi Joburile Finalizate
            </button>

            <button
              onClick={copyEarningsReport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: Colors.secondary,
                color: Colors.background,
              }}
            >
              <Copy size={16} />
              Copiază Raportul
            </button>
          </div>
        </div>
      </div>
    </WorkerLayout>
  );
}