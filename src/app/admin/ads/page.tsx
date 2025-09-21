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
  TrendingUp
} from 'lucide-react';

export default function AdminAds() {
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
    { icon: FileText, label: 'Rapoarte', path: '/admin/reports' },
    { icon: DollarSign, label: 'Reclame', path: '/admin/ads', active: true },
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
                  Gestionare Reclame
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
                Gestionare Reclame
              </h2>
              <p style={{ color: Colors.textSecondary }}>
                Administrează bugetul de publicitate și urmărește performanța campaniilor.
              </p>
            </div>

            {/* Ads Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <DollarSign size={24} color={Colors.warning} />
                  <TrendingUp size={20} color={Colors.success} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Buget Luna Aceasta
                </h3>
                <p className="text-2xl font-bold mb-1" style={{ color: Colors.warning }}>
                  1,200 RON
                </p>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>
                  +15% față de luna trecută
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
                  <span className="text-2xl font-bold" style={{ color: Colors.success }}>
                    +23%
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  ROI Publicitate
                </h3>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>
                  Returnul la investiție îmbunătățit
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
                  <BarChart3 size={24} color={Colors.info} />
                  <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                    47
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Leaduri Generate
                </h3>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>
                  Clienți noi din publicitate
                </p>
              </div>
            </div>

            {/* Ads Management Placeholder */}
            <div
              className="p-8 rounded-lg border text-center"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <DollarSign size={64} color={Colors.textMuted} className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: Colors.text }}>
                Gestionare Campanii Publicitare
              </h3>
              <p style={{ color: Colors.textSecondary }}>
                Aici vor fi afișate campaniile active, bugetele alocate,
                performanța pe platforme (Google Ads, Facebook, etc.) 
                și analiza detaliată a ROI-ului.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}