'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { jobService } from '@/utils/jobService';
import { 
  User,
  DollarSign,
  TrendingUp,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  CheckCircle,
  Copy,
  Eye,
  Banknote,
  BarChart3,
  FileText
} from 'lucide-react';

interface WorkerReport {
  workerId: string;
  workerName: string;
  totalEarnings: number;
  totalCollected: number;
  amountToHandOver: number;
  completedJobs: number;
  pendingApproval: number;
}

export default function AdminWorkersReports() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [workersReports, setWorkersReports] = useState<WorkerReport[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    
    // Load workers reports
    const loadWorkersReports = () => {
      const reports = jobService.getAllWorkersWeeklyReport(selectedWeek);
      setWorkersReports(reports);
    };
    
    loadWorkersReports();
    
    // Add listener for real-time updates
    jobService.addListener('admin-workers-reports', {
      onJobUpdate: (job, update) => {
        loadWorkersReports();
      },
      onJobComplete: (job) => {
        loadWorkersReports();
      },
      onJobStatusChange: (jobId, oldStatus, newStatus) => {
        loadWorkersReports();
      }
    });
    
    // Cleanup listener
    return () => {
      jobService.removeListener('admin-workers-reports');
    };
  }, [user, router, selectedWeek]);

  if (!user || user.type !== 'admin') {
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

  const copyAllWorkersReport = () => {
    const totalEarnings = workersReports.reduce((sum, report) => sum + report.totalEarnings, 0);
    const totalCollected = workersReports.reduce((sum, report) => sum + report.totalCollected, 0);
    const totalToHandOver = workersReports.reduce((sum, report) => sum + report.amountToHandOver, 0);
    const totalJobs = workersReports.reduce((sum, report) => sum + report.completedJobs, 0);

    const report = `Raport Complet Lucrători - Săptămâna ${formatWeekRange(selectedWeek)}

REZUMAT GENERAL:
• Suma totală încasată de toți lucrătorii: ${totalCollected} RON
• Total comisioane lucrători: ${totalEarnings} RON  
• Total de predat companiei: ${totalToHandOver} RON
• Total joburi finalizate: ${totalJobs}

DETALII PE LUCRĂTORI:
${workersReports.map(worker => `
${worker.workerName}:
  - Încasat total: ${worker.totalCollected} RON
  - Comision: ${worker.totalEarnings} RON
  - De predat: ${worker.amountToHandOver} RON
  - Joburi: ${worker.completedJobs} finalizate, ${worker.pendingApproval} în așteptare`).join('\n')}

Generat: ${new Date().toLocaleString('ro-RO')}`;
    
    navigator.clipboard.writeText(report);
    alert('✅ Raportul complet al lucrătorilor a fost copiat în clipboard!');
  };

  const copyWorkerReport = (worker: WorkerReport) => {
    const report = `Raport Individual - ${worker.workerName}
Săptămâna ${formatWeekRange(selectedWeek)}

💰 SITUAȚIA FINANCIARĂ:
• Suma totală încasată: ${worker.totalCollected} RON
• Comisionul lucrătorului: ${worker.totalEarnings} RON
• Suma de predat companiei: ${worker.amountToHandOver} RON

📊 STATISTICI JOBURI:
• Joburi finalizate: ${worker.completedJobs}
• În așteptarea aprobării: ${worker.pendingApproval}
• Total săptămânal: ${worker.completedJobs + worker.pendingApproval}

Generat: ${new Date().toLocaleString('ro-RO')}`;
    
    navigator.clipboard.writeText(report);
    alert(`✅ Raportul pentru ${worker.workerName} a fost copiat în clipboard!`);
  };

  const viewWorkerDetails = (workerId: string) => {
    setSelectedWorker(workerId);
    setShowDetailModal(true);
  };

  const getSelectedWorkerData = () => {
    if (!selectedWorker) return null;
    return workersReports.find(w => w.workerId === selectedWorker);
  };

  // Calculate totals
  const totalEarnings = workersReports.reduce((sum, report) => sum + report.totalEarnings, 0);
  const totalCollected = workersReports.reduce((sum, report) => sum + report.totalCollected, 0);
  const totalToHandOver = workersReports.reduce((sum, report) => sum + report.amountToHandOver, 0);
  const totalCompletedJobs = workersReports.reduce((sum, report) => sum + report.completedJobs, 0);
  const totalPendingJobs = workersReports.reduce((sum, report) => sum + report.pendingApproval, 0);

  return (
    <AdminLayout currentPage="/admin/workers-reports" pageTitle="Istoric Lucrători">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
              Istoric Săptămânal Lucrători
            </h2>
            <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
              Câștiguri și sume de predat pentru fiecare angajat
            </p>
          </div>
          
          <button
            onClick={copyAllWorkersReport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: Colors.secondary,
              color: Colors.background,
            }}
          >
            <Copy size={16} />
            Copiază Raport Complet
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

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                {totalCollected} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Total Încasat
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
                {totalEarnings} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Total Comisioane
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
              <ArrowUp size={24} color={Colors.error} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {totalToHandOver} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Total de Predat
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
              <CheckCircle size={24} color={Colors.secondary} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {totalCompletedJobs}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Total Joburi
            </p>
          </div>
        </div>

        {/* Workers Reports */}
        <div
          className="rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
            <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
              Rapoarte Individuale ({workersReports.length} lucrători)
            </h3>
          </div>

          {workersReports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={48} color={Colors.textMuted} className="mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                Nu există date pentru această săptămână
              </h3>
              <p style={{ color: Colors.textSecondary }}>
                Niciun lucrător nu a finalizat joburi în această perioadă.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: Colors.border }}>
              {workersReports.map((worker) => (
                <div key={worker.workerId} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <User size={20} color={Colors.secondary} />
                        <h4 className="font-semibold text-lg" style={{ color: Colors.text }}>
                          {worker.workerName}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h5 className="font-medium mb-2" style={{ color: Colors.text }}>
                            💰 Situația Financiară
                          </h5>
                          <div className="space-y-1 text-sm" style={{ color: Colors.textSecondary }}>
                            <div className="flex justify-between">
                              <span>Încasat total:</span>
                              <span className="font-medium">{worker.totalCollected} RON</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Comision:</span>
                              <span className="font-medium text-green-600">{worker.totalEarnings} RON</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-1" style={{ borderColor: Colors.border }}>
                              <span>De predat:</span>
                              <span style={{ color: Colors.error }}>{worker.amountToHandOver} RON</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium mb-2" style={{ color: Colors.text }}>
                            📊 Joburi
                          </h5>
                          <div className="space-y-1 text-sm" style={{ color: Colors.textSecondary }}>
                            <div className="flex justify-between">
                              <span>Finalizate:</span>
                              <span className="font-medium">{worker.completedJobs}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>În așteptare:</span>
                              <span className="font-medium" style={{ color: Colors.warning }}>{worker.pendingApproval}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-1" style={{ borderColor: Colors.border }}>
                              <span>Total:</span>
                              <span>{worker.completedJobs + worker.pendingApproval}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium mb-2" style={{ color: Colors.text }}>
                            📈 Performanță
                          </h5>
                          <div className="space-y-1 text-sm" style={{ color: Colors.textSecondary }}>
                            <div className="flex justify-between">
                              <span>Comision/job:</span>
                              <span className="font-medium">
                                {worker.completedJobs > 0 ? Math.round(worker.totalEarnings / worker.completedJobs) : 0} RON
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Medie/job:</span>
                              <span className="font-medium">
                                {worker.completedJobs > 0 ? Math.round(worker.totalCollected / worker.completedJobs) : 0} RON
                              </span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-1" style={{ borderColor: Colors.border }}>
                              <span>Rata comision:</span>
                              <span>
                                {worker.totalCollected > 0 ? Math.round((worker.totalEarnings / worker.totalCollected) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={() => viewWorkerDetails(worker.workerId)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: Colors.info,
                          color: Colors.primary,
                        }}
                      >
                        <Eye size={16} />
                        Detalii
                      </button>

                      <button
                        onClick={() => copyWorkerReport(worker)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border"
                        style={{
                          borderColor: Colors.secondary,
                          color: Colors.secondary,
                        }}
                      >
                        <Copy size={16} />
                        Copiază
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Company Summary */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
            Rezumatul Companiei
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3" style={{ color: Colors.text }}>
                💼 Situația Financiară Totală
              </h4>
              <div className="space-y-2 text-sm" style={{ color: Colors.textSecondary }}>
                <div className="flex justify-between">
                  <span>Suma totală încasată de lucrători:</span>
                  <span className="font-medium">{totalCollected} RON</span>
                </div>
                <div className="flex justify-between">
                  <span>Total comisioane plătite:</span>
                  <span className="font-medium text-green-600">-{totalEarnings} RON</span>
                </div>
                <div className="border-t pt-2" style={{ borderColor: Colors.border }}>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Profit companie:</span>
                    <span style={{ color: Colors.success }}>{totalToHandOver} RON</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3" style={{ color: Colors.text }}>
                📊 Statistici Generale
              </h4>
              <div className="space-y-2 text-sm" style={{ color: Colors.textSecondary }}>
                <div className="flex justify-between">
                  <span>Total joburi finalizate:</span>
                  <span className="font-medium">{totalCompletedJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span>În așteptarea aprobării:</span>
                  <span className="font-medium" style={{ color: Colors.warning }}>{totalPendingJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lucrători activi:</span>
                  <span className="font-medium">{workersReports.filter(w => w.completedJobs > 0).length}</span>
                </div>
                <div className="border-t pt-2" style={{ borderColor: Colors.border }}>
                  <div className="flex justify-between font-semibold">
                    <span>Media joburi/lucrător:</span>
                    <span>{workersReports.length > 0 ? Math.round(totalCompletedJobs / workersReports.length) : 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Worker Detail Modal */}
      {showDetailModal && selectedWorker && getSelectedWorkerData() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg"
            style={{ backgroundColor: Colors.surface }}
          >
            <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                  Detalii - {getSelectedWorkerData()?.workerName}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: Colors.surfaceLight }}
                >
                  ❌
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {getSelectedWorkerData() && (
                <>
                  <div className="text-center">
                    <h4 className="text-xl font-bold mb-2" style={{ color: Colors.text }}>
                      Săptămâna {formatWeekRange(selectedWeek)}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="p-4 rounded-lg text-center"
                      style={{ backgroundColor: Colors.surfaceLight }}
                    >
                      <DollarSign size={32} color={Colors.success} className="mx-auto mb-2" />
                      <h5 className="font-semibold" style={{ color: Colors.text }}>
                        {getSelectedWorkerData()?.totalEarnings} RON
                      </h5>
                      <p className="text-sm" style={{ color: Colors.textSecondary }}>
                        Câștiguri Confirmate
                      </p>
                    </div>

                    <div
                      className="p-4 rounded-lg text-center"
                      style={{ backgroundColor: Colors.surfaceLight }}
                    >
                      <ArrowUp size={32} color={Colors.error} className="mx-auto mb-2" />
                      <h5 className="font-semibold" style={{ color: Colors.text }}>
                        {getSelectedWorkerData()?.amountToHandOver} RON
                      </h5>
                      <p className="text-sm" style={{ color: Colors.textSecondary }}>
                        De Predat
                      </p>
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                    <h5 className="font-semibold mb-2" style={{ color: Colors.text }}>
                      Instrucțiuni pentru lucrător:
                    </h5>
                    <p className="text-sm" style={{ color: Colors.textSecondary }}>
                      📱 Trimite SMS: "Salut {getSelectedWorkerData()?.workerName}, pentru săptămâna {formatWeekRange(selectedWeek)} 
                      ai de predat suma de {getSelectedWorkerData()?.amountToHandOver} RON din totalul de {getSelectedWorkerData()?.totalCollected} RON încasat. 
                      Comisionul tău de {getSelectedWorkerData()?.totalEarnings} RON a fost deja calculat."
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t" style={{ borderColor: Colors.border }}>
              <button
                onClick={() => getSelectedWorkerData() && copyWorkerReport(getSelectedWorkerData()!)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: Colors.secondary,
                  color: Colors.background,
                }}
              >
                <Copy size={16} />
                Copiază Raportul Individual
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}