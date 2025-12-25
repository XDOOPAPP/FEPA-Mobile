import { useState } from 'react';
import { registerApi } from '../authService';

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await registerApi(email, password, fullName);
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
      setLoading(false);
      throw err;
    }
  };

  return { register, loading, error };
};

