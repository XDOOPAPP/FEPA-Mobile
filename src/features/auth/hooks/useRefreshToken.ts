import { useState } from 'react';
import { refreshTokenApi } from '../authService';

export const useRefreshToken = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshToken = async (refreshToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await refreshTokenApi(refreshToken);
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message || 'Làm mới token thất bại');
      setLoading(false);
      throw err;
    }
  };

  return { refreshToken, loading, error };
};

