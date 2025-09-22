'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { notificationService } from '@/utils/notificationService';
import { jobService } from '@/utils/jobService';
import { realApiService } from '@/utils/realApiService';
import { 
  ArrowLeft,
  Camera,
  Upload,
  DollarSign,
  CreditCard,
  Banknote,
  Building,
  AlertCircle,
  CheckCircle,
  Save,
  X
} from 'lucide-react';

interface CompletionData {
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  totalAmount: number;
  materialsCost: number;
  laborCost: number;
  tvaAmount: number; // Suma TVA separată - 100% pentru companie
  bankAccount?: 'KTS' | 'Urgente_Deblocari' | 'Lacatusul_Priceput';
  onlyTravelFee: boolean;
  workDescription: string;
  jobPhotos: File[];
  notes: string;
}

export default function CompleteJob() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job] = useState({
    id: jobId,
    clientName: 'Ion Popescu',
    clientPhone: '+40721123456',
    address: 'Str. Aviatorilor nr. 15',
    serviceName: 'Deblocare ușă',
  });

  const [completionData, setCompletionData] = useState<CompletionData>({
    paymentMethod: 'cash',
    totalAmount: 0,
    materialsCost: 0,
    laborCost: 0,
    tvaAmount: 0,
    onlyTravelFee: false,
    workDescription: '',
    jobPhotos: [],
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  useEffect(() => {
    if (!user || user.type !== 'worker') {
      router.replace('/');
    }
  }, [user, router]);

  const bankAccounts = [
    { value: 'KTS', label: 'KTS - Cont Principal' },
    { value: 'Urgente_Deblocari', label: 'Urgențe Deblocări' },
    { value: 'Lacatusul_Priceput', label: 'Lăcătușul Priceput' }
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + completionData.jobPhotos.length > 5) {
      alert('Poți încărca maximum 5 poze!');
      return;
    }

    setCompletionData(prev => ({
      ...prev,
      jobPhotos: [...prev.jobPhotos, ...files]
    }));

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotoPreview(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setCompletionData(prev => ({
      ...prev,
      jobPhotos: prev.jobPhotos.filter((_, i) => i !== index)
    }));
    
    URL.revokeObjectURL(photoPreview[index]);
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const calculateCommission = () => {
    // Simulează procentul de comision al lucrătorului (30% din exemplu)
    const commissionRate = 0.30; // 30%
    if (completionData.onlyTravelFee) {
      return completionData.totalAmount * commissionRate;
    }
    return completionData.laborCost * commissionRate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (completionData.totalAmount <= 0) {
      alert('Suma totală trebuie să fie mai mare decât 0!');
      return;
    }

    if (!completionData.workDescription.trim()) {
      alert('Te rog descrie lucrarea efectuată!');
      return;
    }

    if (completionData.jobPhotos.length === 0) {
      alert('Te rog încarcă cel puțin o poză cu lucrarea finalizată!');
      return;
    }

    if ((completionData.paymentMethod === 'card' || completionData.paymentMethod === 'bank_transfer') && !completionData.bankAccount) {
      alert('Te rog selectează contul în care s-a făcut plata!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the job from real API first
      const jobsResponse = await realApiService.getJobs();
      let currentJob = null;
      
      if (jobsResponse.success) {
        currentJob = jobsResponse.data.find(j => j.id === job.id);
        if (!currentJob) {
          throw new Error('Job not found');
        }
      } else {
        throw new Error('Could not fetch job data');
      }

      // Convert photos to base64 for storage
      const photoPromises = completionData.jobPhotos.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
      
      const photoBase64Array = await Promise.all(photoPromises);
      
      // Prepare completion data
      const completionDataForApi = {
        paymentMethod: completionData.paymentMethod,
        totalAmount: completionData.totalAmount,
        workerCommission: calculateCommission(),
        tvaAmount: completionData.tvaAmount, // TVA separat - 100% pentru companie
        bankAccount: completionData.bankAccount,
        onlyTravelFee: completionData.onlyTravelFee,
        workDescription: completionData.workDescription,
        photos: photoBase64Array, // Save as base64 data URLs
        notes: completionData.notes
      };

      // Update job status to completed via REAL API
      const newStatus: 'completed' | 'pending_approval' = completionData.paymentMethod === 'bank_transfer' ? 'pending_approval' : 'completed';
      const updatedJob = {
        ...currentJob,
        status: newStatus,
        completedAt: new Date().toISOString(),
        completionData: completionDataForApi
      };
      
      console.log('🔄 Sending job completion to API:', {
        jobId: job.id,
        status: newStatus,
        completionData: completionDataForApi,
        photosCount: photoBase64Array.length
      });
      
      const response = await realApiService.updateJob(job.id, updatedJob);
      
      if (!response.success) {
        console.error('❌ Job completion failed:', response.error);
        throw new Error(response.error || 'Failed to complete job via API');
      }
      
      const completedJob = response.data;
      console.log('✅ Job completed successfully via REAL API!');
      console.log('  - Job ID:', completedJob.id);
      console.log('  - Status:', completedJob.status);
      console.log('  - Completed at:', completedJob.completedAt);
      console.log('  - Worker commission:', completedJob.completionData?.workerCommission);
      console.log('  - Photos saved:', completedJob.completionData?.photos?.length || 0);
      
      // CRITICAL: Force immediate sync to all listeners
      console.log('🚀 CRITICAL: Triggering immediate force sync for job completion...');
      await realApiService.forceSync();
      
      // Additional delay to ensure propagation
      console.log('⏳ Waiting 2 seconds for sync propagation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Send completion notification
      await notificationService.sendJobCompletionNotification(
        job.id,
        user?.name || 'Worker',
        job.clientName,
        job.serviceName
      );

      // Show success message
      if (completedJob.status === 'pending_approval') {
        alert(`✅ Lucrare înregistrată cu succes!
        
📋 Detalii:
• Suma totală: ${completionData.totalAmount} RON
• Comisionul tău: ${calculateCommission().toFixed(2)} RON
${completionData.tvaAmount > 0 ? `• TVA pentru companie: ${completionData.tvaAmount} RON
` : ''}• Metoda de plată: Transfer bancar - ${completionData.bankAccount}
• Poze încărcate: ${completionData.jobPhotos.length}

⏳ Lucrarea va apărea în câștiguri după aprobarea administratorului pentru transferurile bancare.`);
      } else {
        alert(`✅ Lucrare finalizată cu succes!
        
📋 Detalii:
• Suma totală: ${completionData.totalAmount} RON  
• Comisionul tău: ${calculateCommission().toFixed(2)} RON
${completionData.tvaAmount > 0 ? `• TVA pentru companie: ${completionData.tvaAmount} RON
` : ''}• Metoda de plată: ${completionData.paymentMethod === 'cash' ? 'Numerar' : 'Card'}
• Poze încărcate: ${completionData.jobPhotos.length}

💰 Câștigul a fost adăugat automat în contul tău!
🔄 Sincronizare în timp real activă - jobul va apărea în toate paginile în 2-3 secunde!`);
      }

      router.push('/worker/completed-jobs');
      
    } catch (error) {
      console.error('Error completing job:', error);
      alert('A apărut o eroare. Te rog încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.type !== 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: Colors.secondary }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: Colors.background }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: Colors.surface, borderColor: Colors.border }}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: Colors.surfaceLight }}
            >
              <ArrowLeft size={20} color={Colors.textSecondary} />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: Colors.secondary }}>
                Finalizează Lucrarea #{job.id}
              </h1>
              <p className="text-xs md:text-sm" style={{ color: Colors.textSecondary }}>
                {job.serviceName} - {job.clientName}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Travel Fee Only Option */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="onlyTravelFee"
                checked={completionData.onlyTravelFee}
                onChange={(e) => setCompletionData(prev => ({
                  ...prev,
                  onlyTravelFee: e.target.checked,
                  materialsCost: e.target.checked ? 0 : prev.materialsCost,
                  laborCost: e.target.checked ? 0 : prev.totalAmount
                }))}
                className="w-4 h-4"
              />
              <label htmlFor="onlyTravelFee" className="font-medium" style={{ color: Colors.text }}>
                🚗 Am încasat doar deplasarea (fără lucrare efectuată)
              </label>
            </div>
            <p className="text-sm mt-2 ml-7" style={{ color: Colors.textSecondary }}>
              Bifează această opțiune dacă nu s-a efectuat lucrarea și s-a încasat doar taxa de deplasare
            </p>
          </div>

          {/* Payment Information */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
              <DollarSign size={20} />
              Informații de Plată
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Suma totală încasată (RON) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={completionData.totalAmount || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setCompletionData(prev => ({
                      ...prev,
                      totalAmount: value,
                      laborCost: completionData.onlyTravelFee ? 0 : value - prev.materialsCost
                    }));
                  }}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                  placeholder="Ex: 120.00"
                  required
                />
              </div>
              
              {/* TVA Cash Field - doar pentru plata cash */}
              {completionData.paymentMethod === 'cash' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    💰 TVA încasat cash (RON) - 100% pentru companie
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={completionData.tvaAmount || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setCompletionData(prev => ({
                        ...prev,
                        tvaAmount: value
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                    style={{ 
                      borderColor: Colors.warning,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                    placeholder="Ex: 23.00"
                  />
                  <p className="text-xs mt-1" style={{ color: Colors.warning }}>
                    ⚠️ TVA-ul se predeă 100% companiei, nu intră în calculul comisionului tău
                  </p>
                </div>
              )}

              {!completionData.onlyTravelFee && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                    Cost materiale (RON)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={completionData.materialsCost || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setCompletionData(prev => ({
                        ...prev,
                        materialsCost: value,
                        laborCost: prev.totalAmount - value
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base"
                    style={{ 
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceLight,
                      color: Colors.text
                    }}
                    placeholder="Ex: 50.00"
                  />
                </div>
              )}
            </div>

            {!completionData.onlyTravelFee && (
              <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: Colors.surfaceLight }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm" style={{ color: Colors.textSecondary }}>Suma totală</p>
                    <p className="text-lg font-semibold" style={{ color: Colors.text }}>
                      {completionData.totalAmount} RON
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: Colors.textSecondary }}>Manoperă</p>
                    <p className="text-lg font-semibold" style={{ color: Colors.success }}>
                      {completionData.laborCost} RON
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: Colors.textSecondary }}>Comisionul tău (30%)</p>
                    <p className="text-xl font-bold" style={{ color: Colors.secondary }}>
                      {calculateCommission().toFixed(2)} RON
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
              <CreditCard size={20} />
              Metoda de Încasare
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  completionData.paymentMethod === 'cash' ? 'border-opacity-100' : 'border-opacity-30'
                }`}
                style={{
                  borderColor: completionData.paymentMethod === 'cash' ? Colors.success : Colors.border,
                  backgroundColor: completionData.paymentMethod === 'cash' ? Colors.surfaceLight : 'transparent'
                }}
                onClick={() => setCompletionData(prev => ({ ...prev, paymentMethod: 'cash', bankAccount: undefined }))}
              >
                <Banknote size={24} color={Colors.success} className="mb-2" />
                <p className="font-medium" style={{ color: Colors.text }}>Numerar</p>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>Plată cash</p>
              </div>

              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  completionData.paymentMethod === 'card' ? 'border-opacity-100' : 'border-opacity-30'
                }`}
                style={{
                  borderColor: completionData.paymentMethod === 'card' ? Colors.info : Colors.border,
                  backgroundColor: completionData.paymentMethod === 'card' ? Colors.surfaceLight : 'transparent'
                }}
                onClick={() => setCompletionData(prev => ({ ...prev, paymentMethod: 'card' }))}
              >
                <CreditCard size={24} color={Colors.info} className="mb-2" />
                <p className="font-medium" style={{ color: Colors.text }}>Card</p>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>Plată cu cardul</p>
              </div>

              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  completionData.paymentMethod === 'bank_transfer' ? 'border-opacity-100' : 'border-opacity-30'
                }`}
                style={{
                  borderColor: completionData.paymentMethod === 'bank_transfer' ? Colors.warning : Colors.border,
                  backgroundColor: completionData.paymentMethod === 'bank_transfer' ? Colors.surfaceLight : 'transparent'
                }}
                onClick={() => setCompletionData(prev => ({ ...prev, paymentMethod: 'bank_transfer' }))}
              >
                <Building size={24} color={Colors.warning} className="mb-2" />
                <p className="font-medium" style={{ color: Colors.text }}>Transfer Bancar</p>
                <p className="text-sm" style={{ color: Colors.textSecondary }}>Plată prin transfer</p>
              </div>
            </div>

            {(completionData.paymentMethod === 'card' || completionData.paymentMethod === 'bank_transfer') && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Selectează contul în care s-a făcut plata *
                </label>
                <select
                  value={completionData.bankAccount || ''}
                  onChange={(e) => setCompletionData(prev => ({ 
                    ...prev, 
                    bankAccount: e.target.value as 'KTS' | 'Urgente_Deblocari' | 'Lacatusul_Priceput'
                  }))}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                  required
                >
                  <option value="">Selectează contul</option>
                  {bankAccounts.map(account => (
                    <option key={account.value} value={account.value}>
                      {account.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {completionData.paymentMethod === 'bank_transfer' && (
              <div className="mt-4 p-4 rounded-lg border" style={{ 
                backgroundColor: Colors.surfaceLight,
                borderColor: Colors.warning 
              }}>
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} color={Colors.warning} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm" style={{ color: Colors.text }}>
                      Atenție: Transfer Bancar
                    </p>
                    <p className="text-sm" style={{ color: Colors.textSecondary }}>
                      Plățile prin transfer bancar trebuie aprobate de administrator înainte să apară în câștigurile tale.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Work Description */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
              <CheckCircle size={20} />
              Descrierea Lucrării
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  {completionData.onlyTravelFee ? 'Motivul deplasării fără lucrare *' : 'Descrierea lucrării efectuate *'}
                </label>
                <textarea
                  value={completionData.workDescription}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, workDescription: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base resize-none"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                  placeholder={
                    completionData.onlyTravelFee 
                      ? "Ex: Client nu era acasă / Problema s-a rezolvat între timp / etc."
                      : "Ex: Am deblocat ușa cu unelte speciale, am verificat mecanismul de închidere și am aplicat lubrifiant..."
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.textSecondary }}>
                  Notițe suplimentare
                </label>
                <textarea
                  value={completionData.notes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border bg-transparent text-sm md:text-base resize-none"
                  style={{ 
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceLight,
                    color: Colors.text
                  }}
                  placeholder="Informații adiționale, recomandări pentru client, etc."
                />
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
              <Camera size={20} />
              Poze cu Lucrarea * {completionData.onlyTravelFee && '(Poză cu adresa/locația)'}
            </h3>

            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:border-opacity-60" 
                style={{ borderColor: Colors.border }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload size={32} color={Colors.textMuted} className="mx-auto mb-2" />
                  <p className="font-medium mb-1" style={{ color: Colors.text }}>
                    Încarcă pozele cu lucrarea
                  </p>
                  <p className="text-sm" style={{ color: Colors.textSecondary }}>
                    {completionData.onlyTravelFee 
                      ? 'Poză cu adresa/locația unde ai ajuns (max 5 poze)'
                      : 'Poze înainte, în timpul lucrării și după finalizare (max 5 poze)'}
                  </p>
                </label>
              </div>

              {photoPreview.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photoPreview.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Poză ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1 rounded-full transition-colors"
                        style={{ backgroundColor: Colors.error }}
                      >
                        <X size={16} color={Colors.primary} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
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
                backgroundColor: Colors.success,
                color: Colors.primary,
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: Colors.primary }}></div>
                  <span>Se salvează...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Finalizează Lucrarea</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}