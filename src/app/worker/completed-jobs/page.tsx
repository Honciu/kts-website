'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { jobService, type Job } from '@/utils/jobService';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  Copy,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Phone,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  Banknote,
  CreditCard,
  Building,
  AlertCircle,
  TrendingUp
} from 'lucide-react';


export default function CompletedJobs() {
  const { user } = useAuth();
  const router = useRouter();

  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);

  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);

  useEffect(() => {
    if (!user || user.type !== 'worker') {
      router.replace('/');
      return;
    }
    
    // Load completed jobs from jobService
    const loadCompletedJobs = () => {
      const jobs = jobService.getCompletedJobsForWorker('worker1'); // În aplicația reală ar fi user.id
      setCompletedJobs(jobs);
    };
    
    loadCompletedJobs();
    
    // Add listener for real-time updates
    jobService.addListener('completed-jobs-page', {
      onJobUpdate: (job, update) => {
        if (['completed', 'pending_approval'].includes(job.status)) {
          loadCompletedJobs();
        }
      },
      onJobComplete: (job) => {
        loadCompletedJobs();
      },
      onJobStatusChange: (jobId, oldStatus, newStatus) => {
        if (['completed', 'pending_approval'].includes(newStatus)) {
          loadCompletedJobs();
        }
      }
    });
    
    // Cleanup listener
    return () => {
      jobService.removeListener('completed-jobs-page');
    };
  }, [user, router]);

  // Helper functions pentru săptămână
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
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

  // Filtrează joburile pentru săptămâna selectată
  const getJobsForWeek = (week: Date) => {
    return jobService.getCompletedJobsForWeek('worker1', week); // În aplicația reală ar fi user.id
  };

  const weekJobs = getJobsForWeek(selectedWeek);

  // Calculează statistici pentru săptămână
  const weekStats = {
    totalJobs: weekJobs.length,
    totalEarnings: weekJobs.filter(j => j.status === 'completed').reduce((sum, job) => sum + (job.completionData?.workerCommission || 0), 0),
    pendingApproval: weekJobs.filter(j => j.status === 'pending_approval').reduce((sum, job) => sum + (job.completionData?.workerCommission || 0), 0),
    travelOnlyJobs: weekJobs.filter(j => j.completionData?.onlyTravelFee).length
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'prev' ? -7 : 7));
    setSelectedWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  const copyJobDetails = (job: Job) => {
    const details = `Lucrare #${job.id}
Client: ${job.clientName} (${job.clientPhone})
Adresa: ${job.address}
Serviciu: ${job.serviceName}
Data: ${new Date(job.completedAt || job.createdAt).toLocaleString('ro-RO')}
Suma: ${job.completionData?.totalAmount || 0} RON
Comision: ${job.completionData?.workerCommission || 0} RON
Plată: ${job.completionData?.paymentMethod === 'cash' ? 'Numerar' : job.completionData?.paymentMethod === 'card' ? 'Card' : 'Transfer bancar'}
${job.completionData?.onlyTravelFee ? 'Tip: Doar deplasare' : ''}
Descriere: ${job.completionData?.workDescription || ''}
${job.completionData?.notes ? `Note: ${job.completionData.notes}` : ''}`

    navigator.clipboard.writeText(details);
    alert('✅ Detaliile jobului au fost copiate în clipboard!');
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote size={16} />;
      case 'card': return <CreditCard size={16} />;
      case 'bank_transfer': return <Building size={16} />;
      default: return <DollarSign size={16} />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Numerar';
      case 'card': return 'Card';
      case 'bank_transfer': return 'Transfer bancar';
      default: return method;
    }
  };

  if (!user || user.type !== 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.background }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/worker/dashboard')}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.surfaceLight }}
            >
              <ArrowLeft size={20} color={Colors.textSecondary} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: Colors.secondary }}>
                Joburi Finalizate
              </h1>
              <p className="text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                Raport săptămânal (Luni - Duminică)
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="space-y-6">
          
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

          {/* Week Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <Briefcase size={24} color={Colors.secondary} />
                <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                  {weekStats.totalJobs}
                </span>
              </div>
              <p className="font-medium" style={{ color: Colors.textSecondary }}>
                Joburi Totale
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
                  {weekStats.totalEarnings} RON
                </span>
              </div>
              <p className="font-medium" style={{ color: Colors.textSecondary }}>
                Câștiguri Confirmate
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
                  {weekStats.pendingApproval} RON
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
                <Clock size={24} color={Colors.info} />
                <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                  {weekStats.travelOnlyJobs}
                </span>
              </div>
              <p className="font-medium" style={{ color: Colors.textSecondary }}>
                Doar Deplasări
              </p>
            </div>
          </div>

          {/* Jobs List */}
          <div
            className="rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
              <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                Joburi din această săptămână ({weekJobs.length})
              </h3>
            </div>

            {weekJobs.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar size={48} color={Colors.textMuted} className="mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Nu există joburi finalizate
                </h3>
                <p style={{ color: Colors.textSecondary }}>
                  În această săptămână nu ai finalizat niciun job.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: Colors.border }}>
                {weekJobs.map((job) => (
                  <div key={job.id} className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-semibold text-lg" style={{ color: Colors.text }}>
                            #{job.id} - {job.serviceName}
                          </h4>
                          {job.completionData?.onlyTravelFee && (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: Colors.warning,
                                color: Colors.primary,
                              }}
                            >
                              DOAR DEPLASARE
                            </span>
                          )}
                          {job.status === 'pending_approval' && (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: Colors.warning,
                                color: Colors.primary,
                              }}
                            >
                              ÎN AȘTEPTARE
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                              <User size={16} />
                              <span className="font-medium">Client:</span> {job.clientName}
                            </p>
                            <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                              <Phone size={16} />
                              <span className="font-medium">Telefon:</span> {job.clientPhone}
                            </p>
                            <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                              <MapPin size={16} />
                              <span className="font-medium">Adresa:</span> {job.address}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                              <DollarSign size={16} />
                              <span className="font-medium">Suma totală:</span>
                              <span className="font-semibold" style={{ color: Colors.success }}>
                                {job.completionData?.totalAmount || 0} RON
                              </span>
                            </p>
                            <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                              <TrendingUp size={16} />
                              <span className="font-medium">Comision:</span>
                              <span className="font-semibold" style={{ color: Colors.secondary }}>
                                {job.completionData?.workerCommission || 0} RON
                              </span>
                            </p>
                            <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                              {getPaymentMethodIcon(job.completionData?.paymentMethod || 'cash')}
                              <span className="font-medium">Plată:</span>
                              {getPaymentMethodLabel(job.completionData?.paymentMethod || 'cash')}
                              {job.completionData?.bankAccount && ` - ${job.completionData.bankAccount}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm" style={{ color: Colors.textMuted }}>
                          <Calendar size={16} />
                        Finalizat: {new Date(job.completedAt || job.createdAt).toLocaleString('ro-RO')}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setShowJobModal(true);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                          style={{
                            backgroundColor: Colors.info,
                            color: Colors.primary,
                          }}
                        >
                          <Eye size={16} />
                          Vezi Detalii
                        </button>

                        <button
                          onClick={() => copyJobDetails(job)}
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
        </div>
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg"
            style={{ backgroundColor: Colors.surface }}
          >
            <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                  Detalii Job #{selectedJob.id}
                </h3>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: Colors.surfaceLight }}
                >
                  <ArrowLeft size={20} color={Colors.textSecondary} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                  {selectedJob.completionData?.onlyTravelFee ? 'Motivul deplasrãrii' : 'Descrierea lucrãrii'}
                </h4>
                <p className="p-3 rounded-lg text-sm" style={{ 
                  backgroundColor: Colors.surfaceLight,
                  color: Colors.textSecondary 
                }}>
                  {selectedJob.completionData?.workDescription || 'Nu existã descriere disponibilã'}
                </p>
              </div>

              {selectedJob.completionData?.notes && (
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                    Notițe suplimentare
                  </h4>
                  <p className="p-3 rounded-lg text-sm" style={{ 
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.textSecondary 
                  }}>
                    {selectedJob.completionData.notes}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-lg border" style={{ 
                backgroundColor: Colors.surfaceLight,
                borderColor: Colors.border 
              }}>
                <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                  Contact Client
                </h4>
                <div className="flex items-center gap-4">
                  <span style={{ color: Colors.textSecondary }}>
                    {selectedJob.clientName}
                  </span>
                  <a
                    href={`tel:${selectedJob.clientPhone}`}
                    className="flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ color: Colors.info }}
                  >
                    <Phone size={16} />
                    {selectedJob.clientPhone}
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 border-t" style={{ borderColor: Colors.border }}>
              <button
                onClick={() => copyJobDetails(selectedJob)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: Colors.secondary,
                  color: Colors.background,
                }}
              >
                <Copy size={16} />
                Copiază toate detaliile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}