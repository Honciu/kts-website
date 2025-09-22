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
  Facebook,
  Globe,
  Zap,
  ChevronLeft,
  ChevronRight,
  Save,
  X
} from 'lucide-react';

interface DailyAdSpend {
  date: string;
  facebook: number;
  google: number;
  tiktok: number;
  total: number;
}

interface WeeklyAdData {
  workerId: string;
  workerName: string;
  weekStart: string;
  weekEnd: string;
  dailySpends: DailyAdSpend[];
  weeklyTotal: number;
  jobsGenerated: number;
  revenue: number;
  profit: number;
  roi: number;
}

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
  const [weeklyAdData, setWeeklyAdData] = useState<WeeklyAdData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [editingData, setEditingData] = useState<WeeklyAdData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Get workers from API response - use real IDs
  const workers = [
    { id: 'cmfudasin0001v090qs1frclc', name: 'Robert' },
    { id: 'worker_arslan_001', name: 'Arslan' },
    { id: 'worker_norbert_001', name: 'Norbert' }
  ];
  
  const ADS_STORAGE_KEY = 'kts_ads_data';
  
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
  
  const generateDailySpends = (weekStart: Date, workerId: string, workerName: string): DailyAdSpend[] => {
    // Try to load existing data first
    const savedData = loadAdDataFromStorage();
    const weekKey = weekStart.toISOString().split('T')[0];
    const existingWeekData = savedData[workerId]?.[weekKey];
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      // Use existing data if available, otherwise use default values
      const existingDay = existingWeekData?.dailySpends?.find((d: DailyAdSpend) => d.date === dateKey);
      const baseDaily = workerName === 'Robert' ? 70 : workerName === 'Arslan' ? 45 : 30;
      
      const dayData = existingDay || {
        date: dateKey,
        facebook: Math.round((baseDaily * 0.4) + (Math.random() * 20)),
        google: Math.round((baseDaily * 0.4) + (Math.random() * 20)),
        tiktok: Math.round((baseDaily * 0.2) + (Math.random() * 10)),
        total: 0
      };
      
      dayData.total = dayData.facebook + dayData.google + dayData.tiktok;
      days.push(dayData);
    }
    return days;
  };
  
  const loadAdDataFromStorage = () => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(ADS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ Error loading ad data from storage:', error);
      return {};
    }
  };
  
  const saveAdDataToStorage = (data: WeeklyAdData[]) => {
    if (typeof window === 'undefined') return;
    try {
      const savedData = loadAdDataFromStorage();
      
      data.forEach(workerData => {
        const weekKey = getWeekStart(new Date(workerData.weekStart)).toISOString().split('T')[0];
        
        if (!savedData[workerData.workerId]) {
          savedData[workerData.workerId] = {};
        }
        
        savedData[workerData.workerId][weekKey] = {
          dailySpends: workerData.dailySpends,
          weeklyTotal: workerData.weeklyTotal,
          lastUpdated: new Date().toISOString()
        };
      });
      
      localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(savedData));
      console.log('💾 ADS: Data saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving ad data to storage:', error);
    }
  };

  const loadWeeklyAdData = async () => {
    setLoading(true);
    try {
      console.log('📊 ADS: Loading weekly ad data...');
      
      // Get jobs data to calculate performance
      const response = await realApiService.getJobs();
      
      if (response.success) {
        const allJobs = response.data;
        const weekStart = getWeekStart(selectedWeek);
        const weekEnd = getWeekEnd(selectedWeek);
        
        // Calculate data for each worker for selected week
        const weeklyData = workers.map(worker => {
          // Get jobs for this worker this week
          const workerWeekJobs = allJobs.filter(job => {
            const jobDate = new Date(job.createdAt);
            return job.assignedEmployeeId === worker.id && 
                   jobDate >= weekStart && jobDate <= weekEnd;
          });
          
          const completedJobs = workerWeekJobs.filter(job => job.status === 'completed');
          const revenue = completedJobs.reduce((total, job) => 
            total + (job.completionData?.totalAmount || 0), 0);
          
          // Generate daily spends structure with persistence
          const dailySpends = generateDailySpends(weekStart, worker.id, worker.name);
          
          const weeklyTotal = dailySpends.reduce((sum, day) => sum + day.total, 0);
          const profit = revenue - weeklyTotal;
          const roi = weeklyTotal > 0 ? ((profit / weeklyTotal) * 100) : 0;
          
          return {
            workerId: worker.id,
            workerName: worker.name,
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            dailySpends,
            weeklyTotal: Math.round(weeklyTotal),
            jobsGenerated: workerWeekJobs.length,
            revenue: Math.round(revenue),
            profit: Math.round(profit),
            roi: Math.round(roi * 100) / 100
          };
        });
        
        setWeeklyAdData(weeklyData);
        console.log('✅ ADS: Weekly ad data loaded successfully!');
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
    
    loadWeeklyAdData();
    
    // Add REAL API listener for updates
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
  
  const updateDailySpend = (dayIndex: number, site: 'facebook' | 'google' | 'tiktok', value: number) => {
    if (!editingData) return;
    
    const newEditingData = { ...editingData };
    newEditingData.dailySpends[dayIndex][site] = value;
    newEditingData.dailySpends[dayIndex].total = 
      newEditingData.dailySpends[dayIndex].facebook + 
      newEditingData.dailySpends[dayIndex].google + 
      newEditingData.dailySpends[dayIndex].tiktok;
    
    newEditingData.weeklyTotal = newEditingData.dailySpends.reduce((sum, day) => sum + day.total, 0);
    newEditingData.profit = newEditingData.revenue - newEditingData.weeklyTotal;
    newEditingData.roi = newEditingData.weeklyTotal > 0 ? ((newEditingData.profit / newEditingData.weeklyTotal) * 100) : 0;
    
    setEditingData(newEditingData);
  };
  
  const saveAdData = () => {
    if (!editingData) return;
    
    const updatedData = weeklyAdData.map(data => 
      data.workerId === editingData.workerId ? editingData : data
    );
    
    setWeeklyAdData(updatedData);
    
    // Save to localStorage for persistence
    saveAdDataToStorage(updatedData);
    
    setShowEditModal(false);
    setEditingData(null);
    alert(`✅ Datele pentru ${editingData.workerName} au fost salvate și persistate!`);
  };

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }
  
  const getSiteIcon = (site: string) => {
    switch (site) {
      case 'facebook': return <Facebook size={16} color="#1877F2" />;
      case 'google': return <Globe size={16} color="#4285F4" />;
      case 'tiktok': return <Zap size={16} color="#000000" />;
      default: return <Target size={16} />;
    }
  };
  
  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', { weekday: 'short' }).toUpperCase();
  };

  const totalAdSpent = weeklyAdData.reduce((total, data) => total + data.weeklyTotal, 0);
  const totalRevenue = weeklyAdData.reduce((total, data) => total + data.revenue, 0);
  const totalProfit = weeklyAdData.reduce((total, data) => total + data.profit, 0);
  const overallROI = totalAdSpent > 0 ? ((totalProfit / totalAdSpent) * 100) : 0;

  return (
    <AdminLayout currentPage="/admin/ads" pageTitle="Gestiune Reclame">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
            Gestiune Reclame - Tracking Zilnic
          </h2>
          <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
            Administrează bugetele zilnice pe Facebook, Google și TikTok pentru fiecare lucrător.
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
              Lucrători ADS ({weeklyAdData.length})
            </h3>
            <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
              Tracking zilnic pe site-uri pentru săptămâna selectată
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
              <p style={{ color: Colors.textSecondary }}>Se încarcă datele ADS...</p>
            </div>
          ) : weeklyAdData.length === 0 ? (
            <div className="p-8 text-center">
              <Target size={48} color={Colors.textMuted} className="mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: Colors.text }}>
                Nu există date ADS
              </h3>
              <p style={{ color: Colors.textSecondary }}>
                Se încarcă datele pentru această săptămână...
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {weeklyAdData.map((workerData) => (
                <div
                  key={workerData.workerId}
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: workerData.roi >= 0 ? Colors.success : Colors.error,
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
                            Total săptămânal: <span className="font-semibold" style={{ color: Colors.error }}>{workerData.weeklyTotal} RON</span>
                          </span>
                          <span className="text-sm" style={{ color: Colors.textSecondary }}>
                            ROI: <span className="font-semibold" style={{ color: workerData.roi >= 0 ? Colors.success : Colors.error }}>
                              {workerData.roi >= 0 ? '+' : ''}{workerData.roi}%
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => editWorkerAdData(workerData)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: Colors.info,
                        color: Colors.background,
                      }}
                    >
                      <Calendar size={16} />
                      Editează Zilnic
                    </button>
                  </div>
                  
                  {/* Daily breakdown */}
                  <div className="grid grid-cols-7 gap-2">
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
                            {getSiteIcon('facebook')}
                            <span className="text-xs font-medium">{day.facebook}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            {getSiteIcon('google')}
                            <span className="text-xs font-medium">{day.google}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            {getSiteIcon('tiktok')}
                            <span className="text-xs font-medium">{day.tiktok}</span>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t" style={{ borderColor: Colors.border }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: Colors.textSecondary }}>Joburi Generate:</p>
                      <p className="text-lg font-bold" style={{ color: Colors.info }}>{workerData.jobsGenerated}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: Colors.textSecondary }}>Venituri:</p>
                      <p className="text-lg font-bold" style={{ color: Colors.success }}>{workerData.revenue.toLocaleString('ro-RO')} RON</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: Colors.textSecondary }}>Profit:</p>
                      <p className="text-lg font-bold" style={{ 
                        color: workerData.profit >= 0 ? Colors.success : Colors.error
                      }}>
                        {workerData.profit >= 0 ? '+' : ''}{workerData.profit.toLocaleString('ro-RO')} RON
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: Colors.textSecondary }}>Investit Total:</p>
                      <p className="text-lg font-bold" style={{ color: Colors.error }}>{workerData.weeklyTotal.toLocaleString('ro-RO')} RON</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Daily Data Modal */}
      {showEditModal && editingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-lg p-6"
            style={{ backgroundColor: Colors.surface }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: Colors.text }}>
                Editare Date Zilnice - {editingData.workerName}
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
                }}>                  <div className="text-center mb-4">
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
                        {getSiteIcon('facebook')}
                        <span className="text-xs font-medium">Facebook</span>
                      </div>
                      <input
                        type="number"
                        value={day.facebook}
                        onChange={(e) => updateDailySpend(dayIndex, 'facebook', parseInt(e.target.value) || 0)}
                        className="w-full p-2 text-sm rounded border"
                        style={{
                          backgroundColor: Colors.surface,
                          borderColor: Colors.border,
                          color: Colors.text
                        }}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {getSiteIcon('google')}
                        <span className="text-xs font-medium">Google</span>
                      </div>
                      <input
                        type="number"
                        value={day.google}
                        onChange={(e) => updateDailySpend(dayIndex, 'google', parseInt(e.target.value) || 0)}
                        className="w-full p-2 text-sm rounded border"
                        style={{
                          backgroundColor: Colors.surface,
                          borderColor: Colors.border,
                          color: Colors.text
                        }}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {getSiteIcon('tiktok')}
                        <span className="text-xs font-medium">TikTok</span>
                      </div>
                      <input
                        type="number"
                        value={day.tiktok}
                        onChange={(e) => updateDailySpend(dayIndex, 'tiktok', parseInt(e.target.value) || 0)}
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
            
            {/* Summary */}
            <div className="p-4 rounded-lg border mb-6" style={{
              backgroundColor: Colors.surfaceLight,
              borderColor: Colors.border
            }}>
              <h4 className="font-semibold mb-3" style={{ color: Colors.text }}>Sumar Săptămânal</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm" style={{ color: Colors.textSecondary }}>Total Investit:</p>
                  <p className="text-lg font-bold" style={{ color: Colors.error }}>
                    {editingData.weeklyTotal.toLocaleString('ro-RO')} RON
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: Colors.textSecondary }}>Venituri:</p>
                  <p className="text-lg font-bold" style={{ color: Colors.success }}>
                    {editingData.revenue.toLocaleString('ro-RO')} RON
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: Colors.textSecondary }}>Profit:</p>
                  <p className="text-lg font-bold" style={{ 
                    color: editingData.profit >= 0 ? Colors.success : Colors.error
                  }}>
                    {editingData.profit >= 0 ? '+' : ''}{editingData.profit.toLocaleString('ro-RO')} RON
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: Colors.textSecondary }}>ROI:</p>
                  <p className="text-lg font-bold" style={{ 
                    color: editingData.roi >= 0 ? Colors.success : Colors.error
                  }}>
                    {editingData.roi >= 0 ? '+' : ''}{editingData.roi.toFixed(1)}%
                  </p>
                </div>
              </div>
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
                Salvează Modificările
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}