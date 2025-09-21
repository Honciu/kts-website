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
  Phone,
  Mail,
  Edit
} from 'lucide-react';

export default function WorkerProfile() {
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
    { icon: Calendar, label: 'Programări', path: '/worker/appointments' },
    { icon: DollarSign, label: 'Câștiguri', path: '/worker/earnings' },
    { icon: MapPin, label: 'Hartă', path: '/worker/map' },
    { icon: User, label: 'Profil', path: '/worker/profile', active: true },
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
                  Profil Personal
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
                Profilul Meu
              </h2>
              <p style={{ color: Colors.textSecondary }}>
                Gestionează informațiile tale personale.
              </p>
            </div>

            {/* Profile Info */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                  Informații Personale
                </h3>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: Colors.secondary,
                    color: Colors.background,
                  }}
                >
                  <Edit size={16} />
                  Editează
                </button>
              </div>

              <div className="flex items-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mr-6"
                  style={{ backgroundColor: Colors.secondary }}
                >
                  <User size={40} color={Colors.background} />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-1" style={{ color: Colors.text }}>
                    {user.name}
                  </h4>
                  <p style={{ color: Colors.textSecondary }}>
                    Lucrător Lăcătuș București
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Nume Complet
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                    <User size={16} color={Colors.textSecondary} />
                    <span style={{ color: Colors.text }}>{user.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Username
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                    <User size={16} color={Colors.textSecondary} />
                    <span style={{ color: Colors.text }}>@{user.username}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Telefon
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                    <Phone size={16} color={Colors.textSecondary} />
                    <span style={{ color: Colors.text }}>{user.phone || '+40712345678'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Email
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                    <Mail size={16} color={Colors.textSecondary} />
                    <span style={{ color: Colors.text }}>{user.email || 'email@lacatus.ro'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div
              className="p-8 rounded-lg border text-center"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <User size={64} color={Colors.textMuted} className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: Colors.text }}>
                Setări Suplimentare
              </h3>
              <p style={{ color: Colors.textSecondary }}>
                Aici vor fi disponibile:
                <br />• Schimbare parolă
                <br />• Preferințe notificări
                <br />• Setări privacy
                <br />• Istoric activitate
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}