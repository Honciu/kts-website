'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { 
  Wrench, 
  Users, 
  Briefcase, 
  FileText, 
  Settings, 
  LogOut, 
  BarChart3,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react';

export default function AdminReports() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
    }
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard', active: false },
    { icon: Users, label: 'Angajați', path: '/admin/employees' },
    { icon: Briefcase, label: 'Lucrări', path: '/admin/jobs' },
    { icon: FileText, label: 'Rapoarte', path: '/admin/reports', active: true },
    { icon: DollarSign, label: 'Reclame', path: '/admin/ads' },
    { icon: Settings, label: 'Setări', path: '/admin/settings' },
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
                  Rapoarte și Analize
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium" style={{ color: Colors.text }}>
                  {user.name}
                </p>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>
                  Administrator{user.isManager ? ' Principal' : ''}
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
                Rapoarte și Statistici
              </h2>
              <p style={{ color: Colors.textSecondary }}>
                Analizează performanța afacerii și câștigurile pe perioade.
              </p>
            </div>

            {/* Period Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <Calendar size={24} color={Colors.info} />
                  <TrendingUp size={20} color={Colors.success} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Această Săptămână
                </h3>
                <div className="space-y-2">
                  <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                    <span>Venituri:</span>
                    <span className="font-semibold" style={{ color: Colors.success }}>2,450 RON</span>
                  </p>
                  <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                    <span>Cheltuieli:</span>
                    <span className="font-semibold" style={{ color: Colors.error }}>850 RON</span>
                  </p>
                  <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                    <span>Profit:</span>
                    <span className="font-semibold" style={{ color: Colors.secondary }}>1,600 RON</span>
                  </p>
                </div>
              </div>

              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <Calendar size={24} color={Colors.warning} />
                  <TrendingUp size={20} color={Colors.success} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Luna Aceasta
                </h3>
                <div className="space-y-2">
                  <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                    <span>Venituri:</span>
                    <span className="font-semibold" style={{ color: Colors.success }}>9,850 RON</span>
                  </p>
                  <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                    <span>Cheltuieli:</span>
                    <span className="font-semibold" style={{ color: Colors.error }}>3,200 RON</span>
                  </p>
                  <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                    <span>Profit:</span>
                    <span className="font-semibold" style={{ color: Colors.secondary }}>6,650 RON</span>
                  </p>
                </div>
              </div>

              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 size={24} color={Colors.secondary} />
                  <TrendingUp size={20} color={Colors.success} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Anul Acesta
                </h3>
                <div className="space-y-2">
                  <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                    <span>Venituri:</span>
                    <span className="font-semibold" style={{ color: Colors.success }}>125,400 RON</span>
                  </p>
                  <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                    <span>Cheltuieli:</span>
                    <span className="font-semibold" style={{ color: Colors.error }}>42,100 RON</span>
                  </p>
                  <p className="flex justify-between" style={{ color: Colors.textSecondary }}>
                    <span>Profit:</span>
                    <span className="font-semibold" style={{ color: Colors.secondary }}>83,300 RON</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Placeholder */}
            <div
              className="p-8 rounded-lg border text-center"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <BarChart3 size={64} color={Colors.textMuted} className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: Colors.text }}>
                Grafice și Analize
              </h3>
              <p style={{ color: Colors.textSecondary }}>
                Aici vor fi afișate grafice detaliate cu performanța pe perioade,
                evoluția veniturilor și analiza serviciilor.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}