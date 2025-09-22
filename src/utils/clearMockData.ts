'use client';

/**
 * Utility pentru curățarea datelor mock din localStorage
 * pentru a se asigura că doar datele reale din API sunt folosite
 */

export function clearAllMockData() {
  if (typeof window === 'undefined') {
    console.log('Server environment - no localStorage to clear');
    return;
  }

  try {
    console.log('🧹 Clearing ALL mock data from localStorage...');
    
    // Keys used by jobService
    const mockDataKeys = [
      'kts_jobs_data',
      'kts_notifications_data',
      'kts_worker_location',
      'kts_sync_data',
      'kts_api_cache',
      'kts_local_jobs'
    ];
    
    let clearedCount = 0;
    
    mockDataKeys.forEach(key => {
      const existed = localStorage.getItem(key) !== null;
      if (existed) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`  ✅ Cleared: ${key}`);
      }
    });
    
    if (clearedCount > 0) {
      console.log(`✨ Successfully cleared ${clearedCount} mock data entries`);
      console.log('🔄 Only REAL API data will be used now');
    } else {
      console.log('ℹ️ No mock data found to clear');
    }
    
    return { cleared: clearedCount, keys: mockDataKeys };
    
  } catch (error) {
    console.error('❌ Error clearing mock data:', error);
    return { cleared: 0, keys: [], error };
  }
}

export function checkMockDataStatus() {
  if (typeof window === 'undefined') {
    return { hasMockData: false, keys: [] };
  }

  const mockDataKeys = [
    'kts_jobs_data',
    'kts_notifications_data',
    'kts_worker_location',
    'kts_sync_data',
    'kts_api_cache',
    'kts_local_jobs'
  ];
  
  const existingKeys = mockDataKeys.filter(key => localStorage.getItem(key) !== null);
  
  console.log('📊 Mock Data Status:');
  console.log(`  Found ${existingKeys.length} mock data entries`);
  existingKeys.forEach(key => {
    const data = localStorage.getItem(key);
    const size = data ? Math.round(data.length / 1024) : 0;
    console.log(`  • ${key}: ${size}KB`);
  });
  
  return {
    hasMockData: existingKeys.length > 0,
    keys: existingKeys,
    totalEntries: existingKeys.length
  };
}

// Auto-clear on module load if specifically requested
if (typeof window !== 'undefined' && window.location.search.includes('clearMockData=true')) {
  clearAllMockData();
}