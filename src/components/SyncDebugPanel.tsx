'use client';

import React, { useState, useEffect } from 'react';
import { Colors } from '@/constants/colors';
import { realApiService } from '@/utils/realApiService';
import { 
  Bug,
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

interface SyncDebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export default function SyncDebugPanel({ isVisible, onToggle }: SyncDebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<{
    totalJobs: number;
    completedJobs: number;
    lastSync: Date;
    syncStatus: 'idle' | 'syncing' | 'success' | 'error';
    apiVersion: string;
    listeners: number;
  }>({
    totalJobs: 0,
    completedJobs: 0,
    lastSync: new Date(),
    syncStatus: 'idle',
    apiVersion: '1.0.0',
    listeners: 0
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshDebugInfo = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔍 Debug Panel: Fetching latest sync info...');
      
      const response = await realApiService.getJobs();
      if (response.success) {
        const completedJobs = response.data.filter(job => job.status === 'completed');
        
        setDebugInfo({
          totalJobs: response.data.length,
          completedJobs: completedJobs.length,
          lastSync: new Date(),
          syncStatus: 'success',
          apiVersion: response.version?.toString() || 'Unknown',
          listeners: (realApiService as any).listeners?.size || 0
        });

        console.log('🔍 Debug Panel: Updated info');
        console.log('  - Total jobs:', response.data.length);
        console.log('  - Completed jobs:', completedJobs.length);
        console.log('  - Completed details:', completedJobs.map(j => ({
          id: j.id,
          client: j.clientName,
          completedAt: j.completedAt,
          commission: j.completionData?.workerCommission || 0
        })));
      } else {
        setDebugInfo(prev => ({ ...prev, syncStatus: 'error' }));
      }
    } catch (error) {
      console.error('❌ Debug Panel: Error refreshing info:', error);
      setDebugInfo(prev => ({ ...prev, syncStatus: 'error' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const forceSync = async () => {
    setDebugInfo(prev => ({ ...prev, syncStatus: 'syncing' }));
    try {
      console.log('⚡ Debug Panel: Force syncing...');
      await realApiService.forceSync();
      await refreshDebugInfo();
      console.log('✅ Debug Panel: Force sync complete');
    } catch (error) {
      console.error('❌ Debug Panel: Force sync failed:', error);
      setDebugInfo(prev => ({ ...prev, syncStatus: 'error' }));
    }
  };

  useEffect(() => {
    if (isVisible) {
      refreshDebugInfo();
      
      // Auto-refresh every 5 seconds when visible
      const interval = setInterval(refreshDebugInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg transition-all hover:scale-110"
        style={{
          backgroundColor: Colors.secondary,
          color: Colors.background,
          zIndex: 50
        }}
        title="Open Sync Debug Panel"
      >
        <Bug size={20} />
      </button>
    );
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg transition-all hover:scale-110"
        style={{
          backgroundColor: Colors.error,
          color: Colors.background,
          zIndex: 50
        }}
        title="Close Sync Debug Panel"
      >
        <EyeOff size={20} />
      </button>

      {/* Debug Panel */}
      <div 
        className="fixed bottom-20 right-4 w-80 rounded-lg border shadow-lg"
        style={{
          backgroundColor: Colors.surface,
          borderColor: Colors.border,
          zIndex: 40
        }}
      >
        <div 
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: Colors.border }}
        >
          <div className="flex items-center gap-2">
            <Bug size={20} color={Colors.secondary} />
            <h3 className="font-semibold" style={{ color: Colors.text }}>
              Sync Debug Panel
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={forceSync}
              disabled={isRefreshing || debugInfo.syncStatus === 'syncing'}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: Colors.info,
                color: Colors.background
              }}
              title="Force Sync"
            >
              <RefreshCw 
                size={16} 
                className={isRefreshing || debugInfo.syncStatus === 'syncing' ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Sync Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
              Sync Status
            </span>
            <div className="flex items-center gap-2">
              {debugInfo.syncStatus === 'success' && <CheckCircle size={16} color={Colors.success} />}
              {debugInfo.syncStatus === 'error' && <XCircle size={16} color={Colors.error} />}
              {debugInfo.syncStatus === 'syncing' && <Clock size={16} color={Colors.warning} />}
              <span 
                className="text-sm font-medium"
                style={{ 
                  color: debugInfo.syncStatus === 'success' ? Colors.success : 
                         debugInfo.syncStatus === 'error' ? Colors.error : Colors.warning
                }}
              >
                {debugInfo.syncStatus === 'success' ? 'Connected' :
                 debugInfo.syncStatus === 'error' ? 'Error' : 'Syncing...'}
              </span>
            </div>
          </div>

          {/* Jobs Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
              Total Jobs
            </span>
            <span className="text-sm font-bold" style={{ color: Colors.text }}>
              {debugInfo.totalJobs}
            </span>
          </div>

          {/* Completed Jobs */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
              Completed Jobs
            </span>
            <span 
              className="text-sm font-bold"
              style={{ 
                color: debugInfo.completedJobs > 0 ? Colors.success : Colors.textSecondary
              }}
            >
              {debugInfo.completedJobs}
            </span>
          </div>

          {/* Last Sync */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
              Last Sync
            </span>
            <span className="text-xs" style={{ color: Colors.textMuted }}>
              {debugInfo.lastSync.toLocaleTimeString('ro-RO')}
            </span>
          </div>

          {/* API Version */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
              API Version
            </span>
            <span className="text-xs font-mono" style={{ color: Colors.textMuted }}>
              {debugInfo.apiVersion}
            </span>
          </div>

          {/* Active Listeners */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: Colors.textSecondary }}>
              Active Listeners
            </span>
            <span 
              className="text-sm font-bold"
              style={{ 
                color: debugInfo.listeners > 0 ? Colors.success : Colors.error
              }}
            >
              {debugInfo.listeners}
            </span>
          </div>
        </div>

        <div 
          className="p-3 border-t text-center"
          style={{ 
            borderColor: Colors.border,
            backgroundColor: Colors.surfaceLight
          }}
        >
          <p className="text-xs" style={{ color: Colors.textMuted }}>
            Auto-refreshes every 5s • Click 🔄 to force sync
          </p>
        </div>
      </div>
    </>
  );
}