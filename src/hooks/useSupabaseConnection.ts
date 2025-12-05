import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

interface ConnectionState {
  isChecking: boolean;
  isConnected: boolean | null;
  error: string | null;
}

export function useSupabaseConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isChecking: false,
    isConnected: null,
    error: null,
  });

  /**
   * Check if Supabase is reachable by making a lightweight health check
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setConnectionState(prev => ({ ...prev, isChecking: true, error: null }));
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Use a lightweight query to check connection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const { error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        
        // If we get here without a fetch error, connection is good
        // RLS errors are fine - they mean we connected but don't have permission
        if (!error || !error.message?.includes('Failed to fetch')) {
          setConnectionState({ isChecking: false, isConnected: true, error: null });
          return true;
        }
        
        throw new Error('Connection failed');
      } catch (error: any) {
        const isNetworkError = 
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('NetworkError') ||
          error?.message?.includes('Network request failed') ||
          error?.name === 'AbortError' ||
          error?.name === 'TypeError';
        
        if (isNetworkError && attempt < MAX_RETRIES - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
          continue;
        }
        
        // All retries failed or non-network error
        const errorMessage = isNetworkError
          ? 'Server not reachable. Please check your internet connection and try again.'
          : error?.message || 'Connection error';
          
        setConnectionState({ isChecking: false, isConnected: false, error: errorMessage });
        return false;
      }
    }
    
    setConnectionState({ 
      isChecking: false, 
      isConnected: false, 
      error: 'Server not reachable. Please check your internet connection and try again.' 
    });
    return false;
  }, []);

  /**
   * Execute an auth operation with connection check and retry logic
   */
  const withConnectionCheck = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: { 
      showToast?: boolean;
      retryOnFail?: boolean;
    }
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    const { showToast = true, retryOnFail = true } = options || {};
    
    // First check connection
    const isConnected = await checkConnection();
    if (!isConnected) {
      if (showToast) {
        toast.error('Server not reachable. Please check your internet connection and try again.');
      }
      return { 
        success: false, 
        error: 'Server not reachable. Please check your internet connection and try again.' 
      };
    }
    
    // Execute the operation with retries
    let lastError: any = null;
    const attempts = retryOnFail ? MAX_RETRIES : 1;
    
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const result = await operation();
        return { success: true, data: result };
      } catch (error: any) {
        lastError = error;
        
        const isNetworkError = 
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('NetworkError') ||
          error?.name === 'TypeError';
        
        if (isNetworkError && attempt < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
          continue;
        }
        
        break;
      }
    }
    
    // Determine user-friendly error message
    let errorMessage = 'An unexpected error occurred. Please try again.';
    
    if (lastError?.message?.includes('Failed to fetch') || lastError?.name === 'TypeError') {
      errorMessage = 'Server not reachable. Please check your internet connection and try again.';
    } else if (lastError?.message?.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or PIN. Please try again.';
    } else if (lastError?.message?.includes('Email not confirmed')) {
      errorMessage = 'Please verify your email before logging in.';
    } else if (lastError?.message?.includes('User already registered')) {
      errorMessage = 'This email is already registered. Please login instead.';
    } else if (lastError?.message) {
      errorMessage = lastError.message;
    }
    
    if (showToast) {
      toast.error(errorMessage);
    }
    
    return { success: false, error: errorMessage };
  }, [checkConnection]);

  return {
    ...connectionState,
    checkConnection,
    withConnectionCheck,
  };
}
