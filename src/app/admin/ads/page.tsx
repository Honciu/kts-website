'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { realApiService } from '@/utils/realApiService';
import { 
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Target
} from 'lucide-react';

interface AdCampaign {
  id: string;
  workerName: string;
  workerId: string;
  weekStart: string;
  weekEnd: string;
  adSpent: number;
  jobsGenerated: number;
  revenue: number;
  profit: number;
  roi: number;
  status: 'active' | 'completed' | 'paused';
}

export default function AdminAds() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [adSpent, setAdSpent] = useState('');
  
  const workers = [
    { id: 'cmfudasin0001v090qs1frclc', name: 'Robert' },
    { id: 'worker_arslan_001', name: 'Arslan' },
    { id: 'worker_norbert_001', name: 'Norbert' }
  ];

  const loadAdCampaigns = async () => {
    setLoading(true);
    try {
      console.log('📊 ADS: Loading campaign data...');
      
      // Get jobs data to calculate performance
      const response = await realApiService.getJobs();
      
      if (response.success) {
        const allJobs = response.data;
        
        // Calculate current week campaigns for each worker
        const campaigns = workers.map(worker => {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
          
          // Get jobs for this worker this week
          const workerWeekJobs = allJobs.filter(job => {
            const jobDate = new Date(job.createdAt);
            return job.assignedEmployeeId === worker.id && 
                   jobDate >= weekStart && jobDate <= weekEnd;
          });
          
          const completedJobs = workerWeekJobs.filter(job => job.status === 'completed');
          const revenue = completedJobs.reduce((total, job) => 
            total + (job.completionData?.totalAmount || 0), 0);
          
          // Mock ad spend based on worker performance
          const baseAdSpend = worker.name === 'Robert' ? 500 : worker.name === 'Arslan' ? 300 : 200;
          const adSpent = baseAdSpend + (Math.random() * 100);
          const profit = revenue - adSpent;
          const roi = adSpent > 0 ? ((profit / adSpent) * 100) : 0;
          
          return {
            id: `campaign_${worker.id}_${weekStart.getTime()}`,
            workerName: worker.name,
            workerId: worker.id,
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            adSpent: Math.round(adSpent),
            jobsGenerated: workerWeekJobs.length,
            revenue: Math.round(revenue),
            profit: Math.round(profit),
            roi: Math.round(roi * 100) / 100,
            status: 'active' as const
          };
        });
        
        setAdCampaigns(campaigns);
        console.log('✅ ADS: Campaign data loaded successfully!');
      }
    } catch (error) {
      console.error('❌ ADS: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    
    loadAdCampaigns();
    
    // Add REAL API listener for updates
    realApiService.addChangeListener('admin-ads-real', (hasChanges) => {
      if (hasChanges) {
        console.log('📊 ADS: REAL API changes detected - syncing!');
        loadAdCampaigns();
      }
    });
    
    return () => {
      realApiService.removeChangeListener('admin-ads-real');
    };
  }, [user, router]);

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const createNewCampaign = () => {
    if (!selectedWorker || !adSpent) {
      alert('Vă rog selectați un lucrător și introduceți suma pentru reclaimă!');
      return;
    }
    
    const worker = workers.find(w => w.id === selectedWorker);
    if (!worker) return;
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const newCampaign: AdCampaign = {
      id: `campaign_${selectedWorker}_${Date.now()}`,
      workerName: worker.name,
      workerId: selectedWorker,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      adSpent: parseFloat(adSpent),
      jobsGenerated: 0,
      revenue: 0,
      profit: -parseFloat(adSpent),
      roi: -100,
      status: 'active'
    };
    
    setAdCampaigns(prev => [...prev, newCampaign]);
    setShowCreateModal(false);
    setSelectedWorker('');
    setAdSpent('');
    
    alert(`✅ Campanie nouă creată pentru ${worker.name} cu buget ${adSpent} RON!`);
  };

  const totalAdSpent = adCampaigns.reduce((total, campaign) => total + campaign.adSpent, 0);
  const totalRevenue = adCampaigns.reduce((total, campaign) => total + campaign.revenue, 0);
  const totalProfit = adCampaigns.reduce((total, campaign) => total + campaign.profit, 0);
  const overallROI = totalAdSpent > 0 ? ((totalProfit / totalAdSpent) * 100) : 0;

  return (
    <AdminLayout currentPage="/admin/ads" pageTitle="Gestiune Reclame">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
              Gestiune Reclame
            </h2>
            <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
              Administrează campaniile publicitare pentru Robert, Arslan și Norbert și monitorizează performanța.
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: Colors.secondary,
              color: Colors.background,
            }}
          >
            <Plus size={16} />
            Campanie Nouă
          </button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={24} color={Colors.error} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {totalAdSpent.toLocaleString('ro-RO')} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Total Investit
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
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {totalRevenue.toLocaleString('ro-RO')} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Venituri Generate
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
              <BarChart3 size={24} color={totalProfit >= 0 ? Colors.success : Colors.error} />
              <span className="text-2xl font-bold" style={{ 
                color: totalProfit >= 0 ? Colors.success : Colors.error
              }}>
                {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString('ro-RO')} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Profit/Pierdere
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
              <Target size={24} color={overallROI >= 0 ? Colors.success : Colors.error} />
              <span className="text-2xl font-bold" style={{ 
                color: overallROI >= 0 ? Colors.success : Colors.error
              }}>
                {overallROI >= 0 ? '+' : ''}{overallROI.toFixed(1)}%
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              ROI General
            </p>
          </div>
        </div>

        {/* Campaigns List */}
        <div
          className="rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
            <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
              Campanii Active ({adCampaigns.length})
            </h3>
            <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
              Săptămâna curentă: {new Date().toLocaleDateString('ro-RO', { 
                day: '2-digit', 
                month: '2-digit',
                year: 'numeric'
              })}
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
              <p style={{ color: Colors.textSecondary }}>Se încarcă campaniile...</p>
            </div>
          ) : adCampaigns.length === 0 ? (
            <div className="p-8 text-center">
              <Target size={48} color={Colors.textMuted} className="mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                Nu există campanii active
              </h3>
              <p style={{ color: Colors.textSecondary }}>
                Creați o campanie nouă pentru a începe promovarea serviciilor.
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {adCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 rounded-lg border transition-all hover:shadow-md"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: campaign.roi >= 0 ? Colors.success : Colors.error,
                    borderWidth: '1px'
                  }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: Colors.secondary }}
                        >
                          <Users size={20} color={Colors.background} />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold" style={{ color: Colors.text }}>
                            {campaign.workerName}
                          </h4>
                          <p className="text-sm" style={{ color: Colors.textSecondary }}>
                            Campanie săptămânală
                          </p>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: campaign.status === 'active' ? Colors.success : Colors.warning,
                            color: Colors.primary,
                          }}
                        >
                          {campaign.status === 'active' ? 'ACTIVĂ' : 'PAUZATĂ'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium" style={{ color: Colors.text }}>Investit:</p>
                          <p style={{ color: Colors.error }}>{campaign.adSpent.toLocaleString('ro-RO')} RON</p>
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: Colors.text }}>Joburi:</p>
                          <p style={{ color: Colors.info }}>{campaign.jobsGenerated}</p>
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: Colors.text }}>Venituri:</p>
                          <p style={{ color: Colors.success }}>{campaign.revenue.toLocaleString('ro-RO')} RON</p>
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: Colors.text }}>ROI:</p>
                          <p style={{ 
                            color: campaign.roi >= 0 ? Colors.success : Colors.error,
                            fontWeight: 'bold'
                          }}>
                            {campaign.roi >= 0 ? '+' : ''}{campaign.roi}%
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: Colors.info,
                          color: Colors.background,
                        }}
                      >
                        <Edit size={14} />
                        Editare
                      </button>
                      <button
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border"
                        style={{
                          borderColor: Colors.error,
                          color: Colors.error,
                        }}
                      >
                        <Trash2 size={14} />
                        Șterge
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="max-w-md w-full rounded-lg p-6"
            style={{ backgroundColor: Colors.surface }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                Campanie Nouă
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: Colors.surfaceLight }}
              >
                ❌
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Selectează Lucrătorul
                </label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: Colors.border,
                    color: Colors.text
                  }}
                >
                  <option value="">-- Alege lucrătorul --</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>{worker.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Buget Reclamă (RON)
                </label>
                <input
                  type="number"
                  value={adSpent}
                  onChange={(e) => setAdSpent(e.target.value)}
                  placeholder="ex: 500"
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: Colors.border,
                    color: Colors.text
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors border"
                style={{
                  borderColor: Colors.border,
                  color: Colors.textSecondary,
                }}
              >
                Anulează
              </button>
              <button
                onClick={createNewCampaign}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: Colors.secondary,
                  color: Colors.background,
                }}
              >
                Creează
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}