import { useState, useEffect } from 'react';
import { getMeApi } from '../authService';

export const useGetMe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getMeApi();
      setUser(data);
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message || 'Lấy thông tin user thất bại');
      setLoading(false);
      throw err;
    }
  };

  return { fetchUser, user, loading, error };
};

