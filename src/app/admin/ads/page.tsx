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
  Calendar,
  Target,
  Globe,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Settings,
  Edit3
} from 'lucide-react';

interface DailyAdSpend {
  date: string;
  google: number;
  total: number;
}

interface WeeklyAdData {
  workerId: string;
  workerName: string;
  weekStart: string;
  weekEnd: string;
  dailySpends: DailyAdSpend[];
  weeklyAdvertising: number;
  weeklySalaries: number;
  weeklyMaterials: number;
  jobsGenerated: number;
  revenue: number;
  realProfit: number;
  roi: number;
}

export default function AdminAds() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [weeklyAdData, setWeeklyAdData] = useState<WeeklyAdData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [editingData, setEditingData] = useState<WeeklyAdData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCostsModal, setShowCostsModal] = useState(false);
  const [editingCosts, setEditingCosts] = useState<{workerId: string, salaries: number, materials: number} | null>(null);
  
  // Site-urile business - încărcate din baza de date
  const [workers, setWorkers] = useState<{id: string, name: string}[]>([]);
  
  const ADS_STORAGE_KEY = 'kts_ads_data';
  const COSTS_STORAGE_KEY = 'kts_weekly_costs';
  
  // Helper functions pentru săptămână
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(d.setDate(diff));
  };
  
  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  };
  
  const formatWeekRange = (date: Date) => {
    const start = getWeekStart(date);
    const end = getWeekEnd(date);
    return `${start.getDate()}.${(start.getMonth() + 1).toString().padStart(2, '0')} - ${end.getDate()}.${(end.getMonth() + 1).toString().padStart(2, '0')}.${end.getFullYear()}`;
  };
  
  // Încarcă utilizatorii din baza de date
  const loadWorkersFromDatabase = async () => {
    try {
      console.log('👥 Loading workers from database...');
      
      const response = await fetch('/api/users');
      const userData = await response.json();
      
      if (userData.success) {
        // Filtrăm doar utilizatorii activi de tip WORKER sau cei care au nume relevante pentru ADS
        const adsWorkers = userData.data.filter((user: any) => 
          user.isActive && (
            user.type === 'WORKER' || 
            user.name.toLowerCase().includes('robert') ||
            user.name.toLowerCase().includes('arslan') ||
            user.name.toLowerCase().includes('norbert')
          )
        ).map((user: any) => ({
          id: user.id,
          name: user.name
        }));
        
        console.log('✅ ADS Workers loaded:', adsWorkers);
        setWorkers(adsWorkers);
      } else {
        console.error('❌ Failed to load users:', userData.error);
        // Fallback la utilizatori predefiniti dacă API-ul eșuează
        setWorkers([
          { id: 'demo_robert', name: 'Robert' },
          { id: 'demo_arslan', name: 'Arslan' },
          { id: 'demo_norbert', name: 'Norbert' }
        ]);
      }
    } catch (error) {
      console.error('❌ Error loading workers:', error);
      // Fallback
      setWorkers([
        { id: 'demo_robert', name: 'Robert' },
        { id: 'demo_arslan', name: 'Arslan' },
        { id: 'demo_norbert', name: 'Norbert' }
      ]);
    }
  };

  const loadWeeklyAdData = async () => {
    setLoading(true);
    try {
      console.log('📊 ADS: Loading weekly ad data from DATABASE...');
      
      // Verifică dacă workers sunt încărcați
      if (workers.length === 0) {
        console.log('⚠️ Workers not loaded yet, waiting...');
        setLoading(false);
        return;
      }
      
      console.log('👥 Using workers:', workers);
      
      const weekStart = getWeekStart(selectedWeek);
      const weekEnd = getWeekEnd(selectedWeek);
      
      // Încarcă datele ADS și joburile din API
      const adsResponse = await fetch(`/api/ads?weekStart=${weekStart.toISOString()}`);
      const adsData = await adsResponse.json();
      
      if (!adsData.success) {
        throw new Error(adsData.error || 'Failed to load ads data');
      }
      
      console.log('📈 ADS API Response:', adsData);
      
      const { adsCosts, jobs } = adsData.data;
      
      const weeklyData = workers.map(worker => {
        // Găsește costurile ADS pentru acest worker și săptămână
        const workerAdsCosts = adsCosts.find((cost: any) => cost.userId === worker.id);
        
        // Calculează veniturile din joburile completate
        const workerJobs = jobs.filter((job: any) => job.assignedEmployeeId === worker.id);
        const revenue = workerJobs.reduce((total: number, job: any) => {
          const completionData = typeof job.completionData === 'string' 
            ? JSON.parse(job.completionData) 
            : job.completionData;
          return total + (completionData?.totalAmount || 0);
        }, 0);
        
        // Generează daily spends din datele din baza de date
        const dailySpends = [];
        const dailyGoogleAds = workerAdsCosts?.dailyGoogleAds || [0, 0, 0, 0, 0, 0, 0];
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + i);
          dailySpends.push({
            date: date.toISOString().split('T')[0],
            google: dailyGoogleAds[i] || 0,
            total: dailyGoogleAds[i] || 0
          });
        }
        
        const weeklyAdvertising = workerAdsCosts?.totalGoogleAds || 0;
        const weeklySalaries = workerAdsCosts?.weeklySalaries || 0;
        const weeklyMaterials = workerAdsCosts?.weeklyMaterials || 0;
        
        // Calculul profitului real: Venituri - Salarii - Materiale - Reclamă
        const totalCosts = weeklySalaries + weeklyMaterials + weeklyAdvertising;
        const realProfit = revenue - totalCosts;
        const roi = weeklyAdvertising > 0 ? ((realProfit / weeklyAdvertising) * 100) : 0;
        
        return {
          workerId: worker.id,
          workerName: worker.name,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          dailySpends,
          weeklyAdvertising: Math.round(weeklyAdvertising),
          weeklySalaries: Math.round(weeklySalaries),
          weeklyMaterials: Math.round(weeklyMaterials),
          jobsGenerated: workerJobs.length,
          revenue: Math.round(revenue),
          realProfit: Math.round(realProfit),
          roi: Math.round(roi * 100) / 100
        };
      });
      
      setWeeklyAdData(weeklyData);
      console.log('✅ ADS: Weekly ad data loaded successfully from DATABASE!');
      
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
    
    // Încarcă mai întâi utilizatorii, apoi datele ADS
    const initializeData = async () => {
      await loadWorkersFromDatabase();
      // Așteaptă puțin ca workers să se actualizeze în state
      setTimeout(() => {
        loadWeeklyAdData();
      }, 500);
    };
    
    initializeData();
    
    realApiService.addChangeListener('admin-ads-real', (hasChanges) => {
      if (hasChanges) {
        console.log('📊 ADS: REAL API changes detected - syncing!');
        loadWeeklyAdData();
      }
    });
    
    return () => {
      realApiService.removeChangeListener('admin-ads-real');
    };
  }, [user, router, selectedWeek]);
  
  // Effect pentru încărcarea datelor când workers sunt gata
  useEffect(() => {
    if (workers.length > 0 && user?.type === 'admin') {
      console.log('👥 Workers loaded, loading ADS data...');
      loadWeeklyAdData();
    }
  }, [workers]);
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'prev' ? -7 : 7));
    setSelectedWeek(newWeek);
  };
  
  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };
  
  const editWorkerAdData = (workerData: WeeklyAdData) => {
    setEditingData({ ...workerData });
    setShowEditModal(true);
  };
  
  const updateDailySpend = (dayIndex: number, value: number) => {
    if (!editingData) return;
    
    const newEditingData = { ...editingData };
    newEditingData.dailySpends[dayIndex].google = value;
    newEditingData.dailySpends[dayIndex].total = value;
    
    newEditingData.weeklyAdvertising = newEditingData.dailySpends.reduce((sum, day) => sum + day.total, 0);
    const totalCosts = newEditingData.weeklySalaries + newEditingData.weeklyMaterials + newEditingData.weeklyAdvertising;
    newEditingData.realProfit = newEditingData.revenue - totalCosts;
    newEditingData.roi = newEditingData.weeklyAdvertising > 0 ? ((newEditingData.realProfit / newEditingData.weeklyAdvertising) * 100) : 0;
    
    setEditingData(newEditingData);
  };
  
  const editWeeklyCosts = (workerData: WeeklyAdData) => {
    setEditingCosts({
      workerId: workerData.workerId,
      salaries: workerData.weeklySalaries,
      materials: workerData.weeklyMaterials
    });
    setShowCostsModal(true);
  };
  
  const saveWeeklyCosts = async () => {
    if (!editingCosts) return;
    
    try {
      const weekStart = getWeekStart(selectedWeek);
      const weekEnd = getWeekEnd(selectedWeek);
      
      // Găsește datele curente pentru acest worker
      const currentWorkerData = weeklyAdData.find(w => w.workerId === editingCosts.workerId);
      const dailyGoogleAds = currentWorkerData?.dailySpends.map(d => d.google) || [0, 0, 0, 0, 0, 0, 0];
      
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: editingCosts.workerId,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          dailyGoogleAds,
          weeklySalaries: editingCosts.salaries,
          weeklyMaterials: editingCosts.materials
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save costs');
      }
      
      setShowCostsModal(false);
      setEditingCosts(null);
      
      // Reloading data to reflect changes
      await loadWeeklyAdData();
      
      alert('✅ Costurile săptămânale au fost salvate în baza de date!');
      
    } catch (error) {
      console.error('Error saving weekly costs:', error);
      alert('❌ Eroare la salvarea costurilor. Înceațbă din nou.');
    }
  };
  
  const saveAdData = async () => {
    if (!editingData) return;
    
    try {
      const weekStart = getWeekStart(selectedWeek);
      const weekEnd = getWeekEnd(selectedWeek);
      
      const dailyGoogleAds = editingData.dailySpends.map(d => d.google);
      
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: editingData.workerId,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          dailyGoogleAds,
          weeklySalaries: editingData.weeklySalaries,
          weeklyMaterials: editingData.weeklyMaterials
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save ads data');
      }
      
      setShowEditModal(false);
      setEditingData(null);
      
      // Reload data to reflect changes
      await loadWeeklyAdData();
      
      alert(`✅ Datele Google Ads pentru ${editingData.workerName} au fost salvate în baza de date!`);
      
    } catch (error) {
      console.error('Error saving ads data:', error);
      alert('❌ Eroare la salvarea datelor Google Ads. Înceațbă din nou.');
    }
  };

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }
  
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', { weekday: 'short' }).toUpperCase();
  };

  // Calcule totale pentru profitul real
  const totalAdSpent = weeklyAdData.reduce((total, data) => total + data.weeklyAdvertising, 0);
  const totalSalaries = weeklyAdData.reduce((total, data) => total + data.weeklySalaries, 0);
  const totalMaterials = weeklyAdData.reduce((total, data) => total + data.weeklyMaterials, 0);
  const totalRevenue = weeklyAdData.reduce((total, data) => total + data.revenue, 0);
  const totalRealProfit = weeklyAdData.reduce((total, data) => total + data.realProfit, 0);

  return (
    <AdminLayout currentPage="/admin/ads" pageTitle="Management Profit & Costuri">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
            Management Profit & Costuri - Sincronizat cu Baza de Date
          </h2>
          <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
            Administrează Google Adwords, salarii, materiale și calculează profitul real. Toate datele sunt salvate în baza de date și sincronizate în timp real.
          </p>
        </div>
        
        {/* Week Navigation */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.surfaceLight }}
            >
              <ChevronLeft size={20} color={Colors.textSecondary} />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-bold" style={{ color: Colors.text }}>
                Săptămâna {formatWeekRange(selectedWeek)}
              </h3>
              <button
                onClick={goToCurrentWeek}
                className="text-sm mt-1 px-3 py-1 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: Colors.secondary,
                  color: Colors.background
                }}
              >
                Săptămâna curentă
              </button>
            </div>

            <button
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.surfaceLight }}
            >
              <ChevronRight size={20} color={Colors.textSecondary} />
            </button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
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
              Venituri Totale
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
              <Users size={24} color={Colors.info} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {totalSalaries.toLocaleString('ro-RO')} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Salarii
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
              <Settings size={24} color={Colors.warning} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {totalMaterials.toLocaleString('ro-RO')} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Materiale
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
              <Globe size={24} color={Colors.error} />
              <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                {totalAdSpent.toLocaleString('ro-RO')} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              Google Ads
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
              <BarChart3 size={24} color={totalRealProfit >= 0 ? Colors.success : Colors.error} />
              <span className="text-2xl font-bold" style={{ 
                color: totalRealProfit >= 0 ? Colors.success : Colors.error
              }}>
                {totalRealProfit >= 0 ? '+' : ''}{totalRealProfit.toLocaleString('ro-RO')} RON
              </span>
            </div>
            <p className="font-medium" style={{ color: Colors.textSecondary }}>
              PROFIT REAL
            </p>
          </div>
        </div>

        {/* Sites List */}
        <div
          className="rounded-lg border"
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
            <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
              Site-uri Business ({weeklyAdData.length})
            </h3>
            <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
              Management complet pentru Robert Arslan, Arslan și Norbert
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
              <p style={{ color: Colors.textSecondary }}>Se încarcă datele...</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {weeklyAdData.map((workerData) => (
                <div
                  key={workerData.workerId}
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: workerData.realProfit >= 0 ? Colors.success : Colors.error,
                    borderWidth: '2px'
                  }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: Colors.secondary }}
                      >
                        <Users size={24} color={Colors.background} />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold" style={{ color: Colors.text }}>
                          {workerData.workerName}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm" style={{ color: Colors.textSecondary }}>
                            Google Ads: <span className="font-semibold" style={{ color: Colors.error }}>{workerData.weeklyAdvertising} RON</span>
                          </span>
                          <span className="text-sm" style={{ color: Colors.textSecondary }}>
                            Profit: <span className="font-semibold" style={{ color: workerData.realProfit >= 0 ? Colors.success : Colors.error }}>
                              {workerData.realProfit >= 0 ? '+' : ''}{workerData.realProfit} RON
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => editWeeklyCosts(workerData)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: Colors.warning,
                          color: Colors.background,
                        }}
                      >
                        <Settings size={16} />
                        Salarii & Materiale
                      </button>
                      
                      <button
                        onClick={() => editWorkerAdData(workerData)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: Colors.info,
                          color: Colors.background,
                        }}
                      >
                        <Globe size={16} />
                        Google Ads
                      </button>
                    </div>
                  </div>
                  
                  {/* Daily breakdown - doar Google */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {workerData.dailySpends.map((day, index) => (
                      <div key={day.date} className="p-3 rounded-lg text-center border" style={{
                        backgroundColor: Colors.surface,
                        borderColor: Colors.border
                      }}>
                        <div className="text-xs font-semibold mb-2" style={{ color: Colors.textSecondary }}>
                          {getDayName(day.date)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <Globe size={12} color="#4285F4" />
                            <span className="text-xs font-medium">{day.google}</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: Colors.border }}>
                          <span className="text-sm font-bold" style={{ color: Colors.text }}>
                            {day.total} RON
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Summary stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t" style={{ borderColor: Colors.border }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: Colors.textSecondary }}>Venituri:</p>
                      <p className="text-lg font-bold" style={{ color: Colors.success }}>{workerData.revenue.toLocaleString('ro-RO')} RON</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: Colors.textSecondary }}>Salarii:</p>
                      <p className="text-lg font-bold" style={{ color: Colors.info }}>{workerData.weeklySalaries.toLocaleString('ro-RO')} RON</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: Colors.textSecondary }}>Materiale:</p>
                      <p className="text-lg font-bold" style={{ color: Colors.warning }}>{workerData.weeklyMaterials.toLocaleString('ro-RO')} RON</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: Colors.textSecondary }}>Google Ads:</p>
                      <p className="text-lg font-bold" style={{ color: Colors.error }}>{workerData.weeklyAdvertising.toLocaleString('ro-RO')} RON</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: Colors.textSecondary }}>PROFIT REAL:</p>
                      <p className="text-lg font-bold" style={{ 
                        color: workerData.realProfit >= 0 ? Colors.success : Colors.error
                      }}>
                        {workerData.realProfit >= 0 ? '+' : ''}{workerData.realProfit.toLocaleString('ro-RO')} RON
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Google Ads Modal */}
      {showEditModal && editingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-lg p-6"
            style={{ backgroundColor: Colors.surface }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: Colors.text }}>
                Editare Google Adwords - {editingData.workerName}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: Colors.surfaceLight }}
              >
                <X size={20} color={Colors.textSecondary} />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-4 mb-6">
              {editingData.dailySpends.map((day, dayIndex) => (
                <div key={day.date} className="p-4 rounded-lg border" style={{
                  backgroundColor: Colors.surfaceLight,
                  borderColor: Colors.border
                }}>
                  <div className="text-center mb-4">
                    <h4 className="font-semibold" style={{ color: Colors.text }}>
                      {getDayName(day.date)}
                    </h4>
                    <p className="text-xs" style={{ color: Colors.textSecondary }}>
                      {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Globe size={14} color="#4285F4" />
                        <span className="text-xs font-medium">Google Ads</span>
                      </div>
                      <input
                        type="number"
                        value={day.google}
                        onChange={(e) => updateDailySpend(dayIndex, parseInt(e.target.value) || 0)}
                        className="w-full p-2 text-sm rounded border"
                        style={{
                          backgroundColor: Colors.surface,
                          borderColor: Colors.border,
                          color: Colors.text
                        }}
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="pt-2 mt-2 border-t" style={{ borderColor: Colors.border }}>
                      <div className="text-center">
                        <span className="text-sm font-bold" style={{ color: Colors.text }}>
                          Total: {day.total} RON
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors border"
                style={{
                  borderColor: Colors.border,
                  color: Colors.textSecondary,
                }}
              >
                Anulează
              </button>
              <button
                onClick={saveAdData}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: Colors.success,
                  color: Colors.background,
                }}
              >
                <Save size={16} />
                Salvează Google Ads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Weekly Costs Modal */}
      {showCostsModal && editingCosts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="max-w-md w-full rounded-lg p-6"
            style={{ backgroundColor: Colors.surface }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: Colors.text }}>
                Editare Costuri Săptămânale
              </h3>
              <button
                onClick={() => setShowCostsModal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: Colors.surfaceLight }}
              >
                <X size={20} color={Colors.textSecondary} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Salarii (RON):
                </label>
                <input
                  type="number"
                  value={editingCosts.salaries}
                  onChange={(e) => setEditingCosts(prev => prev ? {...prev, salaries: parseInt(e.target.value) || 0} : null)}
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: Colors.border,
                    color: Colors.text
                  }}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Materiale (RON):
                </label>
                <input
                  type="number"
                  value={editingCosts.materials}
                  onChange={(e) => setEditingCosts(prev => prev ? {...prev, materials: parseInt(e.target.value) || 0} : null)}
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: Colors.border,
                    color: Colors.text
                  }}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCostsModal(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors border"
                style={{
                  borderColor: Colors.border,
                  color: Colors.textSecondary,
                }}
              >
                Anulează
              </button>
              <button
                onClick={saveWeeklyCosts}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: Colors.success,
                  color: Colors.background,
                }}
              >
                <Save size={16} />
                Salvează Costuri
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}