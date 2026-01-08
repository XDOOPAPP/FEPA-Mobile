import { useState, useCallback } from 'react';

export interface ViewModelState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export const useBaseViewModel = () => {
  const [state, setState] = useState<ViewModelState>({
    isLoading: false,
    error: null,
    success: null,
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setSuccess = useCallback((success: string | null) => {
    setState(prev => ({ ...prev, success }));
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  return {
    state,
    setLoading,
    setError,
    setSuccess,
    clearMessages,
  };
};
