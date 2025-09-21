'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { jobService, type Job } from '@/utils/jobService';
import '@/utils/debugUtils'; // Load debugging utilities
import {
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Clock,
  X
} from 'lucide-react';

export default function AdminJobs() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    clientName: '',
    clientPhone: '',
    address: '',
    serviceName: '',
    serviceDescription: '',
    specialInstructions: '',
    assignedEmployeeId: '',
    assignedEmployeeName: '',
    priority: 'normal' as Job['priority']
  });

  const availableWorkers = [
    { id: 'worker1', name: 'Robert' },
    { id: 'worker2', name: 'Demo User' },
    { id: 'worker3', name: 'Lacatus 01' }
  ];

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    
    // Load jobs from service
    const loadJobs = () => {
      const allJobs = jobService.getAllJobs();
      setJobs(allJobs);
    };
    
    loadJobs();
    
    // Add listener for real-time updates
    jobService.addListener('admin-jobs', {
      onJobUpdate: (job, update) => {
        loadJobs();
      },
      onJobComplete: (job) => {
        loadJobs();
      },
      onJobStatusChange: (jobId, oldStatus, newStatus) => {
        loadJobs();
      }
    });
    
    return () => {
      jobService.removeListener('admin-jobs');
    };
  }, [user, router]);

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

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

  const saveJobEdit = () => {
    if (!editingJob) return;
    
    const updatedJob: Job = {
      ...editingJob,
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
    
    // Update job in service
    jobService.updateJob(editingJob.id, updatedJob);
    
    setShowEditModal(false);
    setEditingJob(null);
    alert(`Lucrarea #${editingJob.id} a fost actualizată!`);
  };

  const reassignJob = (jobId: string, newWorkerId: string, newWorkerName: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const confirmReassign = confirm(`Reatribuiți lucrarea #${jobId} către ${newWorkerName}?`);
    if (!confirmReassign) return;
    
    const updatedJob: Job = {
      ...job,
      assignedEmployeeId: newWorkerId,
      assignedEmployeeName: newWorkerName,
      status: 'assigned'
    };
    
    jobService.updateJob(jobId, updatedJob);
    alert(`Lucrarea #${jobId} a fost reatribuită către ${newWorkerName}!`);
  };

  const markJobCompleted = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const confirmComplete = confirm(`Sigur a fost finalizată lucrarea #${jobId} pentru ${job.clientName}?`);
    if (!confirmComplete) return;
    
    jobService.updateJobStatus(jobId, 'completed', 'admin1', user?.name || 'Admin');
    alert(`Lucrarea #${jobId} a fost marcată ca finalizată!`);
  };

  const cancelJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const reason = prompt(`De ce anulați lucrarea #${jobId} pentru ${job.clientName}?`);
    if (reason === null) return;
    
    const confirmCancel = confirm(`Sigur doriți să anulați lucrarea #${jobId}?`);
    if (!confirmCancel) return;
    
    jobService.updateJobStatus(jobId, 'cancelled', 'admin1', user?.name || 'Admin', { reason });
    alert(`Lucrarea #${jobId} a fost anulată. Motiv: ${reason}`);
  };

  const deleteJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const confirmDelete = confirm(`ATENȚIE: Sigur doriți să ștergeți definitiv lucrarea #${jobId} pentru ${job.clientName}?\nAceastă acțiune nu poate fi anulată!`);
    if (!confirmDelete) return;
    
    jobService.deleteJob(jobId);
    alert(`Lucrarea #${jobId} a fost ștearsă definitiv!`);
  };

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
                  Administrează lucrările active, atribuie angajați și finalizează comenzi.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const testJob: Omit<Job, 'id' | 'createdAt'> = {
                      clientName: `CROSS-BROWSER Test ${Date.now()}`,
                      clientPhone: '+40700000000',
                      address: `Str. Cross-Browser nr. ${Math.floor(Math.random() * 100)}, București`,
                      serviceName: '🌍 Test Cross-Browser Sync',
                      serviceDescription: 'Job de test pentru verificarea sincronizării între browsere diferite. Deschide alt browser pentru test!',
                      assignedEmployeeId: 'worker1',
                      assignedEmployeeName: 'Robert',
                      status: 'assigned',
                      priority: 'urgent'
                    };
                    
                    const createdJob = jobService.addJob(testJob);
                    alert(`🌍 CROSS-BROWSER Test job #${createdJob.id} creat!\n\n🔥 DESCHIDE ALT BROWSER și intră pe același site!\n\nJob-ul ar trebui să apară în 2-4 secunde în orice browser!`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: Colors.error,
                    color: Colors.background,
                  }}
                >
                  🌍 Test Cross-Browser
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
                  Lucrări Active
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: Colors.surfaceLight,
                      borderColor: job.priority === 'urgent' ? Colors.error : Colors.border,
                      borderWidth: job.priority === 'urgent' ? '2px' : '1px'
                    }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                          <h4 className="font-semibold text-sm md:text-base" style={{ color: Colors.text }}>
                            #{job.id} - {job.serviceName}
                          </h4>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium w-fit"
                            style={{
                              backgroundColor: job.status === 'in_progress' ? Colors.warning : 
                                              job.status === 'assigned' ? Colors.info : Colors.secondary,
                              color: Colors.primary,
                            }}
                          >
                            {job.status === 'in_progress' ? 'ÎN PROGRES' :
                             job.status === 'assigned' ? 'ATRIBUIT' : 'PENDING'}
                          </span>
                        </div>
                        <div className="space-y-2 text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                          <p className="flex items-center gap-2">
                            <User size={16} className="flex-shrink-0" />
                            {job.clientName}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin size={16} className="flex-shrink-0" />
                            {job.address}
                          </p>
                          <p className="flex items-center gap-2">
                            📞 {job.clientPhone}
                          </p>
                          <p className="flex items-center gap-2">
                            <User size={16} className="flex-shrink-0" />
                            Atribuit: {job.assignedEmployeeName}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => editJob(job)}
                          className="px-3 py-1 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                          style={{
                            backgroundColor: Colors.info,
                            color: Colors.primary,
                          }}
                          title="Editează lucrarea"
                        >
                          <Edit size={16} />
                          Editează
                        </button>
                        
                        {/* Reatribuire rapidă */}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const worker = availableWorkers.find(w => w.id === e.target.value);
                              if (worker) {
                                reassignJob(job.id, worker.id, worker.name);
                              }
                              e.target.value = '';
                            }
                          }}
                          className="px-2 py-1 rounded-lg text-sm transition-colors"
                          style={{
                            backgroundColor: Colors.warning,
                            color: Colors.primary,
                            border: 'none'
                          }}
                          title="Reatribuie rapid"
                        >
                          <option value="">Reatribuie</option>
                          {availableWorkers.map(worker => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name}
                            </option>
                          ))}
                        </select>
                        
                        <button
                          onClick={() => markJobCompleted(job.id)}
                          className="px-3 py-1 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                          style={{
                            backgroundColor: Colors.success,
                            color: Colors.primary,
                          }}
                          title="Marchează lucrarea ca finalizată"
                        >
                          <CheckCircle size={16} />
                          Finalizat
                        </button>
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="px-3 py-1 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                          style={{
                            backgroundColor: Colors.error,
                            color: Colors.primary,
                          }}
                          title="Anulează lucrarea"
                        >
                          <AlertCircle size={16} />
                          Anulează
                        </button>
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="px-3 py-1 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                          style={{
                            backgroundColor: Colors.textMuted,
                            color: Colors.primary,
                          }}
                          title="Șterge definitiv lucrarea"
                        >
                          <Trash2 size={16} />
                          Șterge
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit Job Modal */}
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
                    {/* Client Information */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                        Nume client
                      </label>
                      <input
                        type="text"
                        value={editForm.clientName}
                        onChange={(e) => setEditForm(prev => ({...prev, clientName: e.target.value}))}
                        className="w-full px-4 py-3 rounded-lg border bg-transparent"
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
                        className="w-full px-4 py-3 rounded-lg border bg-transparent"
                        style={{
                          borderColor: Colors.border,
                          backgroundColor: Colors.surfaceLight,
                          color: Colors.text
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                        Adresă
                      </label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({...prev, address: e.target.value}))}
                        className="w-full px-4 py-3 rounded-lg border bg-transparent"
                        style={{
                          borderColor: Colors.border,
                          backgroundColor: Colors.surfaceLight,
                          color: Colors.text
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                        Tip serviciu
                      </label>
                      <input
                        type="text"
                        value={editForm.serviceName}
                        onChange={(e) => setEditForm(prev => ({...prev, serviceName: e.target.value}))}
                        className="w-full px-4 py-3 rounded-lg border bg-transparent"
                        style={{
                          borderColor: Colors.border,
                          backgroundColor: Colors.surfaceLight,
                          color: Colors.text
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                        Lucrător atribuit
                      </label>
                      <select
                        value={editForm.assignedEmployeeId}
                        onChange={(e) => {
                          const selectedWorker = availableWorkers.find(w => w.id === e.target.value);
                          setEditForm(prev => ({
                            ...prev,
                            assignedEmployeeId: e.target.value,
                            assignedEmployeeName: selectedWorker?.name || 'Neatribuit'
                          }));
                        }}
                        className="w-full px-4 py-3 rounded-lg border bg-transparent"
                        style={{
                          borderColor: Colors.border,
                          backgroundColor: Colors.surfaceLight,
                          color: Colors.text
                        }}
                      >
                        <option value="">Neatribuit</option>
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
                        className="w-full px-4 py-3 rounded-lg border bg-transparent"
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
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                        Instrucțiuni speciale
                      </label>
                      <textarea
                        value={editForm.specialInstructions}
                        onChange={(e) => setEditForm(prev => ({...prev, specialInstructions: e.target.value}))}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border bg-transparent resize-none"
                        style={{
                          borderColor: Colors.border,
                          backgroundColor: Colors.surfaceLight,
                          color: Colors.text
                        }}
                      />
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
          </div>
    </AdminLayout>
  );
}
