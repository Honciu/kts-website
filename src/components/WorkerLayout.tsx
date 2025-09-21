'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import NotificationSystem from './NotificationSystem';
import { 
  Wrench, 
  User, 
  Calendar, 
  DollarSign, 
  MapPin, 
  LogOut, 
  Menu, 
  X,
  CheckCircle,
  Clock,
  FileText,
  BarChart3
} from 'lucide-react';

interface WorkerLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  pageTitle: string;
}

export default function WorkerLayout({ children, currentPage, pageTitle }: WorkerLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/worker/dashboard' },
    { icon: Calendar, label: 'Programări', path: '/worker/appointments' },
    { icon: CheckCircle, label: 'Joburi Finalizate', path: '/worker/completed-jobs' },
    { icon: DollarSign, label: 'Câștiguri', path: '/worker/earnings' },
    { icon: MapPin, label: 'Hartă', path: '/worker/map' },
    { icon: User, label: 'Profil', path: '/worker/profile' },
  ];

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {isMobile && (
        <div className="p-4 border-b" style={{ borderColor: Colors.border }}>
          <div className="flex items-center gap-3">
            <Wrench size={24} color={Colors.secondary} />
            <h2 className="font-bold" style={{ color: Colors.secondary }}>
              Lăcătuș București
            </h2>
          </div>
        </div>
      )}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                router.push(item.path);
                if (isMobile) setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                isActive ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: isActive ? Colors.secondary : 'transparent',
                color: isActive ? Colors.background : Colors.textSecondary,
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );

  const BottomNavigationContent = () => (
    <nav className="flex justify-around items-center px-2 py-3 border-t" 
         style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.path;
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              isActive ? 'font-medium' : ''
            }`}
            style={{
              color: isActive ? Colors.secondary : Colors.textSecondary,
            }}
          >
            <Icon size={20} />
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

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
                  {pageTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-sm md:text-base" style={{ color: Colors.text }}>
                  {user?.name}
                </p>
                <p className="text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                  Lucrător Activ
                </p>
              </div>
              <NotificationSystem />
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

      {/* Desktop Layout */}
      <div className="hidden md:flex relative">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r min-h-[calc(100vh-77px)]" style={{ 
          backgroundColor: Colors.surface, 
          borderColor: Colors.border 
        }}>
          <SidebarContent />
        </aside>

        {/* Desktop Main Content */}
        <main className="flex-1 p-6 w-full min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col relative min-h-[calc(100vh-77px)]">
        {/* Mobile overlay for sidebar */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar (slide from left) */}
        <aside 
          className={`fixed top-0 left-0 h-full w-64 border-r z-50 transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ 
            backgroundColor: Colors.surface, 
            borderColor: Colors.border 
          }}
        >
          <SidebarContent isMobile={true} />
        </aside>

        {/* Mobile Main Content */}
        <main className="flex-1 p-4 pb-20 w-full min-w-0">
          {children}
        </main>
        
        {/* Bottom Navigation (Fixed) */}
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <BottomNavigationContent />
        </div>
      </div>
    </div>
  );
}