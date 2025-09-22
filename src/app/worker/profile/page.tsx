'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import WorkerLayout from '@/components/WorkerLayout';
import { 
  User, 
  Phone,
  Mail,
  Edit
} from 'lucide-react';

export default function WorkerProfile() {
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

  return (
    <WorkerLayout currentPage="/worker/profile" pageTitle="Profil Personal">
      <div className="space-y-6">
        {/* Header - Responsive */}
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" style={{ color: Colors.text }}>
            Profilul Meu
          </h2>
          <p className="text-sm sm:text-base" style={{ color: Colors.textSecondary }}>
            Gestionează informațiile tale personale.
          </p>
        </div>

        {/* Profile Info - Fully Responsive */}
        <div
          className="p-4 sm:p-6 rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg sm:text-xl font-semibold text-center sm:text-left" style={{ color: Colors.text }}>
              Informații Personale
            </h3>
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
              style={{
                backgroundColor: Colors.secondary,
                color: Colors.background,
              }}
            >
              <Edit size={16} />
              Editează
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6 gap-4">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: Colors.secondary }}
            >
              <User size={32} color={Colors.background} className="sm:w-10 sm:h-10" />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-lg sm:text-xl font-semibold mb-1" style={{ color: Colors.text }}>
                {user.name}
              </h4>
              <p className="text-sm sm:text-base" style={{ color: Colors.textSecondary }}>
                Lucrător Lăcătuș București
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                Nume Complet
              </label>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                <User size={16} color={Colors.textSecondary} className="flex-shrink-0" />
                <span className="text-sm sm:text-base truncate" style={{ color: Colors.text }}>{user.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                ID Angajat
              </label>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                <User size={16} color={Colors.textSecondary} className="flex-shrink-0" />
                <span className="text-sm sm:text-base truncate" style={{ color: Colors.text }}>{user.id?.substring(0, 8)}...</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                Telefon
              </label>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                <Phone size={16} color={Colors.textSecondary} className="flex-shrink-0" />
                <a 
                  href={`tel:${user.phone || '+40712345678'}`}
                  className="text-sm sm:text-base hover:underline truncate" 
                  style={{ color: Colors.text }}
                >
                  {user.phone || '+40712345678'}
                </a>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                Email
              </label>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: Colors.surfaceLight }}>
                <Mail size={16} color={Colors.textSecondary} className="flex-shrink-0" />
                <a 
                  href={`mailto:${user.email || 'robert@lacatus.ro'}`}
                  className="text-sm sm:text-base hover:underline truncate" 
                  style={{ color: Colors.text }}
                >
                  {user.email || 'robert@lacatus.ro'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-lg border text-center"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="text-2xl font-bold mb-1" style={{ color: Colors.success }}>
              85%
            </div>
            <p className="text-sm" style={{ color: Colors.textSecondary }}>Comision Expert</p>
          </div>
          
          <div
            className="p-4 rounded-lg border text-center"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="text-2xl font-bold mb-1" style={{ color: Colors.info }}>
              Activ
            </div>
            <p className="text-sm" style={{ color: Colors.textSecondary }}>Status Cont</p>
          </div>
          
          <div
            className="p-4 rounded-lg border text-center sm:col-span-2 lg:col-span-1"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="text-2xl font-bold mb-1" style={{ color: Colors.secondary }}>
              Expert
            </div>
            <p className="text-sm" style={{ color: Colors.textSecondary }}>Nivel Experiență</p>
          </div>
        </div>

        {/* Settings - Responsive */}
        <div
          className="p-6 sm:p-8 rounded-lg border text-center"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <User size={48} color={Colors.textMuted} className="mx-auto mb-4 sm:w-16 sm:h-16" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: Colors.text }}>
            Setări Suplimentare
          </h3>
          <p className="text-sm sm:text-base" style={{ color: Colors.textSecondary }}>
            Aici vor fi disponibile:
            <br />• Schimbare parolă
            <br />• Preferințe notificări
            <br />• Setări privacy
            <br />• Istoric activitate
          </p>
        </div>
      </div>
    </WorkerLayout>
  );
}