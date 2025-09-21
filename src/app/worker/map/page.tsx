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
  LogOut
} from 'lucide-react';

export default function WorkerMap() {
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
    { icon: MapPin, label: 'Hartă', path: '/worker/map', active: true },
    { icon: User, label: 'Profil', path: '/worker/profile' },
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
                  Hartă Lucrări
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
                Hartă Lucrări
              </h2>
              <p style={{ color: Colors.textSecondary }}>
                Vizualizează locațiile lucrărilor și optimizează ruta.
              </p>
            </div>

            {/* Map Placeholder */}
            <div
              className="p-8 rounded-lg border text-center"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <MapPin size={64} color={Colors.textMuted} className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: Colors.text }}>
                Hartă Interactivă
              </h3>
              <p style={{ color: Colors.textSecondary }}>
                Aici va fi integrată harta cu:
                <br />• Locațiile lucrărilor active
                <br />• Poziția ta curentă
                <br />• Optimizarea rutei
                <br />• Navigare GPS
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}