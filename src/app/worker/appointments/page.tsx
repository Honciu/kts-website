'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import WorkerLayout from '@/components/WorkerLayout';
import { realApiService } from '@/utils/realApiService';
import { type Job } from '@/utils/jobService';
import { 
  User, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  Phone,
  MessageCircle,
  Calendar,
  CalendarX
} from 'lucide-react';

export default function WorkerAppointments() {
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Load appointments from REAL API
  const loadAppointments = React.useCallback(async () => {
    setLoading(true);
    try {
      console.log('📅 Worker Appointments: Loading REAL appointments from API...');
      const response = await realApiService.getJobs();
      
      if (response.success) {
        const allJobs = response.data;
        const workerId = user?.id || 'default-worker';
        
        console.log('📅 Worker Appointments DEBUG:');
        console.log('  - User from session:', user);
        console.log('  - Worker ID (user.id):', workerId);
        console.log('  - Total jobs from API:', allJobs.length);
        
        // Filter for worker's appointments (assigned jobs not yet accepted/completed)
        let workerJobs = allJobs.filter(job => job.assignedEmployeeId === workerId);
        
        // FALLBACK: Try by name if no jobs found by ID
        if (workerJobs.length === 0 && allJobs.length > 0 && user?.name) {
          console.log('⚠️ APPOINTMENTS: NO JOBS FOUND with ID! Trying fallback by name:');
          const fallbackJobs = allJobs.filter(job => 
            job.assignedEmployeeName && user.name &&
            job.assignedEmployeeName.toLowerCase().includes(user.name.toLowerCase())
          );
          
          if (fallbackJobs.length > 0) {
            console.log(`🎆 APPOINTMENTS FALLBACK SUCCESS: Found ${fallbackJobs.length} jobs by name!`);
            workerJobs = fallbackJobs;
          }
        }
        
        // Filter for appointments (assigned jobs - not yet started/completed)
        const appointmentJobs = workerJobs.filter(job => 
          job.status === 'assigned' // Only show jobs that are assigned but not yet accepted/started
        );
        
        console.log('📅 APPOINTMENTS RESULT:');
        console.log(`  - Found ${appointmentJobs.length} real appointments`);
        console.log('  - Appointments details:', appointmentJobs.map(j => ({
          id: j.id,
          client: j.clientName,
          service: j.serviceName,
          status: j.status,
          priority: j.priority
        })));
        
        setAppointments(appointmentJobs);
        console.log('✅ Worker Appointments: Loaded', appointmentJobs.length, 'real appointments');
      } else {
        console.error('❌ Worker Appointments: API error:', response.error);
        setAppointments([]);
      }
    } catch (error) {
      console.error('❌ Worker Appointments: Error loading:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
      setLastRefreshTime(new Date());
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.type !== 'worker') {
      router.replace('/');
      return;
    }
    
    loadAppointments();
    
    // Add REAL API listener for real-time updates
    realApiService.addChangeListener('worker-appointments', (hasChanges) => {
      if (hasChanges) {
        console.log('📅 Worker Appointments: Real-time changes detected - syncing!');
        loadAppointments();
      }
    });
    
    // Cleanup listener
    return () => {
      realApiService.removeChangeListener('worker-appointments');
    };
  }, [user, router, loadAppointments]);

  if (!user || user.type !== 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  // No more hardcoded data - using real API data from state

  const handleSendMessage = (phoneNumber: string, job: Job) => {
    // Creează mesajul cu locația și detaliile lucrarii
    const message = `Bună! Sunt ${user?.name} de la Lăcătuș București. Vă contactez în legătură cu programarea #${job.id} - ${job.serviceName}. Locația: ${job.address}. Vă mulțumesc!`;
    
    // Deschide aplicația de mesaje cu numărul și mesajul pregătit
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_self');
  };
  
  const handleAcceptAppointment = async (job: Job) => {
    try {
      const response = await realApiService.updateJob(job.id, {
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      });
      
      if (response.success) {
        console.log('✅ Appointment accepted:', job.id);
        alert(`✅ Ați acceptat programarea #${job.id}!`);
        loadAppointments(); // Refresh data
      } else {
        alert('❌ Eroare la acceptarea programării. Încercați din nou.');
      }
    } catch (error) {
      console.error('❌ Error accepting appointment:', error);
      alert('❌ A apărut o eroare.');
    }
  };
  
  const handleRejectAppointment = async (job: Job) => {
    const reason = prompt(`De ce respingeți programarea #${job.id}?`, 'Nu sunt disponibil');
    if (reason === null) return;
    
    const confirmReject = confirm(`Sigur doriți să respingeți programarea #${job.id}?`);
    if (!confirmReject) return;
    
    try {
      const response = await realApiService.updateJob(job.id, {
        status: 'cancelled',
        completionData: { reason } as any
      });
      
      if (response.success) {
        console.log('✅ Appointment rejected:', job.id);
        alert(`✅ Ați respins programarea #${job.id}. Motivul: ${reason}`);
        loadAppointments(); // Refresh data
      } else {
        alert('❌ Eroare la respingerea programării. Încercați din nou.');
      }
    } catch (error) {
      console.error('❌ Error rejecting appointment:', error);
      alert('❌ A apărut o eroare.');
    }
  };
  
  const navigateToLocation = (address: string) => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(address + ', București')}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <WorkerLayout currentPage="/worker/appointments" pageTitle="Programări">
      <div className="space-y-6">
        {/* Header - Responsive */}
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" style={{ color: Colors.text }}>
            Programările Mele
          </h2>
          <p className="text-sm sm:text-base" style={{ color: Colors.textSecondary }}>
            Vizualizează și gestionează programările atribuite.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
            <p style={{ color: Colors.textSecondary }}>Se încarcă programările...</p>
          </div>
        ) : appointments.length === 0 ? (
          /* Empty State - No Appointments */
          <div className="text-center py-12">
            <CalendarX size={64} color={Colors.textMuted} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2" style={{ color: Colors.text }}>
              Nicio programăre activă
            </h3>
            <p className="mb-4" style={{ color: Colors.textSecondary }}>
              Nu aveți programări în așteptarea acceptării în acest moment.
            </p>
            <p className="text-sm" style={{ color: Colors.textMuted }}>
              Veti fi notificat când veti primi o nouă programare de la administrator.
            </p>
          </div>
        ) : (
          /* Appointments List - Real Data */
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 sm:p-6 rounded-lg border"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: appointment.priority === 'urgent' ? Colors.error : Colors.border,
                  borderWidth: appointment.priority === 'urgent' ? '2px' : '1px'
                }}
              >
                <div className="space-y-4">
                  {/* Header with ID and Service */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold" style={{ color: Colors.text }}>
                      #{appointment.id} - {appointment.serviceName}
                    </h3>
                    {appointment.priority === 'urgent' && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium self-start sm:self-center"
                        style={{
                          backgroundColor: Colors.error,
                          color: Colors.primary,
                        }}
                      >
                        URGENT
                      </span>
                    )}
                  </div>
                  
                  {/* Client Info - Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                        <User size={16} className="flex-shrink-0" />
                        <span className="text-sm sm:text-base">{appointment.clientName}</span>
                      </p>
                      <p className="flex items-start gap-2" style={{ color: Colors.textSecondary }}>
                        <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base break-words">{appointment.address}</span>
                      </p>
                    </div>
                    <div className="space-y-3">
                      <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                        <Phone size={16} className="flex-shrink-0" />
                        <span className="text-sm sm:text-base">{appointment.clientPhone}</span>
                      </p>
                      <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                        <Calendar size={16} className="flex-shrink-0" />
                        <span className="text-sm sm:text-base">Creat: {new Date(appointment.createdAt).toLocaleDateString('ro-RO')}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Responsive */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                    <button
                      onClick={() => handleAcceptAppointment(appointment)}
                      className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
                      style={{
                        backgroundColor: Colors.success,
                        color: Colors.primary,
                      }}
                    >
                      <CheckCircle size={16} />
                      <span className="hidden sm:inline">Accept Programărea</span>
                      <span className="sm:hidden">Acceptă</span>
                    </button>
                    <button
                      onClick={() => navigateToLocation(appointment.address)}
                      className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
                      style={{
                        backgroundColor: Colors.info,
                        color: Colors.primary,
                      }}
                    >
                      <Navigation size={16} />
                      <span className="hidden sm:inline">Navigare</span>
                      <span className="sm:hidden">GPS</span>
                    </button>
                    <button
                      onClick={() => handleSendMessage(appointment.clientPhone, appointment)}
                      className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
                      style={{
                        backgroundColor: Colors.warning,
                        color: Colors.primary,
                      }}
                    >
                      <MessageCircle size={16} />
                      <span className="hidden sm:inline">Trimite Mesaj</span>
                      <span className="sm:hidden">SMS</span>
                    </button>
                    <button
                      onClick={() => handleRejectAppointment(appointment)}
                      className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 rounded-lg border font-medium transition-colors text-sm sm:text-base"
                      style={{
                        borderColor: Colors.border,
                        color: Colors.textSecondary,
                      }}
                    >
                      <AlertCircle size={16} />
                      <span className="hidden sm:inline">Respinge</span>
                      <span className="sm:hidden">Nu</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
