import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User } from '../types/auth';
import { getMeApi, refreshTokenApi } from '../features/auth/authService';
import axiosInstance from '../api/axiosInstance';
import { API_ENDPOINTS } from '../constants/api';
import { notificationService } from '../core/services/NotificationService';
import { database } from '../database';

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

const DEMO_PREMIUM_KEY = 'demo_premium_enabled';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPremiumServer, setIsPremiumServer] = useState(false);
  const [isDemoPremium, setIsDemoPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<string | null>(null);

  // Premium is true if either server says so OR demo mode is active
  const isPremium = isPremiumServer || isDemoPremium;
  
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

    // Xóa local database (WatermelonDB) để tránh hiển thị data của user khác
    try {
      await database.write(async () => {
        await database.unsafeResetDatabase();
      });
      console.log('[AuthContext] Local database cleared on logout');
    } catch (error) {
      console.error('[AuthContext] Failed to clear local database:', error);
    }
  }, []);

  // Helper function to check premium status from server
  const checkPremiumStatus = async () => {
    try {
      const { data } = await axiosInstance.get(API_ENDPOINTS.SUBSCRIPTION_CURRENT);
      if (data && data.status === 'ACTIVE') {
        setIsPremiumServer(true);
        setPremiumExpiry(data.endDate);
      } else {
        setIsPremiumServer(false);
        setPremiumExpiry(null);
      }
    } catch (error) {
       // Silent error or fallback
       console.log('Check premium status failed (possibly free user)');
       setIsPremiumServer(false);
    }
    
    // Also load demo premium status from local storage
    try {
      const demoStatus = await AsyncStorage.getItem(DEMO_PREMIUM_KEY);
      setIsDemoPremium(demoStatus === 'true');
    } catch (e) {
      console.log('Failed to load demo premium status');
    }
  };

  // Activate demo premium mode (local only, no backend)
  const activateDemoPremium = useCallback(async () => {
    setIsDemoPremium(true);
    await AsyncStorage.setItem(DEMO_PREMIUM_KEY, 'true');
    console.log('[AuthContext] Demo Premium ACTIVATED');
  }, []);

  // Deactivate demo premium mode
  const deactivateDemoPremium = useCallback(async () => {
    setIsDemoPremium(false);
    await AsyncStorage.removeItem(DEMO_PREMIUM_KEY);
    console.log('[AuthContext] Demo Premium DEACTIVATED');
  }, []);

  // Load user info từ API
  const loadUserInfo = useCallback(async () => {
    if (!userToken) return;

    try {
      const userData = await getMeApi();
      setUser(userData);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Check premium Status independently
      await checkPremiumStatus();
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
    console.log('[AuthContext] useEffect triggered, loading storage data');
    const loadStorageData = async () => {
      try {
        console.log('[AuthContext] Starting to load from AsyncStorage');
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

          // Verify token và load user info từ API (blocking để đảm bảo state đúng nhất)
          try {
            await loadUserInfo();
          } catch (error: any) {
            console.error('Token validation failed:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
              await clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error loading storage data:', error);
      } finally {
        console.log('[AuthContext] Setting isLoading to false');
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
        // Check premium immediately if user data provided
        checkPremiumStatus();
      } else {
        // Nếu chưa có userData, load từ API (which includes checkPremiumStatus)
        try {
          await loadUserInfo();
        } catch (error) {
          console.error('Error loading user info after login:', error);
        }
      }
    },
    [loadUserInfo],
    // Removed checkPremiumStatus from dependency array as it is defined inside component scope
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
    isDemoPremium,
    login,
    logout,
    loadUserInfo,
    refreshAuthToken,
    checkTokenValidity,
    updateUser,
    activateDemoPremium,
    deactivateDemoPremium,
  };

  // notification (Firebase) Management
  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;

    if (userToken) {
      console.log('[AuthContext] Initializing NotificationService');
      // Request permission and get token
      notificationService.requestUserPermission().catch(err => {
        console.error('[AuthContext] Notification permission error:', err);
      });
      
      // Listen for foreground messages
      unsubscribeForeground = notificationService.listenToForegroundNotifications();
    }

    return () => {
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
    };
  }, [userToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
