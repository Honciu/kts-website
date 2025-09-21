'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { 
  Wrench, 
  User, 
  Calendar, 
  CreditCard,
  Phone,
  MapPin,
  LogOut,
  Plus,
  History
} from 'lucide-react';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('request');

  useEffect(() => {
    if (!user || user.type !== 'client') {
      router.replace('/');
    }
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user || user.type !== 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const services = [
    { id: '1', name: 'Deblocare ușă', price: 120, description: 'Deblocare ușă standard' },
    { id: '2', name: 'Schimbare yală', price: 200, description: 'Schimbare yală cu montaj' },
    { id: '3', name: 'Reparație seif', price: 350, description: 'Reparație seif cu piese' },
    { id: '4', name: 'Copiere chei', price: 25, description: 'Copiere chei standard' },
  ];

  const myRequests = [
    {
      id: '1001',
      service: 'Deblocare ușă',
      address: 'Str. Mihai Viteazu nr. 22',
      date: '15.01.2025',
      status: 'completed',
      worker: 'Robert',
      amount: 120
    },
    {
      id: '1002', 
      service: 'Schimbare yală',
      address: 'Bd. Unirii nr. 45',
      date: '18.01.2025',
      status: 'in_progress',
      worker: 'Demo User',
      amount: 200
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
                  Portal Client
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium" style={{ color: Colors.text }}>
                  {user.name}
                </p>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>
                  Client
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

      <div className="max-w-6xl mx-auto p-6">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: Colors.text }}>
            Bun venit, {user.name}!
          </h2>
          <p style={{ color: Colors.textSecondary }}>
            Solicitați servicii de lăcătușerie sau urmăriți comenzile existente.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg p-1 mb-6" style={{ backgroundColor: Colors.surface }}>
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'request' ? 'font-semibold' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'request' ? Colors.secondary : 'transparent',
              color: activeTab === 'request' ? Colors.background : Colors.textSecondary,
            }}
            onClick={() => setActiveTab('request')}
          >
            <Plus size={20} />
            Solicitare Nouă
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'history' ? 'font-semibold' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'history' ? Colors.secondary : 'transparent',
              color: activeTab === 'history' ? Colors.background : Colors.textSecondary,
            }}
            onClick={() => setActiveTab('history')}
          >
            <History size={20} />
            Istoric Comenzi
          </button>
        </div>

        {/* Request New Service Tab */}
        {activeTab === 'request' && (
          <div className="space-y-6">
            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-6 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-colors"
                  style={{
                    backgroundColor: Colors.surface,
                    borderColor: Colors.border,
                  }}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                      {service.name}
                    </h3>
                    <p className="text-sm mb-3" style={{ color: Colors.textSecondary }}>
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold" style={{ color: Colors.secondary }}>
                        {service.price} RON
                      </span>
                      <button
                        className="px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: Colors.secondary,
                          color: Colors.background,
                        }}
                      >
                        Comandă
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
                Solicitare Personalizată
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Numele dumneavoastră
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none"
                    style={{ 
                      borderColor: Colors.border,
                      color: Colors.text,
                      backgroundColor: Colors.surfaceLight
                    }}
                    defaultValue={user.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Numărul de telefon
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none"
                    style={{ 
                      borderColor: Colors.border,
                      color: Colors.text,
                      backgroundColor: Colors.surfaceLight
                    }}
                    placeholder="+40721123456"
                    defaultValue={user.phone}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Adresa
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none"
                    style={{ 
                      borderColor: Colors.border,
                      color: Colors.text,
                      backgroundColor: Colors.surfaceLight
                    }}
                    placeholder="Strada, numărul, sectorul..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Descrierea problemei
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-lg border bg-transparent outline-none h-32"
                    style={{ 
                      borderColor: Colors.border,
                      color: Colors.text,
                      backgroundColor: Colors.surfaceLight
                    }}
                    placeholder="Descrieți detaliat problema..."
                  />
                </div>
              </div>
              <button
                className="mt-4 px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: Colors.secondary,
                  color: Colors.background,
                }}
              >
                Trimite Solicitarea
              </button>
            </div>
          </div>
        )}

        {/* Order History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
                Comenzile Mele
              </h3>
              
              {myRequests.length > 0 ? (
                <div className="space-y-4">
                  {myRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: Colors.surfaceLight,
                        borderColor: Colors.border,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold" style={{ color: Colors.text }}>
                              #{request.id} - {request.service}
                            </h4>
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: request.status === 'completed' ? Colors.success : 
                                                request.status === 'in_progress' ? Colors.warning : Colors.info,
                                color: Colors.primary,
                              }}
                            >
                              {request.status === 'completed' ? 'FINALIZAT' : 
                               request.status === 'in_progress' ? 'ÎN PROGRES' : 'PROGRAMAT'}
                            </span>
                          </div>
                          <p className="flex items-center gap-2 mb-1" style={{ color: Colors.textSecondary }}>
                            <MapPin size={16} />
                            {request.address}
                          </p>
                          <p className="flex items-center gap-2 mb-1" style={{ color: Colors.textSecondary }}>
                            <Calendar size={16} />
                            {request.date}
                          </p>
                          <p className="flex items-center gap-2 mb-1" style={{ color: Colors.textSecondary }}>
                            <User size={16} />
                            Lucrător: {request.worker}
                          </p>
                          <p className="flex items-center gap-2" style={{ color: Colors.textSecondary }}>
                            <CreditCard size={16} />
                            Cost: {request.amount} RON
                          </p>
                        </div>
                      </div>
                      
                      {request.status === 'in_progress' && (
                        <div className="mt-4 flex gap-3">
                          <button
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                            style={{
                              backgroundColor: Colors.info,
                              color: Colors.primary,
                            }}
                          >
                            <Phone size={16} />
                            Contactează Lucrătorul
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar size={48} color={Colors.textMuted} className="mx-auto mb-4" />
                  <p className="text-lg" style={{ color: Colors.textSecondary }}>
                    Nu aveți comenzi încă
                  </p>
                  <p style={{ color: Colors.textMuted }}>
                    Solicitați primul serviciu pentru a începe
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}