'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { Job } from '@/utils/jobService';
import { realApiService } from '@/utils/realApiService';
import { 
  Plus,
  Clock,
  User,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  Camera,
  Calendar,
  Filter
} from 'lucide-react';

type JobTab = 'past' | 'current' | 'future';

interface EditForm {
  clientName: string;
  clientPhone: string;
  address: string;
  serviceName: string;
  serviceDescription: string;
  specialInstructions: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  priority: Job['priority'];
}

export default function AdminJobs() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<JobTab>('current');
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [selectedJobPhotos, setSelectedJobPhotos] = useState<{ job: Job; photos: string[] }>({ job: {} as Job, photos: [] });
  const [editForm, setEditForm] = useState<EditForm>({
    clientName: '',
    clientPhone: '',
    address: '',
    serviceName: '',
    serviceDescription: '',
    specialInstructions: '',
    assignedEmployeeId: '',
    assignedEmployeeName: '',
    priority: 'normal'
  });

  const availableWorkers = [
    { id: 'cmfudasin0001v090qs1frclc', name: 'Robert' }
    // Optimized for single expert worker - Robert
  ];

  // Filter jobs by tab with proper date handling
  const getFilteredJobs = () => {
    switch (activeTab) {
      case 'past':
        return jobs.filter(job => 
          ['completed', 'cancelled'].includes(job.status)
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
      case 'current':
        return jobs.filter(job => 
          ['assigned', 'accepted', 'in_progress', 'pending_approval'].includes(job.status)
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
      case 'future':
        // For now, this will be empty but can be used for scheduled jobs
        return jobs.filter(job => {
          const jobDate = new Date(job.createdAt);
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          return jobDate >= tomorrow;
        }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
      default:
        return [];
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      console.log('🏢 Admin Jobs: Loading jobs via REAL API...');
      const response = await realApiService.getJobs();
      
      if (response.success) {
        console.log('✅ Admin Jobs: REAL API success - received', response.data.length, 'jobs');
        setJobs(response.data);
      } else {
        console.error('❌ Admin Jobs: REAL API failed, error:', response.error);
        setJobs([]);
      }
    } catch (error) {
      console.error('❌ Admin Jobs: Error loading jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    
    loadJobs();
    
    // Add REAL API listener for real-time updates
    realApiService.addChangeListener('admin-jobs-real', (hasChanges) => {
      if (hasChanges) {
        console.log('📋 Admin Jobs: REAL API changes detected - syncing!');
        loadJobs();
      }
    });
    
    return () => {
      console.log('🧹 Admin Jobs: Cleaning up listeners');
      realApiService.removeChangeListener('admin-jobs-real');
    };
  }, [user, router]);

  const addJob = () => {
    router.push('/admin/jobs/add');
  };

  const editJob = (job: Job) => {
    setEditingJob(job);
    setEditForm({
      clientName: job.clientName,
      clientPhone: job.clientPhone,
      address: job.address,
      serviceName: job.serviceName,
      serviceDescription: job.serviceDescription || '',
      specialInstructions: job.specialInstructions || '',
      assignedEmployeeId: job.assignedEmployeeId,
      assignedEmployeeName: job.assignedEmployeeName,
      priority: job.priority
    });
    setShowEditModal(true);
  };

  const saveJobEdit = async () => {
    if (!editingJob) return;
    
    try {
      const updates = {
        clientName: editForm.clientName,
        clientPhone: editForm.clientPhone,
        address: editForm.address,
        serviceName: editForm.serviceName,
        serviceDescription: editForm.serviceDescription,
        specialInstructions: editForm.specialInstructions,
        assignedEmployeeId: editForm.assignedEmployeeId,
        assignedEmployeeName: editForm.assignedEmployeeName,
        priority: editForm.priority
      };
      
      const response = await realApiService.updateJob(editingJob.id, updates);
      
      if (response.success) {
        setShowEditModal(false);
        setEditingJob(null);
        await loadJobs(); // Refresh data
        alert(`✅ Lucrarea #${editingJob.id} a fost actualizată!`);
      } else {
        alert(`❌ Eroare la actualizare: ${response.error}`);
      }
    } catch (error) {
      console.error('Error updating job:', error);
      alert('❌ A apărut o eroare la actualizare.');
    }
  };

  const reassignJob = async (jobId: string, newWorkerId: string, newWorkerName: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const confirmReassign = confirm(`Reatribuiți lucrarea #${jobId} către ${newWorkerName}?`);
    if (!confirmReassign) return;
    
    try {
      const response = await realApiService.updateJob(jobId, {
        assignedEmployeeId: newWorkerId,
        assignedEmployeeName: newWorkerName,
        status: 'assigned'
      });
      
      if (response.success) {
        await loadJobs(); // Refresh data
        alert(`✅ Lucrarea #${jobId} a fost reatribuită către ${newWorkerName}!`);
      } else {
        alert(`❌ Eroare la reatribuire: ${response.error}`);
      }
    } catch (error) {
      console.error('Error reassigning job:', error);
      alert('❌ A apărut o eroare la reatribuire.');
    }
  };

  const markJobCompleted = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const confirmComplete = confirm(`Sigur a fost finalizată lucrarea #${jobId} pentru ${job.clientName}?`);
    if (!confirmComplete) return;
    
    try {
      const response = await realApiService.updateJob(jobId, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      if (response.success) {
        await loadJobs(); // Refresh data
        alert(`✅ Lucrarea #${jobId} a fost marcată ca finalizată!`);
      } else {
        alert(`❌ Eroare la finalizare: ${response.error}`);
      }
    } catch (error) {
      console.error('Error completing job:', error);
      alert('❌ A apărut o eroare la finalizare.');
    }
  };

  const cancelJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const reason = prompt(`De ce anulați lucrarea #${jobId} pentru ${job.clientName}?`);
    if (reason === null) return;
    
    const confirmCancel = confirm(`Sigur doriți să anulați lucrarea #${jobId}?`);
    if (!confirmCancel) return;
    
    try {
      const response = await realApiService.updateJob(jobId, {
        status: 'cancelled'
      });
      
      if (response.success) {
        await loadJobs(); // Refresh data
        alert(`✅ Lucrarea #${jobId} a fost anulată. Motiv: ${reason}`);
      } else {
        alert(`❌ Eroare la anulare: ${response.error}`);
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
      alert('❌ A apărut o eroare la anulare.');
    }
  };

  const deleteJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const confirmDelete = confirm(`ATENȚIE: Sigur doriți să ștergeți definitiv lucrarea #${jobId} pentru ${job.clientName}?\nAceastă acțiune nu poate fi anulată!`);
    if (!confirmDelete) return;
    
    try {
      const response = await realApiService.deleteJob(jobId);
      
      if (response.success) {
        await loadJobs(); // Refresh data
        alert(`✅ Lucrarea #${jobId} a fost ștearsă definitiv!`);
      } else {
        alert(`❌ Eroare la ștergere: ${response.error}`);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('❌ A apărut o eroare la ștergere.');
    }
  };

  const createTestJob = async () => {
    const confirmCreate = confirm('🧪 CREARE JOB TEST\n\nAceastă operațiune va crea un job de test atribuit lui Robert pentru validarea workflow-ului complet.\n\nApasă OK pentru a continua.');
    if (!confirmCreate) return;
    
    try {
      console.log('🧪 Admin: Creating test job...');
      const response = await fetch('/api/admin/create-test-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Job de test creat cu succes!\n\n📊 Detalii:\n• ID Job: #${result.data.id}\n• Client: ${result.data.clientName}\n• Serviciu: ${result.data.serviceName}\n• Atribuit: ${result.data.assignedEmployeeName}\n\n🔄 Instrucțiuni:\n${result.instructions.join('\n')}\n\n⏰ Creat la: ${new Date(result.timestamp).toLocaleString('ro-RO')}`);
        
        // Refresh data to show the new test job
        await loadJobs();
        
        // Switch to current tab to see the new job
        setActiveTab('current');
      } else {
        alert(`❌ Eroare la crearea job-ului de test: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating test job:', error);
      alert('❌ A apărut o eroare la crearea job-ului de test.');
    }
  };

  const cleanAllJobs = async () => {
    const confirmClean = confirm('⚠️ ATENȚIE: Această operațiune va șterge TOATE joburile din baza de date!\n\nAceastă acțiune nu poate fi anulată.\n\nApasă OK pentru a continua sau Cancel pentru a anula.');
    if (!confirmClean) return;
    
    const confirmAgain = confirm('🚨 CONFIRMARE FINALĂ: Sigur doriți să ștergeți toate joburile?\n\nTastați "DELETE" pentru confirmare.');
    if (!confirmAgain) return;
    
    const finalConfirm = prompt('Pentru siguranță, tastați "DELETE" (cu majuscule):');
    if (finalConfirm !== 'DELETE') {
      alert('❌ Operațiunea a fost anulată - confirmare incorectă.');
      return;
    }
    
    try {
      console.log('🧮do Starting database cleanup...');
      const response = await fetch('/api/admin/clean-jobs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Curcare completă realizată cu succes!\n\n📋 Statistici:\n• Joburi șterse: ${result.data.deletedJobs}\n• Actualizări șterse: ${result.data.deletedUpdates}\n• Notificări șterse: ${result.data.deletedNotifications}\n\n🎆 Baza de date este acum curată și gata pentru teste noi!`);
        
        // Refresh data
        await loadJobs();
      } else {
        alert(`❌ Eroare la curățare: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cleaning database:', error);
      alert('❌ A apărut o eroare la curățarea bazei de date.');
    }
  };

  const viewJobPhotos = (job: Job) => {
    const photos = job.completionData?.photos || [];
    if (photos.length === 0) {
      alert('Această lucrare nu are poze uploadate.');
      return;
    }
    
    setSelectedJobPhotos({ job, photos });
    setShowPhotosModal(true);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return Colors.info;
      case 'accepted': return Colors.warning;
      case 'in_progress': return Colors.secondary;
      case 'completed': return Colors.success;
      case 'cancelled': return Colors.error;
      case 'pending_approval': return Colors.warning;
      default: return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned': return 'Atribuit';
      case 'accepted': return 'Acceptat';
      case 'in_progress': return 'În progres';
      case 'completed': return 'Finalizat';
      case 'cancelled': return 'Anulat';
      case 'pending_approval': return 'Aprobare necesară';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return Colors.error;
      case 'high': return Colors.warning;
      default: return Colors.textSecondary;
    }
  };

  const getTabCount = (tab: JobTab) => {
    const filtered = jobs.filter(job => {
      switch (tab) {
        case 'past':
          return ['completed', 'cancelled'].includes(job.status);
        case 'current':
          return ['assigned', 'accepted', 'in_progress', 'pending_approval'].includes(job.status);
        case 'future':
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          return new Date(job.createdAt) >= tomorrow;
        default:
          return false;
      }
    });
    return filtered.length;
  };

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const filteredJobs = getFilteredJobs();

  return (
    <AdminLayout currentPage="/admin/jobs" pageTitle="Gestionare Lucrări">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
              Gestionare Lucrări
            </h2>
            <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
              Administrează lucrările, atribuie angajați și monitorizează statusul în timp real.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createTestJob}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: Colors.success,
                color: Colors.background,
              }}
              title="🧪 Creează un job de test pentru validarea workflow-ului"
            >
              <Plus size={16} />
              🧪 Test Job
            </button>
            <button
              onClick={cleanAllJobs}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border-2"
              style={{
                backgroundColor: 'transparent',
                borderColor: Colors.error,
                color: Colors.error,
              }}
              title="⚠️ PERICOL: Șterge toate joburile din baza de date"
            >
              <Trash2 size={16} />
              🧹 Curăță DB
            </button>
            <button
              onClick={() => loadJobs()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: Colors.info,
                color: Colors.background,
              }}
              disabled={loading}
            >
              <RotateCcw size={16} />
              {loading ? 'Se încarcă...' : 'Refresh'}
            </button>
            <button
              onClick={addJob}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: Colors.secondary,
                color: Colors.background,
              }}
            >
              <Plus size={20} />
              Adăugă Lucrare
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b" style={{ borderColor: Colors.border }}>
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'current' as JobTab, label: 'Joburi Actuale', icon: Clock },
              { key: 'past' as JobTab, label: 'Istoric Joburi', icon: CheckCircle },
              { key: 'future' as JobTab, label: 'Joburi Programate', icon: Calendar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key 
                    ? 'border-current' 
                    : 'border-transparent hover:border-gray-300'
                }`}
                style={{
                  color: activeTab === key ? Colors.secondary : Colors.textSecondary,
                  borderColor: activeTab === key ? Colors.secondary : 'transparent'
                }}
              >
                <Icon size={16} />
                {label} ({getTabCount(key)})
              </button>
            ))}
          </nav>
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                {activeTab === 'current' && 'Lucrări Curente'}
                {activeTab === 'past' && 'Istoric Lucrări'}
                {activeTab === 'future' && 'Lucrări Programate'}
                {filteredJobs.length > 0 && (
                  <span className="text-sm font-normal ml-2" style={{ color: Colors.textSecondary }}>
                    ({filteredJobs.length} {filteredJobs.length === 1 ? 'lucrare' : 'lucrări'})
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <Filter size={16} color={Colors.textSecondary} />
                <span className="text-sm" style={{ color: Colors.textSecondary }}>
                  Sortate: cele mai noi prima
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
              <p style={{ color: Colors.textSecondary }}>Se încarcă lucrările...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-4">
                {activeTab === 'current' && <Clock size={48} color={Colors.textMuted} className="mx-auto" />}
                {activeTab === 'past' && <CheckCircle size={48} color={Colors.textMuted} className="mx-auto" />}
                {activeTab === 'future' && <Calendar size={48} color={Colors.textMuted} className="mx-auto" />}
              </div>
              <p className="text-lg font-medium mb-2" style={{ color: Colors.text }}>
                {activeTab === 'current' && 'Nicio lucrare activă'}
                {activeTab === 'past' && 'Nicio lucrare finalizată'}
                {activeTab === 'future' && 'Nicio lucrare programată'}
              </p>
              <p style={{ color: Colors.textSecondary }}>
                {activeTab === 'current' && 'Toate lucrările sunt finalizate sau nu sunt încă joburi active.'}
                {activeTab === 'past' && 'Istoric-ul va apărea aici după finalizarea unor lucrări.'}
                {activeTab === 'future' && 'Lucrările programate pentru viitor vor apărea aici.'}
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-lg border transition-all hover:shadow-md"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: job.priority === 'urgent' ? Colors.error : Colors.border,
                    borderWidth: job.priority === 'urgent' ? '2px' : '1px'
                  }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Job Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold" style={{ color: Colors.text }}>
                          #{job.id} - {job.serviceName}
                        </h4>
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${getStatusColor(job.status)}20`,
                            color: getStatusColor(job.status),
                          }}
                        >
                          {getStatusLabel(job.status)}
                        </span>
                        {job.priority !== 'normal' && (
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                            style={{
                              backgroundColor: `${getPriorityColor(job.priority)}20`,
                              color: getPriorityColor(job.priority),
                            }}
                          >
                            <AlertTriangle size={12} />
                            {job.priority === 'urgent' ? 'URGENT' : 'Prioritate mare'}
                          </span>
                        )}
                      </div>

                      {/* Job Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                          <User size={16} />
                          <span>{job.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                          <Phone size={16} />
                          <span>{job.clientPhone}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                          <MapPin size={16} />
                          <span>{job.address}</span>
                        </div>
                        <div className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                          <User size={16} />
                          <span>Atribuit: {job.assignedEmployeeName}</span>
                        </div>
                      </div>

                      {/* Creation Date */}
                      <div className="flex items-center gap-2 text-sm" style={{ color: Colors.textMuted }}>
                        <Calendar size={14} />
                        <span>Creat: {formatDateTime(job.createdAt)}</span>
                        {job.completedAt && (
                          <span className="ml-4 flex items-center gap-1">
                            <CheckCircle size={14} />
                            Finalizat: {formatDateTime(job.completedAt)}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {job.serviceDescription && (
                        <p className="text-sm" style={{ color: Colors.textSecondary }}>
                          {job.serviceDescription}
                        </p>
                      )}

                      {/* Completion data preview */}
                      {job.completionData && (
                        <div className="mt-2 p-2 rounded" style={{ backgroundColor: Colors.background }}>
                          <div className="flex flex-wrap gap-4 text-sm" style={{ color: Colors.textSecondary }}>
                            <span>💰 {job.completionData.totalAmount} RON</span>
                            <span>💳 {job.completionData.paymentMethod}</span>
                            {job.completionData.photos && job.completionData.photos.length > 0 && (
                              <span>📸 {job.completionData.photos.length} poze</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {job.completionData?.photos && job.completionData.photos.length > 0 && (
                        <button
                          onClick={() => viewJobPhotos(job)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ backgroundColor: Colors.info, color: Colors.background }}
                          title="Vizualizează pozele"
                        >
                          <Camera size={16} />
                        </button>
                      )}
                      
                      {activeTab === 'current' && (
                        <>
                          <button
                            onClick={() => editJob(job)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ backgroundColor: Colors.secondary, color: Colors.background }}
                            title="Editează"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          {job.status !== 'completed' && (
                            <button
                              onClick={() => markJobCompleted(job.id)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ backgroundColor: Colors.success, color: Colors.background }}
                              title="Marchează ca finalizat"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => cancelJob(job.id)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ backgroundColor: Colors.warning, color: Colors.background }}
                            title="Anulează"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: Colors.error, color: Colors.background }}
                        title="Șterge definitiv"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                  Editează Lucrarea #{editingJob.id}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: Colors.surfaceLight }}
                >
                  <X size={20} color={Colors.textSecondary} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Nume client
                  </label>
                  <input
                    type="text"
                    value={editForm.clientName}
                    onChange={(e) => setEditForm(prev => ({...prev, clientName: e.target.value}))}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Telefon client
                  </label>
                  <input
                    type="tel"
                    value={editForm.clientPhone}
                    onChange={(e) => setEditForm(prev => ({...prev, clientPhone: e.target.value}))}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Adresa
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({...prev, address: e.target.value}))}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Serviciu
                  </label>
                  <input
                    type="text"
                    value={editForm.serviceName}
                    onChange={(e) => setEditForm(prev => ({...prev, serviceName: e.target.value}))}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Angajat atribuit
                  </label>
                  <select
                    value={editForm.assignedEmployeeId}
                    onChange={(e) => {
                      const worker = availableWorkers.find(w => w.id === e.target.value);
                      setEditForm(prev => ({
                        ...prev, 
                        assignedEmployeeId: e.target.value,
                        assignedEmployeeName: worker?.name || ''
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                  >
                    {availableWorkers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Prioritate
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(prev => ({...prev, priority: e.target.value as Job['priority']}))}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                  >
                    <option value="normal">Normală</option>
                    <option value="high">Prioritate mare</option>
                    <option value="urgent">Urgentă</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Descriere serviciu
                  </label>
                  <textarea
                    value={editForm.serviceDescription}
                    onChange={(e) => setEditForm(prev => ({...prev, serviceDescription: e.target.value}))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border resize-none"
                    style={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Instrucțiuni speciale
                  </label>
                  <textarea
                    value={editForm.specialInstructions}
                    onChange={(e) => setEditForm(prev => ({...prev, specialInstructions: e.target.value}))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border resize-none"
                    style={{
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex gap-3" style={{ borderColor: Colors.border }}>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg font-medium transition-colors border"
                style={{
                  borderColor: Colors.border,
                  color: Colors.textSecondary,
                  backgroundColor: 'transparent'
                }}
              >
                Anulează
              </button>
              <button
                onClick={saveJobEdit}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: Colors.secondary,
                  color: Colors.background,
                }}
              >
                Salvează Modificările
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photos Modal */}
      {showPhotosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                  📷 Poze Lucrare #{selectedJobPhotos.job.id} - {selectedJobPhotos.job.serviceName}
                </h3>
                <button
                  onClick={() => setShowPhotosModal(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: Colors.surfaceLight }}
                >
                  <X size={20} color={Colors.textSecondary} />
                </button>
              </div>
              <p className="text-sm mt-2" style={{ color: Colors.textSecondary }}>
                Client: {selectedJobPhotos.job.clientName} • {selectedJobPhotos.job.address}
              </p>
              {selectedJobPhotos.job.completionData && (
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
                  Finalizat: {selectedJobPhotos.job.completionData.totalAmount} RON ({selectedJobPhotos.job.completionData.paymentMethod})
                  {selectedJobPhotos.job.completionData.workDescription && ` • ${selectedJobPhotos.job.completionData.workDescription}`}
                </p>
              )}
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedJobPhotos.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Poza ${index + 1} - ${selectedJobPhotos.job.serviceName}`}
                      className="w-full h-64 object-cover rounded-lg border"
                      style={{ borderColor: Colors.border, cursor: 'pointer' }}
                      onClick={() => window.open(photo, '_blank')}
                      title="Click pentru a deschide în mărime naturală"
                    />
                    <div 
                      className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white'
                      }}
                    >
                      {index + 1}/{selectedJobPhotos.photos.length}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm" style={{ color: Colors.textSecondary }}>
                  📝 Click pe o poza pentru a o deschide în mărime naturală
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}