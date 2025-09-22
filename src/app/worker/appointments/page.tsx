'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import WorkerLayout from '@/components/WorkerLayout';
import { 
  User, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  Phone,
  MessageCircle
} from 'lucide-react';

export default function WorkerAppointments() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.type !== 'worker') {
      router.replace('/');
    }
  }, [user, router]);

  if (!user || user.type !== 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const appointments = [
    {
      id: '1001',
      clientName: 'Ion Popescu',
      address: 'Str. Aviatorilor nr. 15',
      phone: '+40721123456',
      service: 'Deblocare ușă',
      time: '14:30',
      status: 'assigned',
      priority: 'urgent'
    },
    {
      id: '1002',
      clientName: 'Maria Ionescu', 
      address: 'Bd. Unirii nr. 45',
      phone: '+40731112233',
      service: 'Schimbare yală',
      time: '16:00',
      status: 'pending',
      priority: 'normal'
    }
  ];

  const handleSendMessage = (phoneNumber: string) => {
    // Deschide aplicația de mesaje cu numărul de telefon
    window.open(`sms:${phoneNumber}`, '_self');
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

        {/* Appointments List - Fully Responsive */}
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
                    #{appointment.id} - {appointment.service}
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
                      <span className="text-sm sm:text-base">{appointment.phone}</span>
                    </p>
                    <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                      <Clock size={16} className="flex-shrink-0" />
                      <span className="text-sm sm:text-base">Ora: {appointment.time}</span>
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons - Responsive */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
                    style={{
                      backgroundColor: Colors.success,
                      color: Colors.primary,
                    }}
                  >
                    <CheckCircle size={16} />
                    <span className="hidden sm:inline">Accept Programarea</span>
                    <span className="sm:hidden">Acceptă</span>
                  </button>
                  <button
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
                    onClick={() => handleSendMessage(appointment.phone)}
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
      </div>
    </WorkerLayout>
  );
}
