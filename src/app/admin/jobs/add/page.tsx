'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import AdminLayout from '@/components/AdminLayout';
import { jobService, type Job } from '@/utils/jobService';
import { 
  User,
  MapPin,
  Phone,
  Briefcase,
  Clock,
  AlertCircle,
  Save,
  ArrowLeft,
  Users,
  Star
} from 'lucide-react';

export default function AddJob() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    address: '',
    serviceName: '',
    serviceDescription: '',
    estimatedTime: '',
    priority: 'normal' as 'normal' | 'urgent' | 'high',
    assignedEmployeeId: '',
    specialInstructions: ''
  });

  // Available employees (in real app this would come from API)
  const [employees] = useState([
    {
      id: 'worker1',
      name: 'Robert',
      username: 'Robert',
      phone: '+40712345678',
      salaryPercentage: 30,
      isOnDuty: true,
      rating: 4.8,
      completedJobs: 145
    },
    {
      id: 'worker2', 
      name: 'Demo User',
      username: 'demo',
      phone: '+40721000000',
      salaryPercentage: 25,
      isOnDuty: true,
      rating: 4.5,
      completedJobs: 89
    },
    {
      id: 'worker3',
      name: 'Lacatus 01',
      username: 'lacatus01', 
      phone: '+40731000000',
      salaryPercentage: 28,
      isOnDuty: false,
      rating: 4.9,
      completedJobs: 210
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.clientPhone || !formData.address || !formData.serviceName) {
      alert('Te rog completă toate câmpurile obligatorii.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare new job data
      const assignedEmployee = formData.assignedEmployeeId ? 
        employees.find(emp => emp.id === formData.assignedEmployeeId) : null;
      
      const newJobData: Omit<Job, 'id' | 'createdAt'> = {
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        address: formData.address,
        serviceName: formData.serviceName,
        serviceDescription: formData.serviceDescription,
        specialInstructions: formData.specialInstructions,
        assignedEmployeeId: formData.assignedEmployeeId || 'unassigned',
        assignedEmployeeName: assignedEmployee?.name || 'Neatribuit',
        status: formData.assignedEmployeeId ? 'assigned' : 'pending_approval',
        priority: formData.priority
      };

      // Add job through jobService
      const createdJob = jobService.addJob(newJobData);
      
      console.log('✅ Job created successfully:', createdJob);

      // Show success message
      if (assignedEmployee) {
        alert(`✅ Lucrarea #${createdJob.id} a fost creată și atribuită către ${assignedEmployee.name}!\n📱 ${assignedEmployee.name} va primi o notificare.`);
      } else {
        alert(`✅ Lucrarea #${createdJob.id} a fost creată cu succes!\nRămâne în așteptarea atribuirii.`);
      }

      // Redirect back to jobs page
      router.push('/admin/jobs');
      
    } catch (error) {
      console.error('Error creating job:', error);
      alert('A apărut o eroare la crearea lucrării. Te rog încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableEmployees = employees.filter(emp => emp.isOnDuty);

  return (
    <AdminLayout currentPage="/admin/jobs" pageTitle="Adăugare Lucrare Nouă">
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
                Adăugare Lucrare Nouă
              </h2>
              <p className="text-sm md:text-base" style={{ color: Colors.textSecondary }}>
                Completează informațiile pentru noua lucrare
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
              <User size={20} />
              Informații Client
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Nume complet *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({...prev, clientName: e.target.value}))}
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
                  Număr telefon *
                </label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({...prev, clientPhone: e.target.value}))}
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
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                Adresa completă *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                style={{ 
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceLight,
                  color: Colors.text
                }}
                placeholder="Ex: Str. Aviatorilor nr. 15, Sector 1, București"
                required
              />
            </div>
          </div>

          {/* Service Information */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
              <Briefcase size={20} />
              Detalii Serviciu
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Tip serviciu *
                </label>
                <select
                  value={formData.serviceName}
                  onChange={(e) => setFormData(prev => ({...prev, serviceName: e.target.value}))}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                  required
                >
                  <option value="">Selectează serviciul</option>
                  <option value="Deblocare ușă">Deblocare ușă</option>
                  <option value="Schimbare yală">Schimbare yală</option>
                  <option value="Reparație seif">Reparație seif</option>
                  <option value="Copiere chei">Copiere chei</option>
                  <option value="Montare sistem securitate">Montare sistem securitate</option>
                  <option value="Altul">Altul</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Prioritate
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({...prev, priority: e.target.value as 'normal' | 'urgent' | 'high'}))}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                >
                  <option value="normal">Normală</option>
                  <option value="high">Prioritate mare</option>
                  <option value="urgent">Urgentă</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                Descriere detaliată
              </label>
              <textarea
                value={formData.serviceDescription}
                onChange={(e) => setFormData(prev => ({...prev, serviceDescription: e.target.value}))}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base resize-none"
                style={{ 
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceLight,
                  color: Colors.text
                }}
                placeholder="Descriere detaliată a problemei sau cerințelor..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                Instrucțiuni speciale
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({...prev, specialInstructions: e.target.value}))}
                rows={2}
                className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base resize-none"
                style={{ 
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceLight,
                  color: Colors.text
                }}
                placeholder="Ex: Apelează înainte de sosire, bloc cu interfon..."
              />
            </div>
          </div>

          {/* Employee Assignment */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
              <Users size={20} />
              Atribuire Lucrător
            </h3>

            {availableEmployees.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle size={48} color={Colors.textMuted} className="mx-auto mb-4" />
                <p style={{ color: Colors.textSecondary }}>
                  Nu sunt lucrători disponibili în acest moment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="no-assignment"
                    name="employee"
                    value=""
                    checked={formData.assignedEmployeeId === ''}
                    onChange={(e) => setFormData(prev => ({...prev, assignedEmployeeId: e.target.value}))}
                    className="w-4 h-4"
                  />
                  <label htmlFor="no-assignment" className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
                    Nu atribui acum (va rămâne în așteptare)
                  </label>
                </div>

                {availableEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      formData.assignedEmployeeId === employee.id ? 'border-opacity-100' : 'border-opacity-30'
                    }`}
                    style={{
                      backgroundColor: formData.assignedEmployeeId === employee.id ? Colors.surfaceLight : 'transparent',
                      borderColor: formData.assignedEmployeeId === employee.id ? Colors.secondary : Colors.border,
                    }}
                    onClick={() => setFormData(prev => ({...prev, assignedEmployeeId: employee.id}))}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id={`employee-${employee.id}`}
                        name="employee"
                        value={employee.id}
                        checked={formData.assignedEmployeeId === employee.id}
                        onChange={(e) => setFormData(prev => ({...prev, assignedEmployeeId: e.target.value}))}
                        className="w-4 h-4"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold" style={{ color: Colors.text }}>
                            {employee.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            <Star size={14} color={Colors.warning} fill={Colors.warning} />
                            <span className="text-sm" style={{ color: Colors.textSecondary }}>
                              {employee.rating}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm" style={{ color: Colors.textSecondary }}>
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {employee.phone}
                          </span>
                          <span>
                            {employee.completedJobs} lucrări finalizate
                          </span>
                          <span>
                            {employee.salaryPercentage}% comision
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <span>Salvează Lucrarea</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}