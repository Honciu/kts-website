'use client';

// Importuri condiționale pentru API services
import { apiService as simulatedApiService } from './apiService';
import { realApiService } from './realApiService';

// Detectarea modului de rulare
const isProduction = process.env.NODE_ENV === 'production';
const forceRealAPI = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';

// Selectează API service-ul potrivit
export const apiService = (isProduction || forceRealAPI) ? realApiService : simulatedApiService;

// Export tipurile
export type { APIResponse, ChangeLogEntry } from './apiService';

// Debugging info
if (typeof window !== 'undefined') {
  const apiMode = (isProduction || forceRealAPI) ? 'REAL SERVER API' : 'SIMULATED API (localStorage)';
  console.log(`🔧 API Service Mode: ${apiMode}`);
  console.log(`  • NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  • NEXT_PUBLIC_USE_REAL_API: ${process.env.NEXT_PUBLIC_USE_REAL_API}`);
  console.log(`  • Using: ${(isProduction || forceRealAPI) ? 'realApiService' : 'simulatedApiService'}`);
}