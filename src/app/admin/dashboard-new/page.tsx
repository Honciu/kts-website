'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { realApiService } from '@/utils/realApiService';
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  CreditCard,
  Banknote,
  Building2,
  Calculator
} from 'lucide-react';

interface DashboardData {
  // Basic counts
  activeJobs: number;
  completedJobs: number;
  totalEmployees: number;
  activeEmployees: number;
  
  // Financial data for current week
  weeklyStats: {
    totalRevenue: number;
    cashRevenue: number;
    cardRevenue: number;
    bankTransferRevenue: number;
    tvaAmount: number;
    totalSalaries: number;
    totalMaterials: number;
    totalAdsSpend: number;
    cashToCollect: number;
    netProfit: number;
    
    // Card/Bank details per account
    cardDetails: {[key: string]: number};
    bankDetails: {[key: string]: number};
  };
  
  // Partner earnings
  partnerEarnings: {
    name: string;
    profitShare: number;
    adsCosts: number;
    accountDeduction: number;
    totalEarnings: number;
  }[];
}

export default function NewAdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    activeJobs: 0,
    completedJobs: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    weeklyStats: {
      totalRevenue: 0,
      cashRevenue: 0,
      cardRevenue: 0,
      bankTransferRevenue: 0,
      tvaAmount: 0,
      totalSalaries: 0,
      totalMaterials: 0,
      totalAdsSpend: 0,
      cashToCollect: 0,
      netProfit: 0,
      cardDetails: { 'KTS': 0, 'Urgente_Deblocari': 0, 'Lacatusul_Priceput': 0 },
      bankDetails: { 'KTS': 0, 'Urgente_Deblocari': 0, 'Lacatusul_Priceput': 0 }
    },
    partnerEarnings: []
  });
  const [loading, setLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Week navigation helpers
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'prev' ? -7 : 7));
    setSelectedWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  const isCurrentWeek = () => {
    const currentWeekStart = getWeekStart(new Date());
    const selectedWeekStart = getWeekStart(selectedWeek);
    return currentWeekStart.getTime() === selectedWeekStart.getTime();
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🏠 Loading simple dashboard data...');
      
      const weekStart = getWeekStart(selectedWeek);
      const weekStartISO = weekStart.toISOString();

      // Load all data in parallel
      const [jobsResponse, usersResponse, financialResponse] = await Promise.all([
        realApiService.getJobs(),
        fetch('/api/users').then(res => res.json()),
        fetch(`/api/financial-stats?weekStart=${weekStartISO}`).then(res => res.json())
      ]);

      let newData: DashboardData = { ...dashboardData };

      // Process jobs data
      if (jobsResponse.success) {
        const allJobs = jobsResponse.data;
        newData.activeJobs = allJobs.filter((job: any) => !['completed', 'cancelled'].includes(job.status)).length;
        newData.completedJobs = allJobs.filter((job: any) => ['completed', 'pending_approval'].includes(job.status)).length;
        
        console.log(`📊 Jobs: ${newData.activeJobs} active, ${newData.completedJobs} completed`);
      }

      // Process users data
      if (usersResponse.success) {
        const allUsers = usersResponse.data;
        const workers = allUsers.filter((user: any) => user.type === 'WORKER');
        newData.totalEmployees = workers.length;
        newData.activeEmployees = workers.filter((user: any) => user.isActive).length;
        
        console.log(`👥 Employees: ${newData.activeEmployees}/${newData.totalEmployees} active`);
      }

      // Process financial data
      if (financialResponse.success) {
        const stats = financialResponse.data;
        newData.weeklyStats = {
          totalRevenue: stats.totalRevenue || 0,
          cashRevenue: stats.cashRevenue || 0,
          cardRevenue: stats.cardRevenue || 0,
          bankTransferRevenue: stats.bankTransferRevenue || 0,
          tvaAmount: stats.tvaAmount || 0,
          totalSalaries: stats.totalSalaries || 0,
          totalMaterials: stats.totalMaterials || 0,
          totalAdsSpend: stats.totalAdsSpend || 0,
          cashToCollect: stats.cashToCollect || 0,
          netProfit: stats.netProfit || 0,
          cardDetails: stats.cardPaymentDetails || { 'KTS': 0, 'Urgente_Deblocari': 0, 'Lacatusul_Priceput': 0 },
          bankDetails: stats.bankTransferDetails || { 'KTS': 0, 'Urgente_Deblocari': 0, 'Lacatusul_Priceput': 0 }
        };

        // Calculate partner earnings
        const profitPerPartner = Math.round(newData.weeklyStats.netProfit / 3);
        newData.partnerEarnings = [
          {
            name: 'Robert',
            profitShare: profitPerPartner,
            adsCosts: newData.weeklyStats.totalAdsSpend,
            accountDeduction: (newData.weeklyStats.cardDetails['KTS'] || 0) + (newData.weeklyStats.bankDetails['KTS'] || 0),
            totalEarnings: profitPerPartner + newData.weeklyStats.totalAdsSpend - ((newData.weeklyStats.cardDetails['KTS'] || 0) + (newData.weeklyStats.bankDetails['KTS'] || 0))
          },
          {
            name: 'Arslan',
            profitShare: profitPerPartner,
            adsCosts: newData.weeklyStats.totalAdsSpend,
            accountDeduction: (newData.weeklyStats.cardDetails['Urgente_Deblocari'] || 0) + (newData.weeklyStats.bankDetails['Urgente_Deblocari'] || 0),
            totalEarnings: profitPerPartner + newData.weeklyStats.totalAdsSpend - ((newData.weeklyStats.cardDetails['Urgente_Deblocari'] || 0) + (newData.weeklyStats.bankDetails['Urgente_Deblocari'] || 0))
          },
          {
            name: 'Norbert',
            profitShare: profitPerPartner,
            adsCosts: newData.weeklyStats.totalAdsSpend,
            accountDeduction: (newData.weeklyStats.cardDetails['Lacatusul_Priceput'] || 0) + (newData.weeklyStats.bankDetails['Lacatusul_Priceput'] || 0),
            totalEarnings: profitPerPartner + newData.weeklyStats.totalAdsSpend - ((newData.weeklyStats.cardDetails['Lacatusul_Priceput'] || 0) + (newData.weeklyStats.bankDetails['Lacatusul_Priceput'] || 0))
          }
        ];

        console.log('💰 Financial data loaded:', newData.weeklyStats);
      }

      setDashboardData(newData);
      setLastRefreshTime(new Date());
      console.log('✅ Simple dashboard data loaded successfully!');

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    loadDashboardData();
  }, [user, router, selectedWeek]);

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.background }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: Colors.text }}>
              🏠 Admin Dashboard
            </h1>
            <p style={{ color: Colors.textSecondary }}>
              Centralizare date financiare și operaționale
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 rounded-lg border transition-colors"
                style={{ backgroundColor: Colors.surfaceLight, borderColor: Colors.border }}
              >
                <ChevronLeft size={16} color={Colors.textSecondary} />
              </button>
              
              <div 
                className="px-3 py-2 rounded-lg border text-center min-w-[140px]"
                style={{
                  backgroundColor: isCurrentWeek() ? Colors.secondary : Colors.surface,
                  borderColor: isCurrentWeek() ? Colors.secondary : Colors.border,
                  color: isCurrentWeek() ? Colors.background : Colors.text
                }}
              >
                <div className="font-semibold text-sm">
                  {formatWeekRange(selectedWeek)}
                </div>
              </div>
              
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 rounded-lg border transition-colors"
                style={{ backgroundColor: Colors.surfaceLight, borderColor: Colors.border }}
              >
                <ChevronRight size={16} color={Colors.textSecondary} />
              </button>
              
              {!isCurrentWeek() && (
                <button
                  onClick={goToCurrentWeek}
                  className="px-3 py-2 text-sm rounded-lg transition-colors"
                  style={{ backgroundColor: Colors.info, color: Colors.background }}
                >
                  Acum
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.secondary, color: Colors.background }}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Actualizează
            </button>

            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/admin/employees-new')}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: Colors.success, color: Colors.background }}
              >
                Angajați
              </button>
              <button
                onClick={() => router.push('/admin/ads-new')}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: Colors.warning, color: Colors.background }}
              >
                Reclame
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
            <p style={{ color: Colors.textSecondary }}>Se încarcă datele...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
                <div className="flex items-center justify-between">
                  <Briefcase size={20} color={Colors.info} />
                  <span className="text-xl font-bold" style={{ color: Colors.text }}>
                    {dashboardData.activeJobs}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>Lucrări Active</p>
              </div>

              <div className="p-4 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
                <div className="flex items-center justify-between">
                  <Briefcase size={20} color={Colors.success} />
                  <span className="text-xl font-bold" style={{ color: Colors.text }}>
                    {dashboardData.completedJobs}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>Lucrări Închise</p>
              </div>

              <div className="p-4 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
                <div className="flex items-center justify-between">
                  <Users size={20} color={Colors.secondary} />
                  <span className="text-xl font-bold" style={{ color: Colors.text }}>
                    {dashboardData.activeEmployees}/{dashboardData.totalEmployees}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>Angajați Activi</p>
              </div>

              <div className="p-4 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
                <div className="flex items-center justify-between">
                  <TrendingUp size={20} color={Colors.success} />
                  <span className="text-xl font-bold" style={{ color: Colors.success }}>
                    {dashboardData.weeklyStats.totalRevenue.toLocaleString('ro-RO')} RON
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>Încăsări Săptămână</p>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="p-6 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.secondary, borderWidth: '2px' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: Colors.text }}>
                💰 Prezentare Financiară - {formatWeekRange(selectedWeek)}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Cash */}
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: Colors.background }}>
                  <Banknote size={24} color={Colors.warning} className="mx-auto mb-2" />
                  <div className="text-2xl font-bold mb-1" style={{ color: Colors.warning }}>
                    {dashboardData.weeklyStats.cashRevenue.toLocaleString('ro-RO')} RON
                  </div>
                  <div className="text-sm" style={{ color: Colors.textSecondary }}>Încăsări Cash</div>
                </div>

                {/* Card */}
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: Colors.background }}>
                  <CreditCard size={24} color={Colors.info} className="mx-auto mb-2" />
                  <div className="text-2xl font-bold mb-1" style={{ color: Colors.info }}>
                    {dashboardData.weeklyStats.cardRevenue.toLocaleString('ro-RO')} RON
                  </div>
                  <div className="text-sm" style={{ color: Colors.textSecondary }}>Încăsări Card</div>
                </div>

                {/* Bank Transfer */}
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: Colors.background }}>
                  <Building2 size={24} color={Colors.success} className="mx-auto mb-2" />
                  <div className="text-2xl font-bold mb-1" style={{ color: Colors.success }}>
                    {dashboardData.weeklyStats.bankTransferRevenue.toLocaleString('ro-RO')} RON
                  </div>
                  <div className="text-sm" style={{ color: Colors.textSecondary }}>Transfer Bancar</div>
                </div>

                {/* TVA */}
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: Colors.background }}>
                  <Calculator size={24} color={Colors.error} className="mx-auto mb-2" />
                  <div className="text-2xl font-bold mb-1" style={{ color: Colors.error }}>
                    {dashboardData.weeklyStats.tvaAmount.toLocaleString('ro-RO')} RON
                  </div>
                  <div className="text-sm" style={{ color: Colors.textSecondary }}>TVA</div>
                </div>
              </div>

              {/* Costs and Profit */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center p-4 border rounded-lg" style={{ borderColor: Colors.border }}>
                  <div className="text-lg font-bold" style={{ color: Colors.warning }}>
                    {dashboardData.weeklyStats.totalSalaries.toLocaleString('ro-RO')} RON
                  </div>
                  <div className="text-sm" style={{ color: Colors.textSecondary }}>Salarii</div>
                </div>

                <div className="text-center p-4 border rounded-lg" style={{ borderColor: Colors.border }}>
                  <div className="text-lg font-bold" style={{ color: Colors.info }}>
                    {dashboardData.weeklyStats.totalMaterials.toLocaleString('ro-RO')} RON
                  </div>
                  <div className="text-sm" style={{ color: Colors.textSecondary }}>Materiale</div>
                </div>

                <div className="text-center p-4 border rounded-lg" style={{ borderColor: Colors.border }}>
                  <div className="text-lg font-bold" style={{ color: Colors.error }}>
                    {dashboardData.weeklyStats.totalAdsSpend.toLocaleString('ro-RO')} RON
                  </div>
                  <div className="text-sm" style={{ color: Colors.textSecondary }}>Reclame</div>
                </div>

                <div className="text-center p-4 border rounded-lg" style={{ borderColor: Colors.border }}>
                  <div className="text-lg font-bold" style={{ color: Colors.secondary }}>
                    {dashboardData.weeklyStats.cashToCollect.toLocaleString('ro-RO')} RON
                  </div>
                  <div className="text-sm" style={{ color: Colors.textSecondary }}>De Colectat</div>
                </div>

                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: Colors.secondary }}>
                  <div className="text-lg font-bold" style={{ color: Colors.background }}>
                    {dashboardData.weeklyStats.netProfit.toLocaleString('ro-RO')} RON
                  </div>
                  <div className="text-sm" style={{ color: Colors.background }}>✨ PROFIT NET</div>
                </div>
              </div>
            </div>

            {/* Partner Earnings */}
            <div className="p-6 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: Colors.text }}>
                👥 Câștiguri Asociați
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardData.partnerEarnings.map((partner, index) => (
                  <div key={index} className="p-4 rounded-lg border" style={{ backgroundColor: Colors.background, borderColor: Colors.border }}>
                    <div className="text-center">
                      <h3 className="text-lg font-bold mb-3" style={{ color: Colors.text }}>
                        {partner.name}
                      </h3>
                      
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color: Colors.textSecondary }}>Profit (1/3):</span>
                          <span style={{ color: Colors.success }}>+{partner.profitShare.toLocaleString('ro-RO')} RON</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: Colors.textSecondary }}>Reclame:</span>
                          <span style={{ color: Colors.success }}>+{partner.adsCosts.toLocaleString('ro-RO')} RON</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: Colors.textSecondary }}>Cont {partner.name}:</span>
                          <span style={{ color: Colors.error }}>-{partner.accountDeduction.toLocaleString('ro-RO')} RON</span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t" style={{ borderColor: Colors.border }}>
                        <div className="text-xl font-bold" style={{ color: Colors.secondary }}>
                          {partner.totalEarnings.toLocaleString('ro-RO')} RON
                        </div>
                        <div className="text-sm" style={{ color: Colors.textSecondary }}>
                          Total de încasat
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Last refresh info */}
            <div className="text-center text-sm" style={{ color: Colors.textMuted }}>
              Ultima actualizare: {lastRefreshTime.toLocaleTimeString('ro-RO')}
            </div>
          </>
        )}
      </div>
    </div>
  );
}