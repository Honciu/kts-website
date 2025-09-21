'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { locationService, type WorkerLocation } from '@/utils/locationService';
import { 
  MapPin,
  User,
  Clock,
  Battery,
  Wifi,
  WifiOff,
  Phone,
  Navigation,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  Activity,
  Briefcase
} from 'lucide-react';

export default function AdminWorkerLocations() {
  const { user } = useAuth();
  const router = useRouter();

  const [workerLocations, setWorkerLocations] = useState<WorkerLocation[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerLocation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
    } else {
      loadWorkerLocations();
    }
  }, [user, router]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadWorkerLocations();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadWorkerLocations = async () => {
    try {
      setIsRefreshing(true);
      
      // Simulează delay de loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // În aplicația reală aici ar fi un API call
      // const locations = await api.getWorkerLocations();
      const locations = locationService.getMockWorkerLocations();
      
      setWorkerLocations(locations);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Eroare la încărcarea locațiilor:', error);
      alert('Eroare la încărcarea locațiilor lucrătorilor');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: WorkerLocation['status']) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'on_job': return Colors.warning;
      case 'inactive': return Colors.textMuted;
      default: return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: WorkerLocation['status']) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'on_job': return <Briefcase size={16} />;
      case 'inactive': return <WifiOff size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getStatusText = (status: WorkerLocation['status']) => {
    switch (status) {
      case 'active': return 'Disponibil';
      case 'on_job': return 'Pe job';
      case 'inactive': return 'Inactiv';
      default: return status;
    }
  };

  const getTimeSinceUpdate = (lastUpdated: string): string => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'acum';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}min`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} zile`;
  };

  const openInGoogleMaps = (lat: number, lng: number, workerName: string) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}&t=m&z=15`;
    window.open(url, '_blank');
    alert(`📍 Deschidere Google Maps pentru locația lui ${workerName}`);
  };

  const getBatteryColor = (level?: number): string => {
    if (!level) return Colors.textMuted;
    if (level > 50) return Colors.success;
    if (level > 20) return Colors.warning;
    return Colors.error;
  };

  const getBatteryIcon = (level?: number) => {
    if (!level) return <Battery size={16} />;
    return <Battery size={16} />;
  };

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const activeWorkers = workerLocations.filter(w => w.status === 'active').length;
  const workersOnJob = workerLocations.filter(w => w.status === 'on_job').length;
  const inactiveWorkers = workerLocations.filter(w => w.status === 'inactive').length;

  return (
    <AdminLayout currentPage="/admin/worker-locations" pageTitle="Locații Lucrători">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
              Locații Lucrători în Timp Real
            </h2>
            <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
              Monitorizare live location pentru toți lucrătorii activi
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                autoRefresh ? 'bg-opacity-100' : 'bg-opacity-50'
              }`}
              style={{
                backgroundColor: autoRefresh ? Colors.success : Colors.surfaceLight,
                color: autoRefresh ? Colors.primary : Colors.textSecondary
              }}
            >
              <Activity size={16} className="inline mr-2" />
              Auto Refresh
            </button>
            
            <button
              onClick={loadWorkerLocations}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: Colors.secondary,
                color: Colors.background,
                opacity: isRefreshing ? 0.7 : 1
              }}
            >
              <RefreshCw size={16} className={`inline mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizează
            </button>
          </div>
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
              <CheckCircle size={24} color={Colors.success} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {activeWorkers}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Disponibili
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
              <Briefcase size={24} color={Colors.warning} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {workersOnJob}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Pe Joburi
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
              <WifiOff size={24} color={Colors.textMuted} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {inactiveWorkers}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Inactivi
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
              <Clock size={24} color={Colors.info} />
              <span className="text-sm font-bold" style={{ color: Colors.text }}>
                {lastRefresh.toLocaleTimeString('ro-RO')}
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Ultima Actualizare
            </p>
          </div>
        </div>

        {/* Workers Location List */}
        <div
          className="rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
            <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
              Lucrători Activi ({workerLocations.length})
            </h3>
          </div>

          {workerLocations.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin size={48} color={Colors.textMuted} className="mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                Nu există locații disponibile
              </h3>
              <p style={{ color: Colors.textSecondary }}>
                Nu sunt lucrători cu tracking activ în acest moment.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: Colors.border }}>
              {workerLocations.map((worker) => (
                <div key={worker.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-lg" style={{ color: Colors.text }}>
                          {worker.workerName}
                        </h4>
                        <div
                          className="flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: getStatusColor(worker.status),
                            color: Colors.primary,
                          }}
                        >
                          {getStatusIcon(worker.status)}
                          {getStatusText(worker.status)}
                        </div>
                        {worker.currentJobId && (
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: Colors.info,
                              color: Colors.primary,
                            }}
                          >
                            Job #{worker.currentJobId}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                            <MapPin size={16} />
                            <span className="font-medium">Coordonate:</span>
                            {worker.latitude.toFixed(6)}, {worker.longitude.toFixed(6)}
                          </p>
                          <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                            <Wifi size={16} />
                            <span className="font-medium">Acuratețe:</span>
                            {Math.round(worker.accuracy)}m
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                            <Clock size={16} />
                            <span className="font-medium">Ultima actualizare:</span>
                            {getTimeSinceUpdate(worker.lastUpdated)}
                          </p>
                          {worker.batteryLevel && (
                            <p className="flex items-center gap-2 text-sm" style={{ color: Colors.textSecondary }}>
                              <span style={{ color: getBatteryColor(worker.batteryLevel) }}>
                                {getBatteryIcon(worker.batteryLevel)}
                              </span>
                              <span className="font-medium">Baterie:</span>
                              <span style={{ color: getBatteryColor(worker.batteryLevel) }}>
                                {worker.batteryLevel}%
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm" style={{ color: Colors.textMuted }}>
                        <Activity size={16} />
                        Ultimul ping: {new Date(worker.lastUpdated).toLocaleString('ro-RO')}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={() => setSelectedWorker(worker)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: Colors.info,
                          color: Colors.primary,
                        }}
                      >
                        <Eye size={16} />
                        Detalii
                      </button>

                      <button
                        onClick={() => openInGoogleMaps(worker.latitude, worker.longitude, worker.workerName)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: Colors.secondary,
                          color: Colors.background,
                        }}
                      >
                        <Navigation size={16} />
                        Hartă
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Worker Details Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg"
            style={{ backgroundColor: Colors.surface }}
          >
            <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                  Detalii Locație - {selectedWorker.workerName}
                </h3>
                <button
                  onClick={() => setSelectedWorker(null)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: Colors.surfaceLight }}
                >
                  ❌
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: getStatusColor(selectedWorker.status),
                    color: Colors.primary,
                  }}
                >
                  {getStatusIcon(selectedWorker.status)}
                  {getStatusText(selectedWorker.status)}
                </div>
                {selectedWorker.currentJobId && (
                  <span
                    className="px-3 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: Colors.info,
                      color: Colors.primary,
                    }}
                  >
                    Lucrează la Job #{selectedWorker.currentJobId}
                  </span>
                )}
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                    Coordonate GPS
                  </h4>
                  <p style={{ color: Colors.textSecondary }}>
                    Lat: {selectedWorker.latitude.toFixed(6)}
                  </p>
                  <p style={{ color: Colors.textSecondary }}>
                    Lng: {selectedWorker.longitude.toFixed(6)}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                    Acuratețe & Baterie
                  </h4>
                  <p style={{ color: Colors.textSecondary }}>
                    Acuratețe: ±{Math.round(selectedWorker.accuracy)}m
                  </p>
                  {selectedWorker.batteryLevel && (
                    <p style={{ color: getBatteryColor(selectedWorker.batteryLevel) }}>
                      Baterie: {selectedWorker.batteryLevel}%
                    </p>
                  )}
                </div>
              </div>

              {/* Timing */}
              <div>
                <h4 className="font-semibold mb-2" style={{ color: Colors.text }}>
                  Informații Actualizare
                </h4>
                <p style={{ color: Colors.textSecondary }}>
                  Ultima actualizare: {new Date(selectedWorker.lastUpdated).toLocaleString('ro-RO')}
                </p>
                <p style={{ color: Colors.textSecondary }}>
                  Acum: {getTimeSinceUpdate(selectedWorker.lastUpdated)}
                </p>
              </div>

              {/* Map Preview */}
              <div className="p-4 rounded-lg border text-center" style={{ 
                backgroundColor: Colors.surfaceLight,
                borderColor: Colors.border 
              }}>
                <MapPin size={48} color={Colors.secondary} className="mx-auto mb-2" />
                <p style={{ color: Colors.text }}>
                  Previzualizare hartă va fi disponibilă aici
                </p>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
                  Pentru implementare completă se poate integra Google Maps API
                </p>
              </div>
            </div>

            <div className="p-6 border-t" style={{ borderColor: Colors.border }}>
              <div className="flex gap-4">
                <button
                  onClick={() => openInGoogleMaps(selectedWorker.latitude, selectedWorker.longitude, selectedWorker.workerName)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: Colors.secondary,
                    color: Colors.background,
                  }}
                >
                  <Navigation size={16} />
                  Deschide în Google Maps
                </button>

                <button
                  onClick={() => {
                    const coords = `${selectedWorker.latitude.toFixed(6)}, ${selectedWorker.longitude.toFixed(6)}`;
                    navigator.clipboard.writeText(coords);
                    alert('📋 Coordonatele au fost copiate în clipboard!');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border"
                  style={{
                    borderColor: Colors.secondary,
                    color: Colors.secondary,
                  }}
                >
                  📋 Copiază Coordonate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}