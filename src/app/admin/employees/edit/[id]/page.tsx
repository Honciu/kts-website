'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { 
  User,
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

export default function EditEmployee() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    salaryPercentage: 0,
    password: '',
    confirmPassword: '',
    isActive: true,
    isOnDuty: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employee, setEmployee] = useState<typeof employees[0] | null>(null);

  // Mock data - în aplicația reală aceasta ar veni de la API
  const employees = [
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
  ];

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }

    // Load employee data
    const foundEmployee = employees.find(emp => emp.id === employeeId);
    if (foundEmployee) {
      setEmployee(foundEmployee);
      setFormData({
        name: foundEmployee.name,
        username: foundEmployee.username,
        phone: foundEmployee.phone,
        email: foundEmployee.email,
        salaryPercentage: foundEmployee.salaryPercentage,
        password: '',
        confirmPassword: '',
        isActive: foundEmployee.isActive,
        isOnDuty: foundEmployee.isOnDuty
      });
    } else {
      alert('Angajatul nu a fost găsit!');
      router.push('/admin/employees');
    }
  }, [user, router, employeeId]);

  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <AdminLayout currentPage="/admin/employees" pageTitle="Editare Angajat">
        <div className="text-center py-8">
          <AlertCircle size={48} color={Colors.textMuted} className="mx-auto mb-4" />
          <p style={{ color: Colors.textSecondary }}>Se încarcă datele angajatului...</p>
        </div>
      </AdminLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.username || !formData.phone || !formData.email) {
      alert('Te rog completează toate câmpurile obligatorii.');
      return;
    }

    if (formData.salaryPercentage < 0 || formData.salaryPercentage > 100) {
      alert('Procentul de comision trebuie să fie între 0 și 100.');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Parolele nu se potrivesc!');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      alert('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update employee data (in real app this would be API call)
      // const updatedEmployee = { ...employee, ...formData };

      // If password was changed
      if (formData.password) {
        // În aplicația reală, parola ar fi hash-uită
        alert(`Parola pentru ${formData.name} a fost actualizată cu succes!`);
      }

      alert('Datele angajatului au fost actualizate cu succes!');
      router.push('/admin/employees');
      
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('A apărut o eroare. Te rog încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout currentPage="/admin/employees" pageTitle="Editare Angajat">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.surfaceLight }}
            >
              <ArrowLeft size={20} color={Colors.textSecondary} />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: Colors.text }}>
                Editare Angajat: {employee.name}
              </h2>
              <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
                Modifică informațiile angajatului și setările de cont
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
              <User size={20} />
              Informații Personale
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Nume complet *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                  placeholder="Ex: Ion Popescu"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                  placeholder="Ex: ion.popescu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Număr telefon *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                  placeholder="Ex: +40721123456"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                  placeholder="Ex: ion@lacatus.ro"
                  required
                />
              </div>
            </div>
          </div>

          {/* Work Settings */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
              <DollarSign size={20} />
              Setări de Lucru
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Procent comision (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.salaryPercentage}
                  onChange={(e) => setFormData(prev => ({...prev, salaryPercentage: parseFloat(e.target.value) || 0}))}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                  placeholder="Ex: 30"
                  required
                />
                <p className="text-xs mt-1" style={{ color: Colors.textMuted }}>
                  Între 0% și 100%
                </p>
              </div>
            </div>

            {/* Status Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.checked}))}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                  Cont activ (poate să se conecteze)
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isOnDuty"
                  checked={formData.isOnDuty}
                  onChange={(e) => setFormData(prev => ({...prev, isOnDuty: e.target.checked}))}
                  className="w-4 h-4"
                />
                <label htmlFor="isOnDuty" className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                  În serviciu (disponibil pentru lucrări)
                </label>
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
              <Lock size={20} />
              Schimbare Parolă
            </h3>
            
            <p className="text-sm mb-4" style={{ color: Colors.textSecondary }}>
              Lasă câmpurile goale dacă nu dorești să schimbi parola
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Parolă nouă
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                    className="w-full px-4 py-3 pr-12 rounded-lg border bg-transparent text-sm md:text-base"
                    style={{ 
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                    placeholder="Minim 6 caractere"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={Colors.textSecondary} />
                    ) : (
                      <Eye size={18} color={Colors.textSecondary} />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Confirmă parola
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                    className="w-full px-4 py-3 pr-12 rounded-lg border bg-transparent text-sm md:text-base"
                    style={{ 
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                    placeholder="Repetă parola"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color={Colors.textSecondary} />
                    ) : (
                      <Eye size={18} color={Colors.textSecondary} />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="mt-2 text-sm flex items-center gap-2" style={{ color: Colors.error }}>
                <AlertCircle size={16} />
                Parolele nu se potrivesc
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors border"
              style={{
                borderColor: Colors.border,
                color: Colors.textSecondary,
                backgroundColor: 'transparent'
              }}
            >
              Anulează
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: Colors.secondary,
                color: Colors.background,
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: Colors.background }}></div>
                  <span>Se salvează...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Salvează Modificările</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}