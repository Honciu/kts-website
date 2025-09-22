'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { realApiService } from '@/utils/realApiService';
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
  Settings,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Banknote,
  Building2,
  Calculator,
  UserCheck,
  Plus,
  Edit
} from 'lucide-react';

interface FinancialStats {
  totalRevenue: number;
  cashRevenue: number;
  cardRevenue: number;
  bankTransferRevenue: number;
  tvaAmount: number;
  cardPaymentDetails: {[key: string]: number};
  bankTransferDetails: {[key: string]: number};
  totalSalaries: number;
  totalMaterials: number;
  totalAdsSpend: number;
  cashToCollect: number;
  netProfit: number;
}

interface PartnerEarnings {
  name: string;
  profitShare: number; // Profit / 3
  weeklyCosts: number; // Reclame (pentru formula corectă)
  accountDeduction: number; // Încăsări card/transfer de pe contul lor
  totalEarnings: number; // profitShare + weeklyCosts - accountDeduction
}

interface DashboardData {
  activeJobs: number;
  activeEmployees: number;
  financialStats: FinancialStats;
  partnerEarnings: PartnerEarnings[];
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    activeJobs: 0,
    activeEmployees: 0,
    financialStats: {
      totalRevenue: 0,
      cashRevenue: 0,
      cardRevenue: 0,
      bankTransferRevenue: 0,
      tvaAmount: 0,
      cardPaymentDetails: {},
      bankTransferDetails: {},
      totalSalaries: 0,
      totalMaterials: 0,
      totalAdsSpend: 0,
      cashToCollect: 0,
      netProfit: 0
    },
    partnerEarnings: []
  });
  
  // Call partner initialization when component mounts
  const initializePartners = async () => {
    try {
      const response = await fetch('/api/partners/initialize', { method: 'POST' });
      const result = await response.json();
      console.log('🚀 Partners initialization result:', result);
    } catch (error) {
      console.error('❌ Error initializing partners:', error);
    }
  };
  
  // Initialize partners on first load
  React.useEffect(() => {
    initializePartners();
  }, []);
  const [showPartnerCostsModal, setShowPartnerCostsModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async (forceRefresh = false) => {
    setLoading(true);
    setIsRefreshing(true);
    
    if (forceRefresh) {
      console.log('⚡ COMPREHENSIVE DASHBOARD: FORCE REFRESH TRIGGERED!');
      await realApiService.forceSync();
    }
    
    try {
      console.log('🏠 Comprehensive Dashboard: Loading all financial data...');
      
      // Helper functions for week calculations
      const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
      };
      
      const weekStart = getWeekStart(selectedWeek);
      const weekStartISO = weekStart.toISOString();
      
      console.log(`📅 Loading data for week: ${weekStart.toLocaleDateString('ro-RO')}`);
      
      // Load all data in parallel
      const [jobsResponse, usersResponse, financialResponse, partnersResponse] = await Promise.all([
        realApiService.getJobs(),
        fetch('/api/users').then(res => res.json()),
        fetch(`/api/financial-stats?weekStart=${weekStartISO}`).then(res => res.json()),
        fetch('/api/partners').then(res => res.json())
      ]);
      
      let activeJobs = 0;
      let activeEmployees = 0;
      
      // Calculate active jobs and employees
      if (jobsResponse.success) {
        const allJobs = jobsResponse.data;
        activeJobs = allJobs.filter(job => !['completed', 'cancelled'].includes(job.status)).length;
        
        console.log(`📋 Found ${activeJobs} active jobs`);
      }
      
      if (usersResponse.success) {
        const workers = usersResponse.data.filter((user: any) => user.type === 'WORKER' && user.isActive);
        activeEmployees = workers.length;
        
        console.log(`👥 Found ${activeEmployees} active employees`);
      }
      
      // Get financial stats
      let financialStats: FinancialStats = {
        totalRevenue: 0,
        cashRevenue: 0,
        cardRevenue: 0,
        bankTransferRevenue: 0,
        tvaAmount: 0,
        cardPaymentDetails: { 'KTS': 0, 'Urgente_Deblocari': 0, 'Lacatusul_Priceput': 0 },
        bankTransferDetails: { 'KTS': 0, 'Urgente_Deblocari': 0, 'Lacatusul_Priceput': 0 },
        totalSalaries: 0,
        totalMaterials: 0,
        totalAdsSpend: 0,
        cashToCollect: 0,
        netProfit: 0
      };
      
      if (financialResponse.success) {
        const stats = financialResponse.data;
        financialStats = {
          totalRevenue: stats.totalRevenue || 0,
          cashRevenue: stats.cashRevenue || 0,
          cardRevenue: stats.cardRevenue || 0,
          bankTransferRevenue: stats.bankTransferRevenue || 0,
          tvaAmount: stats.tvaAmount || 0,
          cardPaymentDetails: stats.cardPaymentDetails || { 'KTS': 0, 'Urgente_Deblocari': 0, 'Lacatusul_Priceput': 0 },
          bankTransferDetails: stats.bankTransferDetails || { 'KTS': 0, 'Urgente_Deblocari': 0, 'Lacatusul_Priceput': 0 },
          totalSalaries: stats.totalSalaries || 0,
          totalMaterials: stats.totalMaterials || 0,
          totalAdsSpend: stats.totalAdsSpend || 0,
          cashToCollect: stats.cashToCollect || 0,
          netProfit: stats.netProfit || 0
        };
        
        console.log('💰 Financial Stats Loaded:', financialStats);
      }
      
      // Calculate partner earnings
      let partnerEarnings: PartnerEarnings[] = [];
      
      if (partnersResponse.success && partnersResponse.data.length > 0) {
        const partners = partnersResponse.data;
        console.log(`👥 Found ${partners.length} business partners`);
        
        // Load weekly costs for each partner with correct formula
        const partnerCostsPromises = partners.map(async (partner: any) => {
          const costsResponse = await fetch(`/api/partners/${partner.id}/costs?weekStart=${weekStartISO}`);
          const costsData = await costsResponse.json();
          
          const weeklyCosts = costsData.success ? costsData.data.totalCosts || 0 : 0;
          const profitShare = Math.round(financialStats.netProfit / 3); // Împărțit la 3 asociați
          
          // Calculate earnings with correct formula: PROFIT + RECLAME - Incăsări card/transfer de pe contul lor
          let accountDeduction = 0;
          
          if (partner.name === 'Robert') {
            // Robert: Scade încăsările card + transfer de pe contul KTS
            accountDeduction = (financialStats.cardPaymentDetails?.['KTS'] || 0) + 
                             (financialStats.bankTransferDetails?.['KTS'] || 0);
          } else if (partner.name === 'Arslan') {
            // Arslan: Scade încăsările card + transfer de pe contul Urgente Deblocari
            accountDeduction = (financialStats.cardPaymentDetails?.['Urgente_Deblocari'] || 0) + 
                             (financialStats.bankTransferDetails?.['Urgente_Deblocari'] || 0);
          } else if (partner.name === 'Norbert') {
            // Norbert: Scade încăsările card + transfer de pe contul Lacatusul Priceput
            accountDeduction = (financialStats.cardPaymentDetails?.['Lacatusul_Priceput'] || 0) + 
                             (financialStats.bankTransferDetails?.['Lacatusul_Priceput'] || 0);
          }
          
          const totalEarnings = profitShare + financialStats.totalAdsSpend - accountDeduction;
          
          return {
            name: partner.name,
            profitShare: profitShare,
            weeklyCosts: financialStats.totalAdsSpend, // Reclame
            accountDeduction: accountDeduction,
            totalEarnings: totalEarnings
          };
        });
        
        partnerEarnings = await Promise.all(partnerCostsPromises);
        console.log('👥 Partner Earnings Calculated:', partnerEarnings);
      } else {
        // Default partners if none in database
        const profitShare = Math.round(financialStats.netProfit / 3);
        partnerEarnings = [
          { 
            name: 'Robert', 
            profitShare, 
            weeklyCosts: financialStats.totalAdsSpend,
            accountDeduction: (financialStats.cardPaymentDetails?.['KTS'] || 0) + (financialStats.bankTransferDetails?.['KTS'] || 0),
            totalEarnings: profitShare + financialStats.totalAdsSpend - ((financialStats.cardPaymentDetails?.['KTS'] || 0) + (financialStats.bankTransferDetails?.['KTS'] || 0))
          },
          { 
            name: 'Arslan', 
            profitShare, 
            weeklyCosts: financialStats.totalAdsSpend,
            accountDeduction: (financialStats.cardPaymentDetails?.['Urgente_Deblocari'] || 0) + (financialStats.bankTransferDetails?.['Urgente_Deblocari'] || 0),
            totalEarnings: profitShare + financialStats.totalAdsSpend - ((financialStats.cardPaymentDetails?.['Urgente_Deblocari'] || 0) + (financialStats.bankTransferDetails?.['Urgente_Deblocari'] || 0))
          },
          { 
            name: 'Norbert', 
            profitShare, 
            weeklyCosts: financialStats.totalAdsSpend,
            accountDeduction: (financialStats.cardPaymentDetails?.['Lacatusul_Priceput'] || 0) + (financialStats.bankTransferDetails?.['Lacatusul_Priceput'] || 0),
            totalEarnings: profitShare + financialStats.totalAdsSpend - ((financialStats.cardPaymentDetails?.['Lacatusul_Priceput'] || 0) + (financialStats.bankTransferDetails?.['Lacatusul_Priceput'] || 0))
          }
        ];
      }
      
      setDashboardData({
        activeJobs,
        activeEmployees,
        financialStats,
        partnerEarnings
      });
      
      console.log('✅ Comprehensive Dashboard: All data loaded successfully!');
      
    } catch (error) {
      console.error('❌ Comprehensive Dashboard: Error loading data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setLastRefreshTime(new Date());
    }
  };

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    
    loadDashboardData();
    
    // Add REAL API listener for real-time updates
    realApiService.addChangeListener('admin-comprehensive-dashboard', (hasChanges) => {
      if (hasChanges) {
        console.log('🏠 Comprehensive Dashboard: REAL API changes detected - syncing!');
        loadDashboardData();
      }
    });
    
    return () => {
      console.log('🧹 Comprehensive Dashboard: Cleaning up listeners');
      realApiService.removeChangeListener('admin-comprehensive-dashboard');
    };
  }, [user, router, selectedWeek]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };
  
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

  const isCurrentWeek = () => {
    const currentWeekStart = getWeekStart(new Date());
    const selectedWeekStart = getWeekStart(selectedWeek);
    return currentWeekStart.getTime() === selectedWeekStart.getTime();
  };

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
              {/* Force Refresh Button */}
              <button
                onClick={() => loadDashboardData(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                style={{
                  backgroundColor: isRefreshing ? Colors.warning : Colors.info,
                  color: Colors.background,
                }}
                disabled={isRefreshing}
                title={`Force refresh dashboard data - Last update: ${lastRefreshTime.toLocaleTimeString('ro-RO')}`}
              >
                <BarChart3 size={16} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Actualizez...' : '🔄 Refresh'}
              </button>
              
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
            {/* Header with Week Navigation */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: Colors.text }}>
                  Dashboard Financiar Complet
                </h2>
                <p style={{ color: Colors.textSecondary }}>
                  Vizualizare completă a performanței financiare săptămânale
                </p>
              </div>
              
              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: Colors.surface,
                    borderColor: Colors.border,
                    color: Colors.textSecondary
                  }}
                  title="Săptămâna anterioară"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div 
                  className="px-4 py-2 rounded-lg border text-center min-w-[180px]"
                  style={{
                    backgroundColor: isCurrentWeek() ? Colors.secondary : Colors.surface,
                    borderColor: isCurrentWeek() ? Colors.secondary : Colors.border,
                    color: isCurrentWeek() ? Colors.background : Colors.text
                  }}
                >
                  <div className="font-semibold text-sm">
                    {formatWeekRange(selectedWeek)}
                  </div>
                  {isCurrentWeek() && (
                    <div className="text-xs opacity-90">Săptămâna curentă</div>
                  )}
                </div>
                
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: Colors.surface,
                    borderColor: Colors.border,
                    color: Colors.textSecondary
                  }}
                  title="Săptămâna următoare"
                >
                  <ChevronRight size={20} />
                </button>
                
                {!isCurrentWeek() && (
                  <button
                    onClick={goToCurrentWeek}
                    className="ml-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: Colors.info,
                      color: Colors.background
                    }}
                  >
                    Acum
                  </button>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
                <p className="text-lg font-medium" style={{ color: Colors.text }}>Se încarcă datele financiare...</p>
              </div>
            ) : (
              <>
                {/* Basic Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    className="p-6 rounded-lg border"
                    style={{
                      backgroundColor: Colors.surface,
                      borderColor: Colors.border,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Briefcase size={24} color={Colors.info} />
                      <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                        {dashboardData.activeJobs}
                      </span>
                    </div>
                    <p className="font-medium" style={{ color: Colors.textSecondary }}>
                      Lucrări Active
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
                      <Users size={24} color={Colors.success} />
                      <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                        {dashboardData.activeEmployees}
                      </span>
                    </div>
                    <p className="font-medium" style={{ color: Colors.textSecondary }}>
                      Angajați Activi
                    </p>
                  </div>
                </div>
                
                {/* Financial Overview */}
                <div
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surface,
                    borderColor: Colors.secondary,
                    borderWidth: '2px',
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp size={28} color={Colors.secondary} />
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: Colors.text }}>
                        Prezentare Generală Financiară
                      </h3>
                      <p className="text-sm" style={{ color: Colors.textSecondary }}>
                        Toate sumele sunt pentru săptămâna selectată
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Revenue */}
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: Colors.background }}>
                      <div className="flex items-center justify-center mb-2">
                        <DollarSign size={20} color={Colors.success} />
                      </div>
                      <div className="text-2xl font-bold mb-1" style={{ color: Colors.success }}>
                        {dashboardData.financialStats.totalRevenue.toLocaleString('ro-RO')} RON
                      </div>
                      <div className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                        Sume Încasate Total
                      </div>
                    </div>
                    
                    {/* Cash Revenue */}
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: Colors.background }}>
                      <div className="flex items-center justify-center mb-2">
                        <Banknote size={20} color={Colors.warning} />
                      </div>
                      <div className="text-2xl font-bold mb-1" style={{ color: Colors.warning }}>
                        {dashboardData.financialStats.cashRevenue.toLocaleString('ro-RO')} RON
                      </div>
                      <div className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                        Cash
                      </div>
                    </div>
                    
                    {/* TVA */}
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: Colors.background }}>
                      <div className="flex items-center justify-center mb-2">
                        <Calculator size={20} color={Colors.info} />
                      </div>
                      <div className="text-2xl font-bold mb-1" style={{ color: Colors.info }}>
                        {dashboardData.financialStats.tvaAmount.toLocaleString('ro-RO')} RON
                      </div>
                      <div className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                        TVA
                      </div>
                    </div>
                    
                    {/* Cash to Collect */}
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: Colors.background }}>
                      <div className="flex items-center justify-center mb-2">
                        <UserCheck size={20} color={Colors.secondary} />
                      </div>
                      <div className="text-2xl font-bold mb-1" style={{ color: Colors.secondary }}>
                        {dashboardData.financialStats.cashToCollect.toLocaleString('ro-RO')} RON
                      </div>
                      <div className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                        De Colectat Cash
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment Methods Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card Payments */}
                  <div
                    className="p-6 rounded-lg border"
                    style={{
                      backgroundColor: Colors.surface,
                      borderColor: Colors.border,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <CreditCard size={24} color={Colors.info} />
                      <div>
                        <h4 className="text-lg font-semibold" style={{ color: Colors.text }}>
                          Încăsări prin Card
                        </h4>
                        <p className="text-2xl font-bold" style={{ color: Colors.info }}>
                          {dashboardData.financialStats.cardRevenue.toLocaleString('ro-RO')} RON
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(dashboardData.financialStats.cardPaymentDetails).map(([account, amount]) => (
                        <div key={account} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: Colors.background }}>
                          <span style={{ color: Colors.textSecondary }}>{account.replace('_', ' ')}</span>
                          <span className="font-semibold" style={{ color: Colors.text }}>
                            {amount.toLocaleString('ro-RO')} RON
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Bank Transfers */}
                  <div
                    className="p-6 rounded-lg border"
                    style={{
                      backgroundColor: Colors.surface,
                      borderColor: Colors.border,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Building2 size={24} color={Colors.success} />
                      <div>
                        <h4 className="text-lg font-semibold" style={{ color: Colors.text }}>
                          Transfer Bancar
                        </h4>
                        <p className="text-2xl font-bold" style={{ color: Colors.success }}>
                          {dashboardData.financialStats.bankTransferRevenue.toLocaleString('ro-RO')} RON
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(dashboardData.financialStats.bankTransferDetails).map(([account, amount]) => (
                        <div key={account} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: Colors.background }}>
                          <span style={{ color: Colors.textSecondary }}>{account.replace('_', ' ')}</span>
                          <span className="font-semibold" style={{ color: Colors.text }}>
                            {amount.toLocaleString('ro-RO')} RON
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Costs and Profit */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div
                    className="p-6 rounded-lg border text-center"
                    style={{
                      backgroundColor: Colors.surface,
                      borderColor: Colors.border,
                    }}
                  >
                    <div className="text-2xl font-bold mb-2" style={{ color: Colors.warning }}>
                      {dashboardData.financialStats.totalSalaries.toLocaleString('ro-RO')} RON
                    </div>
                    <p className="font-medium" style={{ color: Colors.textSecondary }}>
                      Salarii Totale
                    </p>
                  </div>
                  
                  <div
                    className="p-6 rounded-lg border text-center"
                    style={{
                      backgroundColor: Colors.surface,
                      borderColor: Colors.border,
                    }}
                  >
                    <div className="text-2xl font-bold mb-2" style={{ color: Colors.info }}>
                      {dashboardData.financialStats.totalMaterials.toLocaleString('ro-RO')} RON
                    </div>
                    <p className="font-medium" style={{ color: Colors.textSecondary }}>
                      Materiale
                    </p>
                  </div>
                  
                  <div
                    className="p-6 rounded-lg border text-center"
                    style={{
                      backgroundColor: Colors.surface,
                      borderColor: Colors.border,
                    }}
                  >
                    <div className="text-2xl font-bold mb-2" style={{ color: Colors.error }}>
                      {dashboardData.financialStats.totalAdsSpend.toLocaleString('ro-RO')} RON
                    </div>
                    <p className="font-medium" style={{ color: Colors.textSecondary }}>
                      Costuri Reclame
                    </p>
                  </div>
                  
                  <div
                    className="p-6 rounded-lg border text-center"
                    style={{
                      backgroundColor: Colors.secondary,
                      borderColor: Colors.secondary,
                    }}
                  >
                    <div className="text-2xl font-bold mb-2" style={{ color: Colors.background }}>
                      {dashboardData.financialStats.netProfit.toLocaleString('ro-RO')} RON
                    </div>
                    <p className="font-medium" style={{ color: Colors.background }}>
                      ✨ PROFIT NET
                    </p>
                  </div>
                </div>
                
                {/* Partner Earnings */}
                <div
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surface,
                    borderColor: Colors.border,
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Users size={24} color={Colors.secondary} />
                      <h3 className="text-xl font-bold" style={{ color: Colors.text }}>
                        Câștiguri Asociați
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowPartnerCostsModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: Colors.secondary,
                        color: Colors.background
                      }}
                    >
                      <Edit size={16} />
                      Gestionează Costurile
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dashboardData.partnerEarnings.map((partner, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border"
                        style={{ backgroundColor: Colors.background, borderColor: Colors.border }}
                      >
                        <div className="text-center">
                          <h4 className="text-lg font-semibold mb-3" style={{ color: Colors.text }}>
                            {partner.name}
                          </h4>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span style={{ color: Colors.textSecondary }}>Profit (1/3):</span>
                              <span style={{ color: Colors.success }}>+{partner.profitShare.toLocaleString('ro-RO')} RON</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ color: Colors.textSecondary }}>Reclame:</span>
                              <span style={{ color: Colors.success }}>+{partner.weeklyCosts.toLocaleString('ro-RO')} RON</span>
                            </div>
                            <div className="flex justify-between text-sm">
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
              </>
            )}
          </div>
          
          {/* Partner Costs Management Modal - Placeholder for future implementation */}
          {showPartnerCostsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div 
                className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                style={{ backgroundColor: Colors.surface }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold" style={{ color: Colors.text }}>
                    Gestionare Costuri Asociați
                  </h2>
                  <button
                    onClick={() => setShowPartnerCostsModal(false)}
                    className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                    style={{ backgroundColor: Colors.surfaceLight }}
                  >
                    <X size={20} color={Colors.textSecondary} />
                  </button>
                </div>
                
                <div className="text-center py-8">
                  <Calendar size={48} color={Colors.textSecondary} className="mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2" style={{ color: Colors.text }}>
                    Modul de Gestionare în Dezvoltare
                  </p>
                  <p style={{ color: Colors.textSecondary }}>
                    Aici veți putea gestiona costurile zilnice pentru fiecare asociat (Robert, Arslan, Norbert) și site-urile lor.
                  </p>
                  <p className="mt-4 text-sm" style={{ color: Colors.textMuted }}>
                    Săptămâna selectată: {formatWeekRange(selectedWeek)}
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowPartnerCostsModal(false)}
                    className="px-6 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: Colors.secondary,
                      color: Colors.background
                    }}
                  >
                    Închide
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
