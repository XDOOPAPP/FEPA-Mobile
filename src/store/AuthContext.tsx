import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User } from '../types/auth';
import { getMeApi, refreshTokenApi } from '../features/auth/authService';

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<string | null>(null);

  // Computed value
  const isAuthenticated = !!userToken;

  // Helper function để clear tất cả auth data
  const clearAuthData = useCallback(async () => {
    setUserToken(null);
    setRefreshToken(null);
    setUser(null);

    await Promise.all([
      AsyncStorage.removeItem('userToken'),
      AsyncStorage.removeItem('refreshToken'),
      AsyncStorage.removeItem('userData'),
    ]);
  }, []);

  // Load user info từ API
  const loadUserInfo = useCallback(async () => {
    if (!userToken) return;

    try {
      const userData = await getMeApi();
      setUser(userData);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error: any) {
      // Nếu token không hợp lệ (401, 403) → clear data
      if (error.response?.status === 401 || error.response?.status === 403) {
        await clearAuthData();
      }
      console.error('Error loading user info:', error);
    }
  }, [userToken, clearAuthData]);

  // Refresh auth token
  const refreshAuthToken = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
      return false;
    }

    // Tránh refresh đồng thời nhiều lần
    if (isRefreshing) {
      return false;
    }

    setIsRefreshing(true);
    try {
      const response = await refreshTokenApi(refreshToken);

      if (response.token) {
        const newToken = response.token;
        const newRefreshToken = response.refreshToken || refreshToken;

        setUserToken(newToken);
        setRefreshToken(newRefreshToken);

        await AsyncStorage.setItem('userToken', newToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        }

        setIsRefreshing(false);
        return true;
      }

      setIsRefreshing(false);
      return false;
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      setIsRefreshing(false);

      // Nếu refresh token hết hạn → clear data
      await clearAuthData();
      return false;
    }
  }, [refreshToken, isRefreshing, clearAuthData]);

  // Kiểm tra token còn hợp lệ không
  const checkTokenValidity = useCallback(async (): Promise<boolean> => {
    if (!userToken) {
      return false;
    }

    try {
      await getMeApi();
      return true;
    } catch (error: any) {
      // Token không hợp lệ
      if (error.response?.status === 401 || error.response?.status === 403) {
        return false;
      }
      return false;
    }
  }, [userToken]);

  // Cập nhật thông tin user
  const updateUser = useCallback((userData: User) => {
    setUser(userData);
    AsyncStorage.setItem('userData', JSON.stringify(userData));
  }, []);

  // Load data từ AsyncStorage khi app khởi động
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const [token, storedRefreshToken, userDataString] = await Promise.all([
          AsyncStorage.getItem('userToken'),
          AsyncStorage.getItem('refreshToken'),
          AsyncStorage.getItem('userData'),
        ]);

        if (token) {
          setUserToken(token);

          if (storedRefreshToken) {
            setRefreshToken(storedRefreshToken);
          }

          // Load user data từ storage
          if (userDataString) {
            try {
              const parsedUser = JSON.parse(userDataString);
              setUser(parsedUser);
            } catch (e) {
              console.error('Error parsing user data:', e);
            }
          }

          // Verify token và load user info từ API
          try {
            await loadUserInfo();
          } catch (error) {
            // Nếu token không hợp lệ, clear data
            console.error('Token validation failed:', error);
            await clearAuthData();
          }
        }
      } catch (error) {
        console.error('Error loading storage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, [loadUserInfo, clearAuthData]); // Chỉ chạy 1 lần khi mount

  // Login function
  const login = useCallback(
    async (token: string, refreshTokenParam?: string, userData?: User) => {
      setUserToken(token);
      await AsyncStorage.setItem('userToken', token);

      if (refreshTokenParam) {
        setRefreshToken(refreshTokenParam);
        await AsyncStorage.setItem('refreshToken', refreshTokenParam);
      }

      if (userData) {
        setUser(userData);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else {
        // Nếu chưa có userData, load từ API
        try {
          await loadUserInfo();
        } catch (error) {
          console.error('Error loading user info after login:', error);
        }
      }
    },
    [loadUserInfo],
  );

  // Logout function
  const logout = useCallback(async () => {
    await clearAuthData();
  }, [clearAuthData]);

  const value: AuthContextType = {
    userToken,
    refreshToken,
    user,
    isLoading,
    isRefreshing,
    isAuthenticated,
    isPremium,
    premiumExpiry,
    login,
    logout,
    loadUserInfo,
    refreshAuthToken,
    checkTokenValidity,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
