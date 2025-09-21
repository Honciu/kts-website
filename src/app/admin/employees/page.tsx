'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { 
  Users, 
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  User
} from 'lucide-react';

export default function AdminEmployees() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState([
    {
      id: '1',
      name: 'Robert',
      username: 'Robert',
      phone: '+40712345678',
      email: 'robert@lacatus.ro',
      salaryPercentage: 30,
      isActive: true,
      isOnDuty: true
    },
    {
      id: '2', 
      name: 'Demo User',
      username: 'demo',
      phone: '+40721000000',
      email: 'demo@lacatus.ro',
      salaryPercentage: 25,
      isActive: true,
      isOnDuty: false
    },
    {
      id: '3',
      name: 'Lacatus 01',
      username: 'lacatus01', 
      phone: '+40731000000',
      email: 'lacatus01@lacatus.ro',
      salaryPercentage: 28,
      isActive: true,
      isOnDuty: false
    }
  ]);

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

  const toggleEmployeeStatus = (employeeId: string) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === employeeId ? { ...emp, isOnDuty: !emp.isOnDuty } : emp
      )
    );
    
    // Show confirmation message
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      const newStatus = employee.isOnDuty ? 'liber' : 'în serviciu';
      alert(`${employee.name} a fost pus/ă ${newStatus}.`);
    }
  };

  const addEmployee = () => {
    const name = prompt('Numele angajatului:');
    if (!name) return;
    
    const username = prompt('Username-ul angajatului:');
    if (!username) return;
    
    const phone = prompt('Numărul de telefon:');
    if (!phone) return;
    
    const email = prompt('Email-ul angajatului:');
    if (!email) return;
    
    const salaryPercentage = prompt('Procentul de comision (doar numărul, ex: 30):');
    if (!salaryPercentage || isNaN(Number(salaryPercentage))) return;
    
    const newEmployee = {
      id: (Date.now()).toString(),
      name,
      username,
      phone,
      email,
      salaryPercentage: Number(salaryPercentage),
      isActive: true,
      isOnDuty: false
    };
    
    setEmployees(prev => [...prev, newEmployee]);
    alert(`Angajatul ${name} a fost adăugat cu succes!`);
  };

  const editEmployee = (employeeId: string) => {
    router.push(`/admin/employees/edit/${employeeId}`);
  };

  const deleteEmployee = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const confirmDelete = confirm(`Sigur doriți să ștergeți angajatul ${employee.name}?`);
    if (!confirmDelete) return;
    
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    alert(`Angajatul ${employee.name} a fost șters.`);
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
                onClick={addEmployee}
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
                    {employees.length}
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
                    {employees.filter(emp => emp.isOnDuty).length}
                  </span>
                </div>
                <p className="font-medium" style={{ color: Colors.textSecondary }}>
                  În Serviciu
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
                  <Users size={24} color={Colors.warning} />
                  <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                    {employees.filter(emp => !emp.isOnDuty).length}
                  </span>
                </div>
                <p className="font-medium" style={{ color: Colors.textSecondary }}>
                  Liberi
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
                  <DollarSign size={24} color={Colors.secondary} />
                  <span className="text-2xl font-bold" style={{ color: Colors.text }}>
                    27.7%
                  </span>
                </div>
                <p className="font-medium" style={{ color: Colors.textSecondary }}>
                  Comision Mediu
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
                                  backgroundColor: employee.isOnDuty ? Colors.success : Colors.warning,
                                  color: Colors.primary,
                                }}
                              >
                                {employee.isOnDuty ? 'ÎN SERVICIU' : 'LIBER'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                @{employee.username}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone size={14} />
                                {employee.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail size={14} />
                                {employee.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign size={14} />
                                {employee.salaryPercentage}% comision
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => toggleEmployeeStatus(employee.id)}
                            className="px-3 py-2 sm:py-1 rounded-lg font-medium text-xs sm:text-sm transition-colors text-center"
                            style={{
                              backgroundColor: employee.isOnDuty ? Colors.warning : Colors.success,
                              color: Colors.primary,
                            }}
                          >
                            {employee.isOnDuty ? 'Pune pe Liber' : 'Pune în Serviciu'}
                          </button>
                          
                          <div className="flex gap-2 sm:gap-3">
                            <button
                              onClick={() => editEmployee(employee.id)}
                              className="flex-1 sm:flex-initial p-2 rounded-lg transition-colors flex items-center justify-center"
                              style={{ backgroundColor: Colors.info }}
                              title="Editează angajatul"
                            >
                              <Edit size={16} color={Colors.primary} />
                            </button>
                            
                            <button
                              onClick={() => deleteEmployee(employee.id)}
                              className="flex-1 sm:flex-initial p-2 rounded-lg transition-colors flex items-center justify-center"
                              style={{ backgroundColor: Colors.error }}
                              title="Șterge angajatul"
                            >
                              <Trash2 size={16} color={Colors.primary} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
    </AdminLayout>
  );
}