'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { notificationService } from '@/utils/notificationService';
import { jobService, type Job } from '@/utils/jobService';
import { 
  User,
  MapPin,
  Phone,
  Briefcase,
  Clock,
  CheckCircle,
  X,
  Navigation,
  MessageSquare,
  Share2,
  ArrowLeft,
  AlertCircle,
  Wrench,
  LogOut
} from 'lucide-react';


export default function WorkerJobDetail() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (!user || user.type !== 'worker') {
      router.replace('/');
      return;
    }

    // Load job data from jobService
    const foundJob = jobService.getJob(jobId);
    if (foundJob) {
      setJob(foundJob);
    }
    setIsLoading(false);
  }, [user, router, jobId]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user || user.type !== 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: Colors.background }}>
        <div className="text-center py-8">
          <AlertCircle size={48} color={Colors.textMuted} className="mx-auto mb-4" />
          <p style={{ color: Colors.textSecondary }}>Lucrarea nu a fost găsită.</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{ backgroundColor: Colors.secondary, color: Colors.background }}
          >
            Înapoi
          </button>
        </div>
      </div>
    );
  }

  const acceptJob = async () => {
    const confirmed = confirm(`Accepti lucrarea #${job.id} - ${job.serviceName}?`);
    if (!confirmed) return;
    
    const updatedJob = jobService.updateJobStatus(job.id, 'accepted', 'worker1', user?.name || 'Worker');
    if (updatedJob) {
      setJob(updatedJob);
      alert('✅ Lucrare acceptată! Poți începe să lucrezi.');
    }
  };

  const startJob = async () => {
    const confirmed = confirm('Începi lucrarea acum?');
    if (!confirmed) return;
    
    const updatedJob = jobService.updateJobStatus(job.id, 'in_progress', 'worker1', user?.name || 'Worker');
    if (updatedJob) {
      setJob(updatedJob);
      alert('🔧 Lucrarea a fost marcată ca fiind în progres.');
    }
  };

  const completeJob = async () => {
    // Navigate to completion page with detailed form
    router.push(`/worker/job/${job.id}/complete`);
  };

  const transferJob = async () => {
    const reason = prompt('De ce dorești să transferi această lucrare?');
    if (!reason) return;
    
    const confirmed = confirm(`Sigur dorești să transferi lucrarea?\nMotiv: ${reason}`);
    if (!confirmed) return;
    
    // În aplicația reală aici ar fi o listă cu angajații disponibili
    const availableWorkers = ['Demo User', 'Lacatus 01'];
    const workerChoice = prompt(`Transferă către:\n1. ${availableWorkers[0]}\n2. ${availableWorkers[1]}\n\nIntroduci numărul (1-2):`);
    
    if (workerChoice === '1' || workerChoice === '2') {
      const selectedWorker = availableWorkers[parseInt(workerChoice) - 1];
      alert(`📤 Lucrarea a fost transferată către ${selectedWorker}.\nMotiv: ${reason}`);
      router.push('/worker/dashboard');
    }
  };

  const cancelJob = async () => {
    const reason = prompt('Motivul anulării lucrării:');
    if (!reason) return;
    
    const confirmed = confirm(`Sigur dorești să anulezi lucrarea?\nMotiv: ${reason}`);
    if (!confirmed) return;
    
    const updatedJob = jobService.updateJobStatus(job.id, 'cancelled', 'worker1', user?.name || 'Worker', { reason });
    if (updatedJob) {
      setJob(updatedJob);
      alert(`❌ Lucrarea a fost anulată.\nMotiv: ${reason}`);
      
      setTimeout(() => {
        router.push('/worker/dashboard');
      }, 1500);
    }
  };

  const callClient = () => {
    notificationService.makePhoneCall(job.clientPhone);
  };

  const sendSMSToClient = async () => {
    const message = prompt('Mesajul pentru client:', `Bună ziua, sunt ${user.name} de la Lăcătuș București. Voi sosi în curând pentru lucrarea programată.`);
    if (!message) return;
    
    try {
      await notificationService.sendSMS(job.clientPhone, message);
      alert(`📱 SMS trimis către ${job.clientName} (${job.clientPhone})`);
    } catch (error) {
      alert(`📱 SMS trimis către ${job.clientName} (${job.clientPhone})`);
    }
  };

  const navigateToAddress = () => {
    notificationService.navigateToAddress(job.address);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return Colors.error;
      case 'high': return Colors.warning;
      default: return Colors.info;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'in_progress': return Colors.warning;
      case 'accepted': return Colors.info;
      case 'cancelled': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Atribuită';
      case 'accepted': return 'Acceptată';
      case 'in_progress': return 'În progres';
      case 'completed': return 'Finalizată';
      case 'cancelled': return 'Anulată';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.background }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: Colors.surfaceLight }}
              >
                <ArrowLeft size={20} color={Colors.textSecondary} />
              </button>
              
              <Wrench size={32} color={Colors.secondary} />
              <div>
                <h1 className="text-lg md:text-xl font-bold" style={{ color: Colors.secondary }}>
                  Lucrare #{job.id}
                </h1>
                <p className="text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                  {job.serviceName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-sm md:text-base" style={{ color: Colors.text }}>
                  {user.name}
                </p>
                <p className="text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                  Lucrător
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

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="space-y-6">
          {/* Job Status */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: getStatusColor(job.status),
                    color: Colors.primary,
                  }}
                >
                  {getStatusText(job.status)}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: getPriorityColor(job.priority),
                    color: Colors.primary,
                  }}
                >
                  {job.priority === 'urgent' ? '🚨 URGENT' : 
                   job.priority === 'high' ? '⚡ Prioritate mare' : '📋 Normal'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: Colors.text }}>
                  Informații Client
                </h3>
                <div className="space-y-2">
                  <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                    <User size={16} />
                    {job.clientName}
                  </p>
                  <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                    <Phone size={16} />
                    {job.clientPhone}
                  </p>
                  <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                    <MapPin size={16} />
                    {job.address}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: Colors.text }}>
                  Detalii Lucrare
                </h3>
                <div className="space-y-2">
                  <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                    <Briefcase size={16} />
                    {job.serviceName}
                  </p>
                  <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                    <Clock size={16} />
                    Creată: {new Date(job.createdAt).toLocaleString('ro-RO')}
                  </p>
                </div>
              </div>
            </div>

            {job.serviceDescription && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                  Descrierea problemei
                </h4>
                <p className="p-3 rounded-lg text-sm" style={{ 
                  backgroundColor: Colors.surfaceLight,
                  color: Colors.textSecondary 
                }}>
                  {job.serviceDescription}
                </p>
              </div>
            )}

            {job.specialInstructions && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                  Instrucțiuni speciale
                </h4>
                <p className="p-3 rounded-lg text-sm border" style={{ 
                  backgroundColor: Colors.surfaceLight,
                  borderColor: Colors.warning,
                  color: Colors.textSecondary 
                }}>
                  {job.specialInstructions}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
              Acțiuni disponibile
            </h3>

            {/* Job Status Actions */}
            {job.status === 'assigned' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={acceptJob}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: Colors.success,
                    color: Colors.primary,
                  }}
                >
                  <CheckCircle size={20} />
                  Acceptă Lucrarea
                </button>
                <button
                  onClick={() => transferJob()}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors border"
                  style={{
                    borderColor: Colors.border,
                    color: Colors.textSecondary,
                  }}
                >
                  <Share2 size={20} />
                  Transferă
                </button>
              </div>
            )}

            {job.status === 'accepted' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={startJob}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: Colors.warning,
                    color: Colors.primary,
                  }}
                >
                  <Briefcase size={20} />
                  Începe Lucrarea
                </button>
                <button
                  onClick={() => transferJob()}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors border"
                  style={{
                    borderColor: Colors.border,
                    color: Colors.textSecondary,
                  }}
                >
                  <Share2 size={20} />
                  Transferă
                </button>
              </div>
            )}

            {job.status === 'in_progress' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={completeJob}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: Colors.success,
                    color: Colors.primary,
                  }}
                >
                  <CheckCircle size={20} />
                  Finalizează
                </button>
                <button
                  onClick={() => transferJob()}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors border"
                  style={{
                    borderColor: Colors.border,
                    color: Colors.textSecondary,
                  }}
                >
                  <Share2 size={20} />
                  Transferă
                </button>
              </div>
            )}

            {/* Communication & Navigation Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <button
                onClick={callClient}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: Colors.info,
                  color: Colors.primary,
                }}
              >
                <Phone size={20} />
                Apelează Client
              </button>
              
              <button
                onClick={sendSMSToClient}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: Colors.secondary,
                  color: Colors.background,
                }}
              >
                <MessageSquare size={20} />
                Trimite SMS
              </button>
              
              <button
                onClick={navigateToAddress}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: Colors.warning,
                  color: Colors.primary,
                }}
              >
                <Navigation size={20} />
                Navigație
              </button>
              
              <button
                onClick={cancelJob}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors border"
                style={{
                  borderColor: Colors.error,
                  color: Colors.error,
                }}
              >
                <X size={20} />
                Anulează
              </button>
            </div>

            {job.status === 'completed' && (
              <div className="text-center py-4">
                <CheckCircle size={48} color={Colors.success} className="mx-auto mb-2" />
                <p className="text-lg font-semibold" style={{ color: Colors.success }}>
                  Lucrare finalizată cu succes!
                </p>
                <button
                  onClick={() => router.push('/worker/dashboard')}
                  className="mt-4 px-6 py-2 rounded-lg"
                  style={{ backgroundColor: Colors.secondary, color: Colors.background }}
                >
                  Înapoi la Dashboard
                </button>
              </div>
            )}

            {job.status === 'cancelled' && (
              <div className="text-center py-4">
                <X size={48} color={Colors.error} className="mx-auto mb-2" />
                <p className="text-lg font-semibold" style={{ color: Colors.error }}>
                  Lucrare anulată
                </p>
                <button
                  onClick={() => router.push('/worker/dashboard')}
                  className="mt-4 px-6 py-2 rounded-lg"
                  style={{ backgroundColor: Colors.secondary, color: Colors.background }}
                >
                  Înapoi la Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}