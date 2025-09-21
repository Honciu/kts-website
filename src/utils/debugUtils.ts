'use client';

import { apiService } from './apiConfig'; // Folosește configuratorul automat
import { jobService } from './jobService';

/**
 * Debugging utilities pentru sincronizare cross-browser
 */

// Afișează informații despre starea sincronizării
export const debugSyncStatus = () => {
  console.log('🔍 DEBUG SYNC STATUS:');
  console.log('─────────────────────────────────────');
  
  // Local jobs
  const localJobs = jobService.getAllJobs();
  console.log(`📱 Local Jobs: ${localJobs.length}`);
  localJobs.forEach(job => {
    console.log(`  • #${job.id}: ${job.serviceName} (${job.status})`);
  });
  
  // API Change Log
  const changeLog = apiService.getChangeLog();
  console.log(`📋 API Change Log (last 10):`);
  changeLog.slice(-10).forEach(entry => {
    console.log(`  • ${entry.timestamp}: ${entry.type} - ${entry.id}`);
  });
  
  console.log('─────────────────────────────────────');
};

// Test complet cross-browser
export const testCrossBrowserSync = async () => {
  console.log('🧪 STARTING CROSS-BROWSER SYNC TEST');
  console.log('═══════════════════════════════════════');
  
  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Current state');
    debugSyncStatus();
    
    // Step 2: Force sync
    console.log('🔄 Step 2: Force cross-browser sync');
    await jobService.forceCrossBrowserSync();
    
    // Step 3: Wait and check again
    console.log('⏳ Step 3: Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📊 Step 4: State after sync');
    debugSyncStatus();
    
    console.log('✅ CROSS-BROWSER SYNC TEST COMPLETED');
    console.log('═══════════════════════════════════════');
    
    return true;
  } catch (error) {
    console.error('❌ CROSS-BROWSER SYNC TEST FAILED:', error);
    console.log('═══════════════════════════════════════');
    return false;
  }
};

// Adaugă debugging în window pentru console access
if (typeof window !== 'undefined') {
  (window as any).debugKTS = {
    syncStatus: debugSyncStatus,
    testCrossBrowser: testCrossBrowserSync,
    jobService,
    apiService
  };
  
  console.log('🛠️ DEBUG UTILS LOADED:');
  console.log('  • window.debugKTS.syncStatus() - check sync status');
  console.log('  • window.debugKTS.testCrossBrowser() - full test');
  console.log('  • window.debugKTS.jobService - access job service');
  console.log('  • window.debugKTS.apiService - access API service');
}