'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { user, isLoading, isLoggingOut, login } = useAuth();
  const [loginType, setLoginType] = useState<'worker' | 'admin' | 'client'>('worker');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && !isLoggingOut && user) {
      console.log('🔄 User already logged in, redirecting...', {
        type: user.type,
        name: user.name,
        isManager: user.isManager
      });
      
      const redirectPath = user.type === 'admin' ? '/admin/dashboard' : 
                          user.type === 'worker' ? '/worker/dashboard' : 
                          '/client/dashboard';
      console.log(`🔄 Redirecting to: ${redirectPath}`);
      
      setTimeout(() => {
        router.replace(redirectPath);
      }, 100);
    }
  }, [user, isLoading, router, isLoggingOut]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      alert('Te rog completează toate câmpurile');
      return;
    }

    setIsSubmitting(true);
    try {
      const credentials = loginType === 'admin' 
        ? { id: username, password }
        : { username, password };
      
      await login(loginType, credentials);
      
      // Clear form after successful login
      setUsername('');
      setPassword('');
      
      console.log('✅ Login successful, navigation will be handled by useEffect...');
    } catch (error) {
      console.error('❌ Login failed:', error);
      alert(
        error instanceof Error ? error.message : 'Eroare necunoscută'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a timeout to prevent infinite loading
  const [forceShowLogin, setForceShowLogin] = useState(false);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('⚠️ Forcing login screen after timeout');
        setForceShowLogin(true);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [isLoading]);
  
  // Clear form when component mounts (after logout)
  useEffect(() => {
    if (!user && !isLoading && !isLoggingOut) {
      setUsername('');
      setPassword('');
      console.log('🔄 Login form cleared after logout');
    }
  }, [user, isLoading, isLoggingOut]);

  // Show loading screen while checking auth state (with timeout)
  if ((isLoading || isLoggingOut) && !forceShowLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: Colors.background }}>
        <div className="text-center">
          <Wrench size={48} color={Colors.secondary} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2" style={{ color: Colors.secondary }}>
            Lăcătuș București
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.secondary }}></div>
          <p style={{ color: Colors.textSecondary }}>Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8 md:py-16" style={{ backgroundColor: Colors.background }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <Wrench size={48} color={Colors.secondary} className="mx-auto mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: Colors.secondary }}>
            Lăcătuș București
          </h1>
          <p className="text-base md:text-lg" style={{ color: Colors.textSecondary }}>
            Sistem de Management Lucrări
          </p>
          <p className="text-xs md:text-sm mt-2 font-medium" style={{ color: Colors.secondary }}>
            Versiune Web - Optimizată pentru Browser
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="flex rounded-lg p-1" style={{ backgroundColor: Colors.surface }}>
            <button
              className={`flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3 px-2 md:px-4 rounded-md transition-colors text-sm md:text-base ${
                loginType === 'worker' ? 'font-semibold' : ''
              }`}
              style={{
                backgroundColor: loginType === 'worker' ? Colors.secondary : 'transparent',
                color: loginType === 'worker' ? Colors.background : Colors.textSecondary,
              }}
              onClick={() => setLoginType('worker')}
            >
              <User size={20} />
              <span>Lucrător</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3 px-2 md:px-4 rounded-md transition-colors text-sm md:text-base ${
                loginType === 'admin' ? 'font-semibold' : ''
              }`}
              style={{
                backgroundColor: loginType === 'admin' ? Colors.secondary : 'transparent',
                color: loginType === 'admin' ? Colors.background : Colors.textSecondary,
              }}
              onClick={() => setLoginType('admin')}
            >
              <Lock size={20} />
              <span>Administrator</span>
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3 px-2 md:px-4 rounded-md transition-colors text-sm md:text-base ${
                loginType === 'client' ? 'font-semibold' : ''
              }`}
              style={{
                backgroundColor: loginType === 'client' ? Colors.secondary : 'transparent',
                color: loginType === 'client' ? Colors.background : Colors.textSecondary,
              }}
              onClick={() => setLoginType('client')}
            >
              <User size={20} />
              <span>Client</span>
            </button>
          </div>

          <div className="flex items-center rounded-lg px-3 md:px-4 py-2 md:py-3 border" style={{ 
            backgroundColor: Colors.surface, 
            borderColor: Colors.border 
          }}>
            <User size={18} color={Colors.textSecondary} className="mr-2 md:mr-3 flex-shrink-0" />
            <input
              type="text"
              placeholder={loginType === 'admin' ? 'ID Administrator' : loginType === 'client' ? 'Nume complet' : 'Nume utilizator'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm md:text-base"
              style={{ color: Colors.text }}
            />
          </div>

          <div className="flex items-center rounded-lg px-3 md:px-4 py-2 md:py-3 border" style={{ 
            backgroundColor: Colors.surface, 
            borderColor: Colors.border 
          }}>
            <Lock size={18} color={Colors.textSecondary} className="mr-2 md:mr-3 flex-shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Parolă"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm md:text-base"
              style={{ color: Colors.text }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 ml-2"
            >
              {showPassword ? (
                <EyeOff size={18} color={Colors.textSecondary} />
              ) : (
                <Eye size={18} color={Colors.textSecondary} />
              )}
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={isSubmitting}
            className={`w-full py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg transition-opacity ${
              isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{
              backgroundColor: Colors.secondary,
              color: Colors.background,
            }}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: Colors.background }}></div>
                <span>Se autentifică...</span>
              </div>
            ) : (
              'Autentificare'
            )}
          </button>

          {/* Demo credentials info */}
          <div className="text-center space-y-2 text-xs md:text-sm" style={{ color: Colors.textMuted }}>
            <p className="font-medium">Conturi demo disponibile:</p>
            <div className="space-y-1 text-left bg-opacity-50 rounded p-3" style={{ backgroundColor: Colors.surface }}>
              <div className="mb-2">
                <p className="font-semibold" style={{ color: Colors.textSecondary }}>Lucrător:</p>
                <p className="text-xs">demo / demo123</p>
                <p className="text-xs">Robert / Robert1</p>
              </div>
              <div className="mb-2">
                <p className="font-semibold" style={{ color: Colors.textSecondary }}>Admin:</p>
                <p className="text-xs">admin / admin123</p>
              </div>
              <div>
                <p className="font-semibold" style={{ color: Colors.textSecondary }}>Client:</p>
                <p className="text-xs">orice nume / orice parolă</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
