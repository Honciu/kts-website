'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { 
  CheckCircle,
  X,
  Eye,
  User,
  MapPin,
  DollarSign,
  Calendar,
  Building,
  AlertCircle,
  Camera,
  Phone
} from 'lucide-react';

interface PendingTransfer {
  id: string;
  jobId: string;
  workerName: string;
  clientName: string;
  clientPhone: string;
  address: string;
  serviceName: string;
  totalAmount: number;
  workerCommission: number;
  bankAccount: 'KTS' | 'Urgente_Deblocari' | 'Lacatusul_Priceput';
  workDescription: string;
  photos: string[];
  completedAt: string;
  onlyTravelFee: boolean;
  notes?: string;
}

export default function AdminApprovals() {
  const { user } = useAuth();
  const router = useRouter();

  // Mock data - transferuri în așteptarea aprobării
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([
    {
      id: '1',
      jobId: '1001',
      workerName: 'Robert',
      clientName: 'Ion Popescu',
      clientPhone: '+40721123456',
      address: 'Str. Aviatorilor nr. 15',
      serviceName: 'Deblocare ușă',
      totalAmount: 150,
      workerCommission: 45,
      bankAccount: 'KTS',
      workDescription: 'Am deblocat ușa cu unelte speciale, am verificat mecanismul de închidere și am aplicat lubrifiant pentru a preveni blocarea în viitor.',
      photos: ['/mock-photo-1.jpg', '/mock-photo-2.jpg'],
      completedAt: new Date().toISOString(),
      onlyTravelFee: false,
      notes: 'Client foarte mulțumit, a recomandat serviciile noastre.'
    },
    {
      id: '2',
      jobId: '1002',
      workerName: 'Demo User',
      clientName: 'Maria Ionescu',
      clientPhone: '+40731112233',
      address: 'Bd. Unirii nr. 45',
      serviceName: 'Schimbare yală',
      totalAmount: 80,
      workerCommission: 80,
      bankAccount: 'Urgente_Deblocari',
      workDescription: 'Client nu era acasă la adresa indicată. Am așteptat 30 de minute și am încercat să contactez telefonic.',
      photos: ['/mock-photo-3.jpg'],
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      onlyTravelFee: true
    }
  ]);

  const [selectedTransfer, setSelectedTransfer] = useState<PendingTransfer | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
    }
  }, [user, router]);

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const approveTransfer = async (transferId: string) => {
    const transfer = pendingTransfers.find(t => t.id === transferId);
    if (!transfer) return;

    const confirmed = confirm(
      `Aprobi transferul bancar pentru ${transfer.workerName}?\n\n` +
      `• Suma: ${transfer.totalAmount} RON\n` +
      `• Comision lucrător: ${transfer.workerCommission} RON\n` +
      `• Cont: ${transfer.bankAccount}\n` +
      `• Serviciu: ${transfer.serviceName}`
    );

    if (!confirmed) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPendingTransfers(prev => prev.filter(t => t.id !== transferId));
      
      alert(`✅ Transfer aprobat cu succes!\n\nComisionul de ${transfer.workerCommission} RON a fost adăugat în contul lui ${transfer.workerName}.`);
      
    } catch (error) {
      alert('A apărut o eroare la aprobarea transferului.');
    }
  };

  const rejectTransfer = async (transferId: string) => {
    const transfer = pendingTransfers.find(t => t.id === transferId);
    if (!transfer) return;

    const reason = prompt('Motivul respingerii transferului:');
    if (!reason) return;

    const confirmed = confirm(`Respingi transferul pentru ${transfer.workerName}?\nMotiv: ${reason}`);
    if (!confirmed) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPendingTransfers(prev => prev.filter(t => t.id !== transferId));
      
      alert(`❌ Transfer respins.\n\n${transfer.workerName} va fi notificat cu motivul: "${reason}"`);
      
    } catch (error) {
      alert('A apărut o eroare la respingerea transferului.');
    }
  };

  const viewDetails = (transfer: PendingTransfer) => {
    setSelectedTransfer(transfer);
    setShowModal(true);
  };

  const getBankAccountLabel = (account: string) => {
    switch (account) {
      case 'KTS': return 'KTS - Cont Principal';
      case 'Urgente_Deblocari': return 'Urgențe Deblocări';
      case 'Lacatusul_Priceput': return 'Lăcătușul Priceput';
      default: return account;
    }
  };

  return (
    <AdminLayout currentPage="/admin/approvals" pageTitle="Aprobare Transferuri">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
            Aprobare Transferuri Bancare
          </h2>
          <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
            Transferurile bancare necesită aprobare înainte să apară în câștigurile lucrătorilor.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <AlertCircle size={24} color={Colors.warning} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {pendingTransfers.length}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              În Așteptare
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
              <DollarSign size={24} color={Colors.success} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {pendingTransfers.reduce((sum, t) => sum + t.totalAmount, 0)} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Suma Totală
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
              <User size={24} color={Colors.info} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {pendingTransfers.reduce((sum, t) => sum + t.workerCommission, 0)} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Comisioane Lucrători
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
              <Building size={24} color={Colors.secondary} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                3
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Conturi Bancare
            </p>
          </div>
        </div>

        {/* Pending Transfers List */}
        <div
          className="rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
            <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
              Transferuri în Așteptare ({pendingTransfers.length})
            </h3>
          </div>

          {pendingTransfers.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={48} color={Colors.success} className="mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                Toate transferurile au fost procesate!
              </h3>
              <p style={{ color: Colors.textSecondary }}>
                Nu există transferuri bancare în așteptarea aprobării.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: Colors.border }}>
              {pendingTransfers.map((transfer) => (
                <div key={transfer.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-lg" style={{ color: Colors.text }}>
                          #{transfer.jobId} - {transfer.serviceName}
                        </h4>
                        {transfer.onlyTravelFee && (
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: Colors.warning,
                              color: Colors.primary,
                            }}
                          >
                            DOAR DEPLASARE
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                            <User size={16} />
                            <span className="font-medium">Lucrător:</span> {transfer.workerName}
                          </p>
                          <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                            <User size={16} />
                            <span className="font-medium">Client:</span> {transfer.clientName}
                          </p>
                          <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                            <MapPin size={16} />
                            <span className="font-medium">Adresa:</span> {transfer.address}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                            <DollarSign size={16} />
                            <span className="font-medium">Suma totală:</span> 
                            <span className="font-semibold" style={{ color: Colors.success }}>
                              {transfer.totalAmount} RON
                            </span>
                          </p>
                          <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                            <User size={16} />
                            <span className="font-medium">Comision:</span>
                            <span className="font-semibold" style={{ color: Colors.secondary }}>
                              {transfer.workerCommission} RON
                            </span>
                          </p>
                          <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                            <Building size={16} />
                            <span className="font-medium">Cont:</span> {getBankAccountLabel(transfer.bankAccount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm" style={{ color: Colors.textMuted }}>
                        <Calendar size={16} />
                        Finalizat: {new Date(transfer.completedAt).toLocaleString('ro-RO')}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={() => viewDetails(transfer)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: Colors.info,
                          color: Colors.primary,
                        }}
                      >
                        <Eye size={16} />
                        Vezi Detalii
                      </button>

                      <button
                        onClick={() => approveTransfer(transfer.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: Colors.success,
                          color: Colors.primary,
                        }}
                      >
                        <CheckCircle size={16} />
                        Aprobă
                      </button>

                      <button
                        onClick={() => rejectTransfer(transfer.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border"
                        style={{
                          borderColor: Colors.error,
                          color: Colors.error,
                        }}
                      >
                        <X size={16} />
                        Respinge
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal pentru detalii transfer */}
      {showModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg"
            style={{ backgroundColor: Colors.surface }}
          >
            <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                  Detalii Transfer #{selectedTransfer.jobId}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: Colors.surfaceLight }}
                >
                  <X size={20} color={Colors.textSecondary} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Work Description */}
              <div>
                <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                  {selectedTransfer.onlyTravelFee ? 'Motivul deplasării' : 'Descrierea lucrării'}
                </h4>
                <p className="p-3 rounded-lg text-sm" style={{ 
                  backgroundColor: Colors.surfaceLight,
                  color: Colors.textSecondary 
                }}>
                  {selectedTransfer.workDescription}
                </p>
              </div>

              {selectedTransfer.notes && (
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                    Notițe suplimentare
                  </h4>
                  <p className="p-3 rounded-lg text-sm" style={{ 
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.textSecondary 
                  }}>
                    {selectedTransfer.notes}
                  </p>
                </div>
              )}

              {/* Photos */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: Colors.text }}>
                  <Camera size={18} />
                  Poze cu lucrarea ({selectedTransfer.photos.length})
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedTransfer.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <div 
                        className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: Colors.surfaceLight }}
                      >
                        <Camera size={24} color={Colors.textMuted} />
                        <span className="ml-2 text-sm" style={{ color: Colors.textMuted }}>
                          Poză {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Client */}
              <div className="p-4 rounded-lg border" style={{ 
                backgroundColor: Colors.surfaceLight,
                borderColor: Colors.border 
              }}>
                <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                  Contact Client
                </h4>
                <div className="flex items-center gap-4">
                  <span style={{ color: Colors.textSecondary }}>
                    {selectedTransfer.clientName}
                  </span>
                  <a
                    href={`tel:${selectedTransfer.clientPhone}`}
                    className="flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ color: Colors.info }}
                  >
                    <Phone size={16} />
                    {selectedTransfer.clientPhone}
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 border-t" style={{ borderColor: Colors.border }}>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    approveTransfer(selectedTransfer.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: Colors.success,
                    color: Colors.primary,
                  }}
                >
                  <CheckCircle size={16} />
                  Aprobă Transfer
                </button>

                <button
                  onClick={() => {
                    setShowModal(false);
                    rejectTransfer(selectedTransfer.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border"
                  style={{
                    borderColor: Colors.error,
                    color: Colors.error,
                  }}
                >
                  <X size={16} />
                  Respinge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}