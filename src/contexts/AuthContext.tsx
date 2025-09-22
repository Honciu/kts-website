'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { DEMO_EMPLOYEES, DEMO_ACCOUNTS } from '@/constants/appConfig';

export type UserType = 'worker' | 'admin' | 'client';

export interface User {
  id: string;
  type: UserType;
  name?: string;
  phone?: string;
  email?: string;
  username?: string;
  isManager?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (type: UserType, credentials: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    console.log('🔄 Initializing authentication...');
    
    const initAuth = async () => {
      try {
        if (isLoggingOut) {
          console.log('🚪 Skipping session restore - logout in progress');
          setIsLoading(false);
          return;
        }
        
        // Check if user explicitly logged out
        const logoutFlag = localStorage.getItem('logout_flag');
        if (logoutFlag === 'true') {
          console.log('🚪 User explicitly logged out, skipping session restore');
          localStorage.removeItem('logout_flag');
          setIsLoading(false);
          return;
        }
        
        const storedUser = localStorage.getItem('user');
        if (storedUser && storedUser.trim() && storedUser !== 'undefined' && storedUser !== 'null') {
          try {
            const parsedData = JSON.parse(storedUser);
            const userData = parsedData.data || parsedData;
            if (userData && typeof userData === 'object' && userData.id && !isLoggingOut) {
              setUser(userData);
              console.log('✅ User session restored:', userData.name || userData.type);
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse stored user data:', parseError);
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.warn('⚠️ Auth initialization error:', error);
      } finally {
        setIsLoading(false);
        console.log('✅ Authentication initialized');
      }
    };
    
    initAuth();
  }, [isLoggingOut]);

  const login = useCallback(async (type: UserType, credentials: any) => {
    console.log('🔑 Login attempt:', type, credentials.username || credentials.id);
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 100));
      
      let newUser: User | null = null;
      
      if (type === 'worker') {
        let employees: any[] = [...DEMO_EMPLOYEES];
        
        // Try to load from localStorage for persistence
        try {
          const storedEmployees = localStorage.getItem('employees');
          if (storedEmployees && storedEmployees.trim()) {
            const parsedData = JSON.parse(storedEmployees);
            const parsedEmployees = Array.isArray(parsedData) ? parsedData : (parsedData.data || []);
            if (Array.isArray(parsedEmployees) && parsedEmployees.length > 0) {
              employees = parsedEmployees;
              console.log('📱 Using stored employees data:', employees.length);
            }
          }
        } catch (error) {
          console.warn('⚠️ Using default employees due to storage error');
        }
        
        console.log('🔍 Checking employees for login:', employees.length);
        
        const employee = employees.find((emp: any) => {
          // Try exact username match (case insensitive)
          if (emp.username && emp.username.toLowerCase() === credentials.username.toLowerCase()) {
            return true;
          }
          // Try exact name match (case insensitive)
          if (emp.name && emp.name.toLowerCase() === credentials.username.toLowerCase()) {
            return true;
          }
          return false;
        });
        
        if (!employee) {
          const availableUsernames = employees.map((e: any) => e.username || e.name).filter(Boolean).join(', ');
          throw new Error(`❌ Username "${credentials.username}" nu a fost găsit.\n\n✅ Usernames disponibile din baza de date: ${availableUsernames || 'Niciun angajat găsit - contactați administratorul'}`);
        }
        
        if (employee.password !== credentials.password) {
          throw new Error(`❌ Parolă incorectă pentru ${employee.name}.\n\n✅ Parola corectă este: "${employee.password}"`);
        }
        
        if (!employee.isActive) {
          throw new Error('❌ Contul de lucrător este inactiv');
        }
        
        console.log('✅ Login successful for employee:', employee.name);
        
        newUser = {
          id: employee.id,
          type: 'worker' as UserType,
          name: employee.name,
          phone: employee.phone,
          email: employee.email,
          username: employee.username || employee.name,
        };
      } else if (type === 'admin') {
        if (credentials.id === DEMO_ACCOUNTS.admin.id && credentials.password === DEMO_ACCOUNTS.admin.password) {
          console.log('✅ Admin login successful');
          newUser = DEMO_ACCOUNTS.admin.user;
        } else {
          console.log('❌ Invalid admin credentials');
          throw new Error(`ID sau parolă administrativ incorectă.\n\n✅ Credentăialele corecte sunt:\nUser: 123\nPassword: 123`);
        }
      } else if (type === 'client') {
        // For demo purposes, allow any client login
        newUser = {
          id: 'client-' + Date.now(),
          type: 'client' as UserType,
          name: credentials.name || 'Client Demo',
          phone: credentials.phone || '+40700000000',
          email: credentials.email || 'client@demo.com',
        };
      }
      
      if (!newUser) {
        throw new Error('Autentificare eșuată');
      }
      
      setUser(newUser);
      console.log('✅ User state updated successfully:', newUser.name, newUser.type);
      
      // Save with timestamp for sync tracking
      const userDataWithTimestamp = {
        data: newUser,
        lastUpdated: new Date().toISOString(),
        syncId: Date.now() + Math.random()
      };
      
      try {
        localStorage.setItem('user', JSON.stringify(userDataWithTimestamp));
        console.log('💾 User session saved with sync timestamp');
      } catch (saveError) {
        console.warn('⚠️ Failed to save user session:', saveError);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Starting logout process...');
      setIsLoggingOut(true);
      
      // Clear user state immediately
      setUser(null);
      
      // Clear all stored data
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('employees');
        localStorage.removeItem('admin_jobs');
        localStorage.removeItem('admin_services');
        localStorage.setItem('logout_flag', 'true');
        console.log('🚪 All user data cleared from storage');
      } catch (removeError) {
        console.warn('⚠️ Failed to clear some user data:', removeError);
      }
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggingOut,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}