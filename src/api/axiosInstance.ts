import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, API_BASE_URL } from '../constants/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 10s to 30s for emulator
  headers: { 'Content-Type': 'application/json' },
});

// Flag để tránh refresh token nhiều lần đồng thời
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Tự động thêm Token vào Header trước khi gửi request
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No token found in AsyncStorage');
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor để tự động refresh token khi 401
axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh, thêm request vào queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) {
          // Không có refresh token → clear data và reject
          await Promise.all([
            AsyncStorage.removeItem('userToken'),
            AsyncStorage.removeItem('refreshToken'),
            AsyncStorage.removeItem('userData'),
          ]);
          processQueue(error, null);
          isRefreshing = false;
          return Promise.reject(error);
        }

        // Gọi API refresh token
        const response = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
          { refreshToken: refreshToken },
        );

        const { token: newToken, refreshToken: newRefreshToken } =
          response.data;

        if (newToken) {
          // Lưu token mới
          await AsyncStorage.setItem('userToken', newToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
          }

          // Update header cho request ban đầu
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          // Process queue và retry request
          processQueue(null, newToken);
          isRefreshing = false;

          return axiosInstance(originalRequest);
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError) {
        // Refresh token thất bại → clear data và logout
        await Promise.all([
          AsyncStorage.removeItem('userToken'),
          AsyncStorage.removeItem('refreshToken'),
          AsyncStorage.removeItem('userData'),
        ]);

        processQueue(refreshError, null);
        isRefreshing = false;

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export { axiosInstance };
export default axiosInstance;
