'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { 
  Plus, 
  Save, 
  X, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  FileText,
  DollarSign,
  AlertCircle,
  Users,
  Check,
  ArrowLeft
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  type: string;
}

interface JobFormData {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  address: string;
  description: string;
  estimatedPrice: number;
  estimatedDuration: number; // in minutes
  assignedEmployeeId: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  jobType: string;
  notes?: string;
}

interface JobType {
  id: string;
  name: string;
  description: string;
}

export default function CreateJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<JobFormData>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    address: '',
    description: '',
    estimatedPrice: 0,
    estimatedDuration: 60,
    assignedEmployeeId: '',
    scheduledDate: '',
    scheduledTime: '09:00',
    priority: 'medium',
    jobType: '',
    notes: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const defaultJobTypes = [
    { id: 'lockout', name: 'Deblocare Ușă', description: 'Deblocare ușă blocată sau cheie spartă' },
    { id: 'key_duplication', name: 'Duplicare Chei', description: 'Copierea cheilor existente' },
    { id: 'lock_change', name: 'Schimbare Yale', description: 'Înlocuirea yalelor existente' },
    { id: 'lock_repair', name: 'Reparație Yale', description: 'Reparația yalelor defecte' },
    { id: 'key_extraction', name: 'Extragere Cheie', description: 'Extragerea cheilor rupte din yale' },
    { id: 'security_upgrade', name: 'Upgrade Securitate', description: 'Instalarea sistemelor de securitate avansate' },
    { id: 'emergency', name: 'Urgență', description: 'Intervenție de urgență 24/7' },
    { id: 'consultation', name: 'Consultanță', description: 'Evaluare și recomandări de securitate' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Scăzută', color: Colors.info },
    { value: 'medium', label: 'Medie', color: Colors.warning },
    { value: 'high', label: 'Ridicată', color: Colors.error },
    { value: 'urgent', label: 'Urgentă', color: Colors.secondary }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('📋 Loading employees and job types...');
      
      // Load employees
      const usersResponse = await fetch('/api/users');
      const usersData = await usersResponse.json();
      
      if (usersData.success) {
        const activeEmployees = usersData.data.filter((user: any) => 
          user.type === 'WORKER' && user.isActive
        );
        setEmployees(activeEmployees);
      }

      // Set default job types (in a real app, this could come from an API)
      setJobTypes(defaultJobTypes);
      
      // Set default date to today
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        scheduledDate: tomorrow.toISOString().split('T')[0]
      }));

      console.log('✅ Data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Numele clientului este obligatoriu';
    }
    
    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Telefonul clientului este obligatoriu';
    } else if (!/^(\+4|04)\d{8,9}$/.test(formData.clientPhone.replace(/\s/g, ''))) {
      newErrors.clientPhone = 'Format telefon invalid (ex: +40712345678)';
    }
    
    if (formData.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Format email invalid';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Adresa este obligatorie';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrierea problemei este obligatorie';
    }
    
    if (!formData.jobType) {
      newErrors.jobType = 'Tipul lucrării este obligatoriu';
    }
    
    if (!formData.assignedEmployeeId) {
      newErrors.assignedEmployeeId = 'Angajatul este obligatoriu';
    }
    
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Data programării este obligatorie';
    } else {
      const scheduleDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (scheduleDate < today) {
        newErrors.scheduledDate = 'Data nu poate fi în trecut';
      }
    }
    
    if (formData.estimatedPrice < 0) {
      newErrors.estimatedPrice = 'Prețul estimat nu poate fi negativ';
    }
    
    if (formData.estimatedDuration < 15) {
      newErrors.estimatedDuration = 'Durata minimă este 15 minute';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      console.log('💾 Creating job...', formData);
      
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledFor: new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00.000Z`),
          status: 'assigned',
          createdBy: user?.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Job created successfully:', result.data);
        
        // Optionally send notification to employee
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: formData.assignedEmployeeId,
              title: 'Lucrare Nouă Atribuită',
              message: `Ai fost atribuit la o nouă lucrare pentru ${formData.clientName}`,
              type: 'job_assigned',
              relatedJobId: result.data.id
            })
          });
        } catch (notifError) {
          console.warn('⚠️ Could not send notification:', notifError);
        }

        alert('Lucrarea a fost creată cu succes!');
        router.push('/admin/jobs');
      } else {
        console.error('❌ Failed to create job:', result.error);
        alert('Eroare la crearea lucrării: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error creating job:', error);
      alert('Eroare la crearea lucrării!');
    } finally {
      setSaving(false);
    }
  };

  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  };

  const getJobTypeById = (id: string): JobType | undefined => {
    return jobTypes.find(jt => jt.id === id);
  };

  const getPriorityConfig = (priority: string) => {
    return priorityOptions.find(p => p.value === priority) || priorityOptions[1];
  };

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      router.replace('/');
      return;
    }
    loadData();
  }, [user, router]);

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard-new')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.info, color: Colors.background }}
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>
            
            <div>
              <h1 className="text-2xl font-bold" style={{ color: Colors.text }}>
                📋 Creare Lucrare Nouă
              </h1>
              <p style={{ color: Colors.textSecondary }}>
                Atribuie o lucrare nouă către un angajat
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
            <p style={{ color: Colors.textSecondary }}>Se încarcă datele...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Client Information */}
            <div className="p-6 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
                <User size={20} />
                Informații Client
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Nume Client *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className={`w-full p-3 rounded-lg border ${errors.clientName ? 'border-red-500' : ''}`}
                    style={{ backgroundColor: Colors.background, borderColor: errors.clientName ? Colors.error : Colors.border, color: Colors.text }}
                    placeholder="Numele clientului"
                  />
                  {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className={`w-full p-3 rounded-lg border ${errors.clientPhone ? 'border-red-500' : ''}`}
                    style={{ backgroundColor: Colors.background, borderColor: errors.clientPhone ? Colors.error : Colors.border, color: Colors.text }}
                    placeholder="+40712345678"
                  />
                  {errors.clientPhone && <p className="text-red-500 text-xs mt-1">{errors.clientPhone}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Email (opțional)
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className={`w-full p-3 rounded-lg border ${errors.clientEmail ? 'border-red-500' : ''}`}
                    style={{ backgroundColor: Colors.background, borderColor: errors.clientEmail ? Colors.error : Colors.border, color: Colors.text }}
                    placeholder="client@email.com"
                  />
                  {errors.clientEmail && <p className="text-red-500 text-xs mt-1">{errors.clientEmail}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Adresa *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full p-3 rounded-lg border ${errors.address ? 'border-red-500' : ''}`}
                    style={{ backgroundColor: Colors.background, borderColor: errors.address ? Colors.error : Colors.border, color: Colors.text }}
                    placeholder="Strada, numărul, orașul"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="p-6 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
                <FileText size={20} />
                Detalii Lucrare
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                      Tipul Lucrării *
                    </label>
                    <select
                      value={formData.jobType}
                      onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                      className={`w-full p-3 rounded-lg border ${errors.jobType ? 'border-red-500' : ''}`}
                      style={{ backgroundColor: Colors.background, borderColor: errors.jobType ? Colors.error : Colors.border, color: Colors.text }}
                    >
                      <option value="">Selectează tipul lucrării</option>
                      {jobTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {errors.jobType && <p className="text-red-500 text-xs mt-1">{errors.jobType}</p>}
                    {formData.jobType && (
                      <p className="text-xs mt-1" style={{ color: Colors.textSecondary }}>
                        {getJobTypeById(formData.jobType)?.description}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                      Prioritate
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full p-3 rounded-lg border"
                      style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Descrierea Problemei *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full p-3 rounded-lg border h-24 resize-none ${errors.description ? 'border-red-500' : ''}`}
                    style={{ backgroundColor: Colors.background, borderColor: errors.description ? Colors.error : Colors.border, color: Colors.text }}
                    placeholder="Descriere detaliată a problemei sau serviciului necesar..."
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Note Suplimentare (opțional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-3 rounded-lg border h-20 resize-none"
                    style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                    placeholder="Note suplimentare, instrucțiuni speciale..."
                  />
                </div>
              </div>
            </div>

            {/* Scheduling & Assignment */}
            <div className="p-6 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
                <Calendar size={20} />
                Programare & Atribuire
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Data Programării *
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className={`w-full p-3 rounded-lg border ${errors.scheduledDate ? 'border-red-500' : ''}`}
                    style={{ backgroundColor: Colors.background, borderColor: errors.scheduledDate ? Colors.error : Colors.border, color: Colors.text }}
                  />
                  {errors.scheduledDate && <p className="text-red-500 text-xs mt-1">{errors.scheduledDate}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Ora Programării
                  </label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="w-full p-3 rounded-lg border"
                    style={{ backgroundColor: Colors.background, borderColor: Colors.border, color: Colors.text }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Durata Estimată (min)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 60 })}
                    className={`w-full p-3 rounded-lg border ${errors.estimatedDuration ? 'border-red-500' : ''}`}
                    style={{ backgroundColor: Colors.background, borderColor: errors.estimatedDuration ? Colors.error : Colors.border, color: Colors.text }}
                  />
                  {errors.estimatedDuration && <p className="text-red-500 text-xs mt-1">{errors.estimatedDuration}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Preț Estimat (RON)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.estimatedPrice}
                    onChange={(e) => setFormData({ ...formData, estimatedPrice: parseFloat(e.target.value) || 0 })}
                    className={`w-full p-3 rounded-lg border ${errors.estimatedPrice ? 'border-red-500' : ''}`}
                    style={{ backgroundColor: Colors.background, borderColor: errors.estimatedPrice ? Colors.error : Colors.border, color: Colors.text }}
                  />
                  {errors.estimatedPrice && <p className="text-red-500 text-xs mt-1">{errors.estimatedPrice}</p>}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Atribuie Angajatului *
                </label>
                <select
                  value={formData.assignedEmployeeId}
                  onChange={(e) => setFormData({ ...formData, assignedEmployeeId: e.target.value })}
                  className={`w-full p-3 rounded-lg border ${errors.assignedEmployeeId ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: Colors.background, borderColor: errors.assignedEmployeeId ? Colors.error : Colors.border, color: Colors.text }}
                >
                  <option value="">Selectează angajatul</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} {employee.phone && `(${employee.phone})`}
                    </option>
                  ))}
                </select>
                {errors.assignedEmployeeId && <p className="text-red-500 text-xs mt-1">{errors.assignedEmployeeId}</p>}
                {formData.assignedEmployeeId && (
                  <div className="mt-2 p-3 rounded border" style={{ backgroundColor: Colors.background, borderColor: Colors.border }}>
                    <div className="flex items-center gap-2">
                      <User size={16} color={Colors.info} />
                      <span style={{ color: Colors.text }}>
                        {getEmployeeById(formData.assignedEmployeeId)?.name}
                      </span>
                      {getEmployeeById(formData.assignedEmployeeId)?.phone && (
                        <span style={{ color: Colors.textSecondary }}>
                          • {getEmployeeById(formData.assignedEmployeeId)?.phone}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary & Actions */}
            <div className="p-6 rounded-lg border" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
                <Check size={20} />
                Sumarul Lucrării
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: Colors.textSecondary }}>Client:</span>
                  <span style={{ color: Colors.text }}>
                    {formData.clientName || 'Nu este specificat'} 
                    {formData.clientPhone && ` (${formData.clientPhone})`}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: Colors.textSecondary }}>Tipul lucrării:</span>
                  <span style={{ color: Colors.text }}>
                    {getJobTypeById(formData.jobType)?.name || 'Nu este specificat'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: Colors.textSecondary }}>Programat pentru:</span>
                  <span style={{ color: Colors.text }}>
                    {formData.scheduledDate && formData.scheduledTime 
                      ? `${new Date(formData.scheduledDate).toLocaleDateString('ro-RO')} la ${formData.scheduledTime}`
                      : 'Nu este specificat'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: Colors.textSecondary }}>Atribuit către:</span>
                  <span style={{ color: Colors.text }}>
                    {getEmployeeById(formData.assignedEmployeeId)?.name || 'Nu este specificat'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span style={{ color: Colors.textSecondary }}>Prioritate:</span>
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ 
                      backgroundColor: getPriorityConfig(formData.priority).color, 
                      color: Colors.background 
                    }}
                  >
                    {getPriorityConfig(formData.priority).label}
                  </span>
                </div>
                
                {formData.estimatedPrice > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: Colors.textSecondary }}>Preț estimat:</span>
                    <span style={{ color: Colors.success, fontWeight: 'bold' }}>
                      {formData.estimatedPrice.toLocaleString('ro-RO')} RON
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => router.push('/admin/dashboard-new')}
                  className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors border"
                  style={{ borderColor: Colors.border, color: Colors.textSecondary }}
                  disabled={saving}
                >
                  Anulează
                </button>
                
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: Colors.success, color: Colors.background }}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Se creează...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Creează Lucrarea
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}