'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { 
  Wrench, 
  Users, 
  Briefcase, 
  FileText, 
  BarChart3,
  DollarSign,
  Menu,
  X,
  LogOut,
  Settings
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard', active: true },
    { icon: Users, label: 'Angajați', path: '/admin/employees' },
    { icon: Briefcase, label: 'Lucrări', path: '/admin/jobs' },
    { icon: FileText, label: 'Rapoarte', path: '/admin/reports' },
    { icon: DollarSign, label: 'Reclame', path: '/admin/ads' },
    { icon: Settings, label: 'Setări', path: '/admin/settings' },
  ];

  const stats = [
    { title: 'Lucrări Active', value: '12', color: Colors.info, icon: Briefcase },
    { title: 'Angajați Activi', value: '3', color: Colors.success, icon: Users },
    { title: 'Venit Săptămânal', value: '2,450 RON', color: Colors.warning, icon: DollarSign },
    { title: 'Profit', value: '1,200 RON', color: Colors.secondary, icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.background }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg transition-colors"
                style={{ backgroundColor: Colors.surfaceLight }}
              >
                {isMobileMenuOpen ? <X size={20} color={Colors.textSecondary} /> : <Menu size={20} color={Colors.textSecondary} />}
              </button>
              
              <Wrench size={32} color={Colors.secondary} />
              <div>
                <h1 className="text-lg md:text-xl font-bold" style={{ color: Colors.secondary }}>
                  Lăcătuș București
                </h1>
                <p className="text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                  Panou Administrator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-sm md:text-base" style={{ color: Colors.text }}>
                  {user.name}
                </p>
                <p className="text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
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

      <div className="flex relative">
        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r min-h-[calc(100vh-77px)]" style={{ 
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
        
        {/* Mobile Sidebar */}
        <aside 
          className={`lg:hidden fixed top-0 left-0 h-full w-64 border-r z-50 transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ 
            backgroundColor: Colors.surface, 
            borderColor: Colors.border 
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: Colors.border }}>
            <div className="flex items-center gap-3">
              <Wrench size={24} color={Colors.secondary} />
              <h2 className="font-bold" style={{ color: Colors.secondary }}>
                Lăcătuș București
              </h2>
            </div>
          </div>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setIsMobileMenuOpen(false);
                  }}
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
        <main className="flex-1 p-4 md:p-6 w-full min-w-0">
          <div className="space-y-6">
            {/* Welcome */}
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: Colors.text }}>
                Bun venit, {user.name}!
              </h2>
              <p style={{ color: Colors.textSecondary }}>
                Aici puteți gestiona toate aspectele afacerii dumneavoastră.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-lg border"
                    style={{
                      backgroundColor: Colors.surface,
                      borderColor: Colors.border,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Icon size={24} color={stat.color} />
                      <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                        {stat.value}
                      </span>
                    </div>
                    <p className="font-medium" style={{ color: Colors.textSecondary }}>
                      {stat.title}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              <div
                className="p-6 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-colors"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                }}
                onClick={() => router.push('/admin/jobs')}
              >
                <Briefcase size={32} color={Colors.secondary} className="mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Gestionează Lucrări
                </h3>
                <p style={{ color: Colors.textSecondary }}>
                  Atribuie și monitorizează lucrările active
                </p>
              </div>

              <div
                className="p-6 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-colors"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                }}
                onClick={() => router.push('/admin/employees')}
              >
                <Users size={32} color={Colors.success} className="mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Gestionează Angajați
                </h3>
                <p style={{ color: Colors.textSecondary }}>
                  Adaugă și editează informațiile angajaților
                </p>
              </div>

              <div
                className="p-6 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-colors"
                style={{
                  backgroundColor: Colors.surface,
                  borderColor: Colors.border,
                }}
                onClick={() => router.push('/admin/reports')}
              >
                <FileText size={32} color={Colors.warning} className="mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                  Rapoarte
                </h3>
                <p style={{ color: Colors.textSecondary }}>
                  Vizualizează rapoarte și statistici
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
                Activitate Recentă
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: Colors.success }}
                  ></div>
                  <p style={{ color: Colors.textSecondary }}>
                    Lucrarea #1001 a fost finalizată de Robert
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: Colors.info }}
                  ></div>
                  <p style={{ color: Colors.textSecondary }}>
                    Nouă lucrare adăugată pentru str. Aviatorilor
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: Colors.warning }}
                  ></div>
                  <p style={{ color: Colors.textSecondary }}>
                    Demo User este în drum spre o nouă adresă
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}