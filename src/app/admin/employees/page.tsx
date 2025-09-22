'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { 
  Users, 
  Plus,
  Trash2,
  Phone,
  Mail,
  User,
  Save,
  X
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalDebt: number;
  unpaidDebts: number;
  completedJobsLast30Days: number;
  totalRevenueLast30Days: number;
}

export default function AdminEmployees() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', phone: '', password: '' });

  // Încarcă toți angajații din baza de date
  const loadEmployees = async () => {
    setLoading(true);
    try {
      console.log('👥 Loading employees from database...');
      const response = await fetch('/api/employees');
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.data);
        console.log('✅ Employees loaded successfully:', data.data.length);
      } else {
        console.error('❌ Error loading employees:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Adaugă un angajat nou
  const addEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
      alert('Numele, email-ul și parola sunt obligatorii!');
      return;
    }

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEmployee)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Angajatul ${newEmployee.name} a fost adăugat cu succes!`);
        setShowAddModal(false);
        setNewEmployee({ name: '', email: '', phone: '', password: '' });
        loadEmployees(); // Reload employees list
      } else {
        alert(`Eroare: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('A apărut o eroare la adăugarea angajatului.');
    }
  };

  // Șterge un angajat
  const deleteEmployee = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const confirmDelete = confirm(`Sigur doriți să ștergeți angajatul ${employee.name}?\n\nNotă: Angajatul va fi dezactivat pentru a păstra integritatea datelor.`);
    if (!confirmDelete) return;
    
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Angajatul ${employee.name} a fost dezactivat.`);
        loadEmployees(); // Reload employees list
      } else {
        alert(`Eroare: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('A apărut o eroare la ștergerea angajatului.');
    }
  };

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    
    loadEmployees();
  }, [user, router]);

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  };

  return (
    <AdminLayout currentPage="/admin/employees" pageTitle="Gestionare Angajați">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
                  Gestionare Angajați
                </h2>
                <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
                  Administrează echipa de lucrători și statusurile lor.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
                style={{
                  backgroundColor: Colors.secondary,
                  color: Colors.background,
                }}
              >
                <Plus size={20} />
                Adăugă Angajat
              </button>
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
                  <Users size={24} color={Colors.info} />
                  <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                    {loading ? '...' : employees.length}
                  </span>
                </div>
                <p className="font-medium" style={{ color: Colors.textSecondary }}>
                  Total Angajați
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
                    {loading ? '...' : employees.filter(emp => emp.isActive).length}
                  </span>
                </div>
                <p className="font-medium" style={{ color: Colors.textSecondary }}>
                  Activi
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
                  <Users size={24} color={Colors.error} />
                  <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                    {loading ? '...' : employees.filter(emp => !emp.isActive).length}
                  </span>
                </div>
                <p className="font-medium" style={{ color: Colors.textSecondary }}>
                  Inactivi
                </p>
              </div>
            </div>

            {/* Employees List */}
            <div
              className="rounded-lg border"
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.border,
              }}
            >
              <div className="p-6 border-b" style={{ borderColor: Colors.border }}>
                <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>
                  Lista Angajați
                </h3>
              </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
                    <p style={{ color: Colors.textSecondary }}>Se încarcă angajații...</p>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} color={Colors.textSecondary} className="mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2" style={{ color: Colors.text }}>Nu există angajați</p>
                    <p style={{ color: Colors.textSecondary }}>Adăugați primul angajat pentru a începe.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="p-4 rounded-lg border"
                        style={{
                          backgroundColor: Colors.surfaceLight,
                          borderColor: Colors.border,
                        }}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: Colors.secondary }}
                            >
                              <User size={24} color={Colors.background} />
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h4 className="font-semibold text-sm md:text-base" style={{ color: Colors.text }}>
                                  {employee.name}
                                </h4>
                                <span
                                  className="px-2 py-1 rounded-full text-xs font-medium w-fit"
                                  style={{
                                    backgroundColor: employee.isActive ? Colors.success : Colors.error,
                                    color: Colors.background,
                                  }}
                                >
                                  {employee.isActive ? 'ACTIV' : 'INACTIV'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                                <span className="flex items-center gap-1">
                                  <Mail size={14} />
                                  {employee.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone size={14} />
                                  {employee.phone || 'Nu are telefon'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deleteEmployee(employee.id)}
                              className="p-2 rounded-lg transition-colors flex items-center justify-center"
                              style={{ backgroundColor: Colors.error }}
                              title="Dezactivează angajatul"
                              disabled={!employee.isActive}
                            >
                              <Trash2 size={16} color={Colors.background} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

      {/* Modal Adăugare Angajat */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="max-w-md w-full rounded-lg p-6"
            style={{ backgroundColor: Colors.surface }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: Colors.text }}>
                Adaugă Angajat Nou
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: Colors.surfaceLight }}
              >
                <X size={20} color={Colors.textSecondary} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Nume complet *
                </label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee(prev => ({...prev, name: e.target.value}))}
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: Colors.border,
                    color: Colors.text
                  }}
                  placeholder="ex: Ion Popescu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee(prev => ({...prev, email: e.target.value}))}
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: Colors.border,
                    color: Colors.text
                  }}
                  placeholder="ion@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Telefon
                </label>
                <input
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee(prev => ({...prev, phone: e.target.value}))}
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: Colors.border,
                    color: Colors.text
                  }}
                  placeholder="+40721234567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Parola inițială *
                </label>
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee(prev => ({...prev, password: e.target.value}))}
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: Colors.surfaceLight,
                    borderColor: Colors.border,
                    color: Colors.text
                  }}
                  placeholder="Parola temporară"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors border"
                style={{
                  borderColor: Colors.border,
                  color: Colors.textSecondary,
                }}
              >
                Anulează
              </button>
              <button
                onClick={addEmployee}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: Colors.success,
                  color: Colors.background,
                }}
              >
                <Save size={16} />
                Adaugă Angajat
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
