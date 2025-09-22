'use client';

import React, { useEffect, useState } from 'react';
import { Colors } from '@/constants/colors';
import { realApiService } from '@/utils/realApiService';
import { useAuth } from '@/contexts/AuthContext';

// Define NotificationData interface since we're no longer importing from jobService
interface NotificationData {
  id: string;
  type: 'job_assigned' | 'job_accepted' | 'job_rejected' | 'job_completed' | 'appointment_reminder';
  message: string;
  timestamp: string;
  read: boolean;
  urgent: boolean;
  jobId?: string;
  workerId?: string;
}
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Wrench,
  BellRing
} from 'lucide-react';

interface NotificationSystemProps {
  maxVisibleNotifications?: number;
}

interface ToastNotification extends NotificationData {
  isVisible: boolean;
}

export default function NotificationSystem({ maxVisibleNotifications = 3 }: NotificationSystemProps) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [allNotifications, setAllNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (!user) return;

    // Simplified notification system - no persistence for now
    // Real implementation would load from API or database
    const loadNotifications = () => {
      // For now, just reset notifications as we focus on job sync
      setAllNotifications([]);
      setUnreadCount(0);
    };

    loadNotifications();

    // Add listener for realApiService changes to show job-related toasts
    realApiService.addChangeListener('notification-system', (hasChanges) => {
      if (hasChanges) {
        console.log('🔔 Notification System: Real API changes detected');
        // Could show a simple toast here for job updates
      }
    });

    return () => {
      realApiService.removeChangeListener('notification-system');
    };
  }, [user]);

  const showToastNotification = (notification: NotificationData) => {
    const toastNotification: ToastNotification = {
      ...notification,
      isVisible: true
    };

    setToasts(prev => {
      const newToasts = [toastNotification, ...prev].slice(0, maxVisibleNotifications);
      return newToasts;
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setToasts(prev => 
        prev.map(toast => 
          toast.id === notification.id ? { ...toast, isVisible: false } : toast
        )
      );
      
      // Remove from array after animation
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== notification.id));
      }, 300);
    }, notification.urgent ? 8000 : 5000);
  };

  const markAsRead = (notificationId: string) => {
    // Simplified - just update local state
    setUnreadCount(prev => Math.max(0, prev - 1));
    setAllNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    // Simplified - just remove from local state
    setAllNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    if (allNotifications.find(n => n.id === notificationId && !n.read)) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'job_assigned': return <Wrench size={20} color={Colors.info} />;
      case 'job_accepted': return <CheckCircle size={20} color={Colors.success} />;
      case 'job_rejected': return <X size={20} color={Colors.error} />;
      case 'job_completed': return <CheckCircle size={20} color={Colors.success} />;
      case 'appointment_reminder': return <Clock size={20} color={Colors.warning} />;
      default: return <Bell size={20} color={Colors.secondary} />;
    }
  };

  const getToastColor = (notification: NotificationData) => {
    if (notification.urgent) return Colors.error;
    switch (notification.type) {
      case 'job_assigned': return Colors.info;
      case 'job_accepted': return Colors.success;
      case 'job_rejected': return Colors.error;
      case 'job_completed': return Colors.success;
      case 'appointment_reminder': return Colors.warning;
      default: return Colors.secondary;
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="relative p-2 rounded-lg transition-colors"
          style={{ backgroundColor: Colors.surfaceLight }}
          title="Notificări"
        >
          {unreadCount > 0 ? (
            <BellRing size={20} color={Colors.secondary} />
          ) : (
            <Bell size={20} color={Colors.textSecondary} />
          )}
          
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs font-bold rounded-full flex items-center justify-center"
              style={{
                backgroundColor: Colors.error,
                color: Colors.background,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isDropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border shadow-lg z-50"
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.border,
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: Colors.border }}>
              <h3 className="font-semibold" style={{ color: Colors.text }}>
                Notificări
              </h3>
              {unreadCount > 0 && (
                <p className="text-sm" style={{ color: Colors.textSecondary }}>
                  {unreadCount} necitite
                </p>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {allNotifications.length > 0 ? (
                allNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b hover:bg-opacity-50 transition-colors ${
                      !notification.read ? 'bg-opacity-20' : ''
                    }`}
                    style={{
                      borderColor: Colors.border,
                      backgroundColor: !notification.read ? Colors.surfaceLight : 'transparent',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`} 
                           style={{ color: Colors.text }}>
                          {notification.title}
                        </p>
                        <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
                          {notification.message}
                        </p>
                        <p className="text-xs mt-2" style={{ color: Colors.textMuted }}>
                          {new Date(notification.timestamp).toLocaleString('ro-RO')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 rounded text-xs hover:bg-opacity-80 transition-colors"
                            style={{ color: Colors.secondary }}
                            title="Marchează ca citit"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 rounded text-xs hover:bg-opacity-80 transition-colors"
                          style={{ color: Colors.textMuted }}
                          title="Șterge"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Bell size={32} color={Colors.textMuted} className="mx-auto mb-2" />
                  <p style={{ color: Colors.textSecondary }}>Nu aveți notificări</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-lg border shadow-lg transition-all duration-300 transform ${
              toast.isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
            style={{
              backgroundColor: Colors.surface,
              borderColor: getToastColor(toast),
              borderLeftWidth: '4px',
              minWidth: '320px',
              maxWidth: '400px',
            }}
          >
            <div className="flex items-start gap-3">
              {getNotificationIcon(toast.type)}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: Colors.text }}>
                  {toast.title}
                </p>
                <p className="text-sm mt-1" style={{ color: Colors.textSecondary }}>
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => {
                  setToasts(prev =>
                    prev.map(t => 
                      t.id === toast.id ? { ...t, isVisible: false } : t
                    )
                  );
                  setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== toast.id));
                  }, 300);
                }}
                className="p-1 rounded hover:bg-opacity-80 transition-colors"
                style={{ color: Colors.textMuted }}
              >
                <X size={16} />
              </button>
            </div>
            {toast.urgent && (
              <div className="mt-2 flex items-center gap-1">
                <AlertCircle size={16} color={Colors.error} />
                <span className="text-xs font-medium" style={{ color: Colors.error }}>
                  URGENT
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overlay to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </>
  );
}