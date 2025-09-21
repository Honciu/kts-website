'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { 
  Wrench, 
  User, 
  MapPin, 
  Calendar, 
  DollarSign,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation
} from 'lucide-react';

export default function WorkerAppointments() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.type !== 'worker') {
      router.replace('/');
    }
  }, [user, router]);

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

  const menuItems = [
    { icon: User, label: 'Dashboard', path: '/worker/dashboard', active: false },
    { icon: Calendar, label: 'Programări', path: '/worker/appointments', active: true },
    { icon: DollarSign, label: 'Câștiguri', path: '/worker/earnings' },
    { icon: MapPin, label: 'Hartă', path: '/worker/map' },
    { icon: User, label: 'Profil', path: '/worker/profile' },
  ];

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.background }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench size={32} color={Colors.secondary} />
              <div>
                <h1 className="text-xl font-bold" style={{ color: Colors.secondary }}>
                  Lăcătuș București
                </h1>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>
                  Programări
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium" style={{ color: Colors.text }}>
                  {user.name}
                </p>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>
                  Lucrător Activ
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

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r min-h-[calc(100vh-77px)]" style={{ 
          backgroundColor: Colors.surface, 
          borderColor: Colors.border 
        }}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    item.active ? 'font-medium' : ''
                  }`}
                  style={{
                    backgroundColor: item.active ? Colors.secondary : 'transparent',
                    color: item.active ? Colors.background : Colors.textSecondary,
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: Colors.text }}>
                Programările Mele
              </h2>
              <p style={{ color: Colors.textSecondary }}>
                Vizualizează și gestionează programările atribuite.
              </p>
            </div>

            {/* Appointments List */}
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surface,
                    borderColor: appointment.priority === 'urgent' ? Colors.error : Colors.border,
                    borderWidth: appointment.priority === 'urgent' ? '2px' : '1px'
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                          #{appointment.id} - {appointment.service}
                        </h3>
                        {appointment.priority === 'urgent' && (
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: Colors.error,
                              color: Colors.primary,
                            }}
                          >
                            URGENT
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="flex items-center gap-2 mb-2" style={{ color: Colors.textSecondary }}>
                            <User size={16} />
                            {appointment.clientName}
                          </p>
                          <p className="flex items-center gap-2 mb-2" style={{ color: Colors.textSecondary }}>
                            <MapPin size={16} />
                            {appointment.address}
                          </p>
                        </div>
                        <div>
                          <p className="flex items-center gap-2 mb-2" style={{ color: Colors.textSecondary }}>
                            📞 {appointment.phone}
                          </p>
                          <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                            <Clock size={16} />
                            Ora: {appointment.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: Colors.success,
                        color: Colors.primary,
                      }}
                    >
                      <CheckCircle size={16} />
                      Accept Programarea
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: Colors.info,
                        color: Colors.primary,
                      }}
                    >
                      <Navigation size={16} />
                      Navigare
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors"
                      style={{
                        borderColor: Colors.border,
                        color: Colors.textSecondary,
                      }}
                    >
                      <AlertCircle size={16} />
                      Respinge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}