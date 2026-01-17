import { useCallback, useState } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import { LoginRequest, LoginResponse, User } from '../models/User';
import { userRepository } from '../repositories/UserRepository';

export interface AuthViewModelState extends ViewModelState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export const useAuthViewModel = () => {
  const { state, setLoading, setError, setSuccess, clearMessages } =
    useBaseViewModel();
  const [authState, setAuthState] = useState<AuthViewModelState>({
    ...state,
    user: null,
    isAuthenticated: false,
    token: null,
  });

  // Login
  const login = useCallback(
    async (request: LoginRequest) => {
      setLoading(true);
      clearMessages();
      try {
        const response: LoginResponse = await userRepository.login(request);
        const authToken = response.token ?? response.accessToken ?? '';
        if (authToken) {
          userRepository.setAuthToken(authToken);
        }

        setAuthState(prev => ({
          ...prev,
          user: response.user ?? null,
          isAuthenticated: true,
          token: authToken || null,
        }));

        setSuccess('Login successful');
        return {
          ...response,
          token: authToken || response.token,
          accessToken: response.accessToken ?? (authToken || response.token),
        };
      } catch (error: any) {
        setError(error.message || 'Login failed');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  // Register
  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      setLoading(true);
      clearMessages();
      try {
        const response = await userRepository.register({
          email,
          password,
          fullName,
        });
        setSuccess('OTP sent to your email');
        return response;
      } catch (error: any) {
        setError(error.message || 'Registration failed');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  // Verify OTP
  const verifyOtp = useCallback(
    async (email: string, otp: string) => {
      setLoading(true);
      clearMessages();
      try {
        const response: LoginResponse = await userRepository.verifyOtp(
          email,
          otp,
        );
        const authToken = response.token ?? response.accessToken ?? '';
        if (authToken) {
          userRepository.setAuthToken(authToken);
        }

        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          token: authToken || null,
        }));

        setSuccess('Tài khoản đã được xác thực thành công');
        return {
          ...response,
          token: authToken || response.token,
          accessToken: response.accessToken ?? (authToken || response.token),
        };
      } catch (error: any) {
        setError(error.message || 'OTP verification failed');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  // Resend OTP
  const resendOtp = useCallback(
    async (email: string) => {
      setLoading(true);
      clearMessages();
      try {
        const response = await userRepository.resendOtp(email);
        setSuccess('OTP đã được gửi lại');
        return response;
      } catch (error: any) {
        setError(error.message || 'Failed to resend OTP');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  // Forgot Password
  const forgotPassword = useCallback(
    async (email: string) => {
      setLoading(true);
      clearMessages();
      try {
        const response = await userRepository.forgotPassword(email);
        setSuccess('OTP đã được gửi tới email của bạn');
        return response;
      } catch (error: any) {
        setError(error.message || 'Failed to send OTP');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  // Reset Password
  const resetPassword = useCallback(
    async (email: string, otp: string, newPassword: string) => {
      setLoading(true);
      clearMessages();
      try {
        const response = await userRepository.resetPassword(
          email,
          otp,
          newPassword,
        );
        setSuccess('Mật khẩu đã được cập nhật thành công');
        return response;
      } catch (error: any) {
        setError(error.message || 'Failed to reset password');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  // Change Password (when user is authenticated)
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setLoading(true);
      clearMessages();
      try {
        const response = await userRepository.changePassword(
          currentPassword,
          newPassword,
        );
        setSuccess('Mật khẩu đã được thay đổi thành công');
        return response;
      } catch (error: any) {
        setError(error.message || 'Failed to change password');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  // Get Profile
  const getProfile = useCallback(async () => {
    setLoading(true);
    try {
      const user = await userRepository.getProfile();
      setAuthState(prev => ({
        ...prev,
        user,
      }));
      return user;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch profile');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Update Profile
  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      setLoading(true);
      clearMessages();
      try {
        const updatedUser = await userRepository.updateProfile(updates);
        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }));
        setSuccess('Profile updated successfully');
        return updatedUser;
      } catch (error: any) {
        setError(error.message || 'Failed to update profile');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await userRepository.logout();
      setAuthState({
        isLoading: false,
        error: null,
        success: 'Logged out successfully',
        user: null,
        isAuthenticated: false,
        token: null,
      });
    } catch (error: any) {
      setError(error.message || 'Logout failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Clear Auth
  const clearAuth = useCallback(() => {
    setAuthState({
      isLoading: false,
      error: null,
      success: null,
      user: null,
      isAuthenticated: false,
      token: null,
    });
    userRepository.clearAuthToken();
  }, []);

  return {
    authState,
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    changePassword,
    getProfile,
    updateProfile,
    logout,
    clearAuth,
    clearMessages,
  };
};
