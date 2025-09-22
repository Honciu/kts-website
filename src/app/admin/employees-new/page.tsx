'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Save,
  X,
  User,
  Phone,
  Mail,
  Percent,
  Calendar,
  CreditCard,
  Banknote
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  salaryPercentage: number;
  isActive: boolean;
  type: string;
  
  // Weekly stats for current week
  weeklyStats?: {
    totalEarnings: number;
    cashToHandOver: number;
    completedJobs: number;
    totalRevenue: number;
  };
  
  // Debts
  debts?: Debt[];
}

interface Debt {
  id: string;
  employeeId: string;
  amount: number;
  description: string;
  isPaid: boolean;
  createdAt: string;
  paidAt?: string;
}

interface NewEmployee {
  name: string;
  email: string;
  phone: string;
  salaryPercentage: number;
}

interface NewDebt {
  employeeId: string;
  amount: number;
  description: string;
}

export default function NewEmployeesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    name: '',
    email: '',
    phone: '',
    salaryPercentage: 30
  });
  
  const [newDebt, setNewDebt] = useState<NewDebt>({
    employeeId: '',
    amount: 0,
    description: ''
  });

  const loadEmployeesData = async () => {
    setLoading(true);
    try {
      console.log('👥 Loading employees data...');
      
      // Get current week boundaries for stats
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday
      weekEnd.setHours(23, 59, 59, 999);

      // Load employees and their data
      console.log('🔌 Testing API connectivity...');
      const [usersResponse, jobsResponse] = await Promise.all([
        fetch('/api/users').then(res => res.json()),
        fetch(`/api/jobs`).then(res => res.json())
      ]);

      if (usersResponse.success) {
        const allUsers = usersResponse.data;
        console.log('👥 Loaded users:', allUsers);
        const workers = allUsers.filter((user: any) => user.type === 'WORKER');
        console.log('👷 Found workers:', workers);
        
        // Load additional data for each worker
        const employeesWithData = await Promise.all(
          workers.map(async (worker: any) => {
            try {
              // Load debts for this employee
              const debtsResponse = await fetch(`/api/employees/${worker.id}/debts`);
              const debtsData = debtsResponse.ok ? await debtsResponse.json() : { success: false, data: [] };
              
              // Calculate weekly stats from jobs
              let weeklyStats = {
                totalEarnings: 0,
                cashToHandOver: 0,
                completedJobs: 0,
                totalRevenue: 0
              };

              if (jobsResponse.success) {
                const employeeJobs = jobsResponse.data.filter((job: any) => 
                  job.assignedEmployeeId === worker.id &&
                  ['completed', 'pending_approval'].includes(job.status) &&
                  new Date(job.completedAt || job.updatedAt) >= weekStart &&
                  new Date(job.completedAt || job.updatedAt) <= weekEnd
                );

                weeklyStats.completedJobs = employeeJobs.length;
                weeklyStats.totalRevenue = employeeJobs.reduce((total: number, job: any) => {
                  return total + (job.completionData?.totalAmount || 0);
                }, 0);
                weeklyStats.totalEarnings = employeeJobs.reduce((total: number, job: any) => {
                  return total + (job.completionData?.workerCommission || 0);
                }, 0);
                
                // Cash to hand over = cash jobs revenue - worker commission
                weeklyStats.cashToHandOver = employeeJobs.reduce((total: number, job: any) => {
                  const completionData = job.completionData;
                  if (completionData?.paymentMethod === 'cash') {
                    const revenue = completionData.totalAmount || 0;
                    const commission = completionData.workerCommission || 0;
                    return total + Math.max(0, revenue - commission);
                  }
                  return total;
                }, 0);
              }

              return {
                id: worker.id,
                name: worker.name,
                email: worker.email,
                phone: worker.phone,
                salaryPercentage: worker.salaryPercentage || 30,
                isActive: worker.isActive,
                type: worker.type,
                weeklyStats,
                debts: debtsData.success ? debtsData.data : []
              };
            } catch (error) {
              console.error(`Error loading data for employee ${worker.name}:`, error);
              return {
                id: worker.id,
                name: worker.name,
                email: worker.email,
                phone: worker.phone,
                salaryPercentage: worker.salaryPercentage || 30,
                isActive: worker.isActive,
                type: worker.type,
                weeklyStats: { totalEarnings: 0, cashToHandOver: 0, completedJobs: 0, totalRevenue: 0 },
                debts: []
              };
            }
          })
        );

        setEmployees(employeesWithData);
        console.log(`✅ Loaded ${employeesWithData.length} employees with complete data`);
      }

    } catch (error) {
      console.error('❌ Error loading employees:', error);
      alert('Eroare la încărcarea angajaților. Verifică consola pentru detalii.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    try {
      console.log('➕ Adding new employee:', newEmployee);
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEmployee.name,
          email: newEmployee.email,
          phone: newEmployee.phone,
          type: 'WORKER',
          salaryPercentage: newEmployee.salaryPercentage,
          isActive: true,
          password: 'temp123' // Temporary password
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Employee added successfully');
        setShowAddModal(false);
        setNewEmployee({ name: '', email: '', phone: '', salaryPercentage: 30 });
        loadEmployeesData();
      } else {
        console.error('❌ Failed to add employee:', result.error);
        alert('Eroare la adăugarea angajatului: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error adding employee:', error);
      alert('Eroare la adăugarea angajatului!');
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      console.log('✏️ Updating employee:', selectedEmployee);
      
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedEmployee.name,
          email: selectedEmployee.email,
          phone: selectedEmployee.phone,
          salaryPercentage: selectedEmployee.salaryPercentage,
          isActive: selectedEmployee.isActive
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Employee updated successfully');
        setShowEditModal(false);
        setSelectedEmployee(null);
        loadEmployeesData();
      } else {
        console.error('❌ Failed to update employee:', result.error);
        alert('Eroare la actualizarea angajatului: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      alert('Eroare la actualizarea angajatului!');
    }
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Sigur vrei să ștergi angajatul ${employeeName}?`)) return;
    
    try {
      console.log('🗑️ Deleting employee:', employeeId);
      
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Employee deleted successfully');
        loadEmployeesData();
      } else {
        console.error('❌ Failed to delete employee:', result.error);
        alert('Eroare la ștergerea angajatului: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error deleting employee:', error);
      alert('Eroare la ștergerea angajatului!');
    }
  };

  const handleAddDebt = async () => {
    try {
      console.log('💳 Adding debt:', newDebt);
      
      const response = await fetch(`/api/employees/${newDebt.employeeId}/debts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: newDebt.amount,
          description: newDebt.description
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Debt added successfully');
        setShowDebtModal(false);
        setNewDebt({ employeeId: '', amount: 0, description: '' });
        loadEmployeesData();
      } else {
        console.error('❌ Failed to add debt:', result.error);
        alert('Eroare la adăugarea datoriei: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error adding debt:', error);
      alert('Eroare la adăugarea datoriei!');
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      const response = await fetch(`/api/debts/${debtId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Debt deleted successfully');
        loadEmployeesData();
      } else {
        console.error('❌ Failed to delete debt:', result.error);
        alert('Eroare la ștergerea datoriei: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error deleting debt:', error);
      alert('Eroare la ștergerea datoriei!');
    }
  };

  const handleMarkDebtAsPaid = async (debtId: string) => {
    try {
      const response = await fetch(`/api/debts/${debtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: true })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Debt marked as paid');
        loadEmployeesData();
      } else {
        console.error('❌ Failed to mark debt as paid:', result.error);
        alert('Eroare la marcarea ca plătită: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error marking debt as paid:', error);
      alert('Eroare la marcarea ca plătită!');
    }
  };

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    loadEmployeesData();
  }, [user, router]);

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.isActive).length;
  const totalWeeklyEarnings = employees.reduce((total, emp) => total + (emp.weeklyStats?.totalEarnings || 0), 0);
  const totalWeeklyCashToCollect = employees.reduce((total, emp) => total + (emp.weeklyStats?.cashToHandOver || 0), 0);
  const totalUnpaidDebts = employees.reduce((total, emp) => 
    total + (emp.debts?.filter(debt => !debt.isPaid).reduce((sum, debt) => sum + debt.amount, 0) || 0), 0
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.background }}>
      {/* Header */}
      <div className="p-6 border-b" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: Colors.text }}>
              👥 Gestionare Angajați
            </h1>
            <p style={{ color: Colors.textSecondary }}>
              Management complet angajați, salarii, încăsări și datorii
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard-new')}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.info, color: Colors.background }}
            >
              Dashboard
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.success, color: Colors.background }}
            >
              <Plus size={16} />
              Adaugă Angajat
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
            <p style={{ color: Colors.textSecondary }}>Se încarcă angajații...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
                <div className="flex items-center justify-between">
                  <Users size={20} color={Colors.info} />
                  <span className="text-xl font-bold" style={{ color: Colors.text }}>
                    {activeEmployees}/{totalEmployees}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>Angajați Activi</p>
              </div>

              <div className="p-4 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
                <div className="flex items-center justify-between">
                  <DollarSign size={20} color={Colors.success} />
                  <span className="text-xl font-bold" style={{ color: Colors.text }}>
                    {totalWeeklyEarnings.toLocaleString('ro-RO')} RON
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>Salarii Săptămână</p>
              </div>

              <div className="p-4 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
                <div className="flex items-center justify-between">
                  <Banknote size={20} color={Colors.secondary} />
                  <span className="text-xl font-bold" style={{ color: Colors.text }}>
                    {totalWeeklyCashToCollect.toLocaleString('ro-RO')} RON
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>Cash de Colectat</p>
              </div>

              <div className="p-4 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
                <div className="flex items-center justify-between">
                  <AlertCircle size={20} color={Colors.error} />
                  <span className="text-xl font-bold" style={{ color: Colors.text }}>
                    {totalUnpaidDebts.toLocaleString('ro-RO')} RON
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>Datorii Neplatite</p>
              </div>

              <div className="p-4 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
                <div className="flex items-center justify-between">
                  <TrendingUp size={20} color={Colors.warning} />
                  <span className="text-xl font-bold" style={{ color: Colors.text }}>
                    {employees.reduce((total, emp) => total + (emp.weeklyStats?.completedJobs || 0), 0)}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>Lucrări Săptămână</p>
              </div>
            </div>

            {/* Employees List */}
            <div className="space-y-4">
              {employees.map((employee) => (
                <div key={employee.id} className="p-6 rounded-lg border" style={{ 
                  backgroundColor: Colors.surface, 
                  borderColor: employee.isActive ? Colors.border : Colors.error,
                  borderWidth: employee.isActive ? '1px' : '2px'
                }}>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Employee Basic Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: employee.isActive ? Colors.secondary : Colors.error }}
                        >
                          <User size={24} color={Colors.background} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold" style={{ color: Colors.text }}>
                            {employee.name}
                            {!employee.isActive && <span style={{ color: Colors.error }}> (INACTIV)</span>}
                          </h3>
                          <p className="text-sm" style={{ color: Colors.textSecondary }}>
                            Comision: {employee.salaryPercentage}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail size={16} color={Colors.textSecondary} />
                          <span style={{ color: Colors.text }}>{employee.email || 'Fără email'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={16} color={Colors.textSecondary} />
                          <span style={{ color: Colors.text }}>{employee.phone || 'Fără telefon'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Weekly Stats */}
                    <div className="lg:w-80">
                      <h4 className="font-semibold mb-3" style={{ color: Colors.text }}>Săptămâna Curentă:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 rounded border" style={{ borderColor: Colors.border }}>
                          <div className="font-bold" style={{ color: Colors.success }}>
                            {employee.weeklyStats?.totalEarnings.toLocaleString('ro-RO')} RON
                          </div>
                          <div className="text-xs" style={{ color: Colors.textSecondary }}>Comision</div>
                        </div>
                        
                        <div className="text-center p-3 rounded border" style={{ borderColor: Colors.border }}>
                          <div className="font-bold" style={{ color: Colors.secondary }}>
                            {employee.weeklyStats?.cashToHandOver.toLocaleString('ro-RO')} RON
                          </div>
                          <div className="text-xs" style={{ color: Colors.textSecondary }}>De Predat</div>
                        </div>
                        
                        <div className="text-center p-3 rounded border" style={{ borderColor: Colors.border }}>
                          <div className="font-bold" style={{ color: Colors.info }}>
                            {employee.weeklyStats?.completedJobs || 0}
                          </div>
                          <div className="text-xs" style={{ color: Colors.textSecondary }}>Lucrări</div>
                        </div>
                        
                        <div className="text-center p-3 rounded border" style={{ borderColor: Colors.border }}>
                          <div className="font-bold" style={{ color: Colors.warning }}>
                            {employee.weeklyStats?.totalRevenue.toLocaleString('ro-RO')} RON
                          </div>
                          <div className="text-xs" style={{ color: Colors.textSecondary }}>Încasări</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowEditModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                        style={{ backgroundColor: Colors.info, color: Colors.background }}
                      >
                        <Edit size={14} />
                        Editează
                      </button>
                      
                      <button
                        onClick={() => {
                          setNewDebt({ ...newDebt, employeeId: employee.id });
                          setShowDebtModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                        style={{ backgroundColor: Colors.warning, color: Colors.background }}
                      >
                        <Plus size={14} />
                        Datorie
                      </button>
                      
                      <button
                        onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                        style={{ backgroundColor: Colors.error, color: Colors.background }}
                      >
                        <Trash2 size={14} />
                        Șterge
                      </button>
                    </div>
                  </div>

                  {/* Debts Section */}
                  {employee.debts && employee.debts.length > 0 && (
                    <div className="mt-6 pt-6 border-t" style={{ borderColor: Colors.border }}>
                      <h4 className="font-semibold mb-3" style={{ color: Colors.text }}>Datorii:</h4>
                      <div className="space-y-2">
                        {employee.debts.map((debt) => (
                          <div key={debt.id} className="flex items-center justify-between p-3 rounded border" 
                               style={{ 
                                 backgroundColor: debt.isPaid ? Colors.background : Colors.surfaceLight,
                                 borderColor: debt.isPaid ? Colors.success : Colors.error 
                               }}>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-medium" style={{ 
                                  color: debt.isPaid ? Colors.success : Colors.error 
                                }}>
                                  {debt.amount.toLocaleString('ro-RO')} RON
                                </span>
                                <span style={{ color: Colors.text }}>{debt.description}</span>
                                {debt.isPaid && (
                                  <span className="text-xs px-2 py-1 rounded" 
                                        style={{ backgroundColor: Colors.success, color: Colors.background }}>
                                    PLĂTITĂ
                                  </span>
                                )}
                              </div>
                              <div className="text-xs mt-1" style={{ color: Colors.textSecondary }}>
                                {new Date(debt.createdAt).toLocaleDateString('ro-RO')}
                                {debt.paidAt && ` • Plătită: ${new Date(debt.paidAt).toLocaleDateString('ro-RO')}`}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              {!debt.isPaid && (
                                <button
                                  onClick={() => handleMarkDebtAsPaid(debt.id)}
                                  className="px-3 py-1 text-xs rounded transition-colors"
                                  style={{ backgroundColor: Colors.success, color: Colors.background }}
                                >
                                  Plătit
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteDebt(debt.id)}
                                className="px-3 py-1 text-xs rounded transition-colors"
                                style={{ backgroundColor: Colors.error, color: Colors.background }}
                              >
                                Șterge
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{ backgroundColor: Colors.surface }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: Colors.text }}>Adaugă Angajat</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X size={20} color={Colors.textSecondary} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>Nume:</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                  placeholder="Numele angajatului"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>Email:</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                  placeholder="email@exemplu.ro"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>Telefon:</label>
                <input
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                  placeholder="+40700000000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>Procent Salar (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newEmployee.salaryPercentage}
                  onChange={(e) => setNewEmployee({ ...newEmployee, salaryPercentage: parseInt(e.target.value) || 30 })}
                  className="w-full p-3 rounded-lg border"
                  style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors border"
                style={{ borderColor: Colors.border, color: Colors.textSecondary }}
              >
                Anulează
              </button>
              <button
                onClick={handleAddEmployee}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: Colors.success, color: Colors.background }}
                disabled={!newEmployee.name.trim()}
              >
                <Save size={16} />
                Adaugă
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{ backgroundColor: Colors.surface }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: Colors.text }}>Editează Angajat</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X size={20} color={Colors.textSecondary} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>Nume:</label>
                <input
                  type="text"
                  value={selectedEmployee.name}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>Email:</label>
                <input
                  type="email"
                  value={selectedEmployee.email || ''}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, email: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>Telefon:</label>
                <input
                  type="tel"
                  value={selectedEmployee.phone || ''}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, phone: e.target.value })}
                  className="w-full p-3 rounded-lg border"
                  style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>Procent Salar (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selectedEmployee.salaryPercentage}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, salaryPercentage: parseInt(e.target.value) || 30 })}
                  className="w-full p-3 rounded-lg border"
                  style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={selectedEmployee.isActive}
                  onChange={(e) => setSelectedEmployee({ ...selectedEmployee, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                  Angajat activ
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors border"
                style={{ borderColor: Colors.border, color: Colors.textSecondary }}
              >
                Anulează
              </button>
              <button
                onClick={handleUpdateEmployee}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: Colors.info, color: Colors.background }}
              >
                <Save size={16} />
                Salvează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{ backgroundColor: Colors.surface }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: Colors.text }}>Adaugă Datorie</h2>
              <button onClick={() => setShowDebtModal(false)}>
                <X size={20} color={Colors.textSecondary} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>Sumă (RON):</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDebt.amount}
                  onChange={(e) => setNewDebt({ ...newDebt, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 rounded-lg border"
                  style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>Descriere:</label>
                <textarea
                  value={newDebt.description}
                  onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
                  className="w-full p-3 rounded-lg border h-20 resize-none"
                  style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                  placeholder="Motiv pentru datorie..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDebtModal(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors border"
                style={{ borderColor: Colors.border, color: Colors.textSecondary }}
              >
                Anulează
              </button>
              <button
                onClick={handleAddDebt}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: Colors.warning, color: Colors.background }}
                disabled={newDebt.amount <= 0 || !newDebt.description.trim()}
              >
                <Save size={16} />
                Adaugă Datorie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}