import { useCallback, useState, useEffect } from 'react';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
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
        if (response.twoFactorRequired) {
          setAuthState(prev => ({
            ...prev,
            user: response.user ?? null,
            isAuthenticated: false,
            token: null,
          }));
          return response;
        }

        const authToken = response.token ?? response.accessToken ?? '';

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
        const errorMsg = error?.message || error?.response?.data?.message || 'Login failed';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  /*
  // Configure Google Signin
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID', // TODO: Get this from google-services.json or .env
    });
  }, []);
  */

  /*
  // Login with Google
  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const googleResponse = await GoogleSignin.signIn();
      const result: any = googleResponse;
      const idToken = result.data?.idToken || result.idToken;
      const user = result.data?.user || result.user;

      if (!idToken) throw new Error('No ID token found');
      
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const firebaseUserCredential = await auth().signInWithCredential(googleCredential);
      const firebaseUser = firebaseUserCredential.user;

      const apiResponse = await userRepository.socialLogin({
        idToken: idToken,
        provider: 'google',
      });

      const authToken = apiResponse.token ?? apiResponse.accessToken ?? '';

      setAuthState(prev => ({
        ...prev,
        user: apiResponse.user ?? null,
        isAuthenticated: true,
        token: authToken || null,
      }));

      setSuccess('Login successful');
      return {
        ...apiResponse,
        token: authToken || apiResponse.token,
        accessToken: apiResponse.accessToken ?? (authToken || apiResponse.token),
      };

    } catch (error: any) {
      setError(error.message || 'Google Sign-In failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSuccess, clearMessages]);
  */

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
        const errorMsg = error?.message || error?.response?.data?.message || 'Registration failed';
        setError(errorMsg);
        throw new Error(errorMsg);
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
        let finalError = error;
        // Handle specific 400 bad request for invalid OTP
        if (error.response?.status === 400 || error.message?.includes('Invalid or expired OTP')) {
          const msg = 'Mã OTP không đúng hoặc đã hết hạn.';
          setError(msg);
          finalError = new Error(msg);
        } else {
          setError(error.message || 'OTP verification failed');
        }
        throw finalError;
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

  const requestTwoFactor = useCallback(
    async (action: 'enable' | 'disable') => {
      setLoading(true);
      clearMessages();
      try {
        const response = await userRepository.requestTwoFactor(action);
        setSuccess('OTP đã được gửi');
        return response;
      } catch (error: any) {
        setError(error.message || 'Failed to request 2FA');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  const confirmTwoFactor = useCallback(
    async (action: 'enable' | 'disable', otp: string) => {
      setLoading(true);
      clearMessages();
      try {
        const response = await userRepository.confirmTwoFactor(action, otp);
        setSuccess('2FA đã được cập nhật');
        return response;
      } catch (error: any) {
        setError(error.message || 'Failed to confirm 2FA');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  const verifyTwoFactorLogin = useCallback(
    async (tempToken: string, otp: string) => {
      setLoading(true);
      clearMessages();
      try {
        const response: LoginResponse =
          await userRepository.verifyTwoFactorLogin(tempToken, otp);
        const authToken = response.token ?? response.accessToken ?? '';

        setAuthState(prev => ({
          ...prev,
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
        setError(error.message || 'Failed to verify 2FA login');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  const resendTwoFactorLogin = useCallback(
    async (tempToken: string) => {
      setLoading(true);
      clearMessages();
      try {
        const response = await userRepository.resendTwoFactorLogin(tempToken);
        setSuccess('OTP đã được gửi lại');
        return response;
      } catch (error: any) {
        setError(error.message || 'Failed to resend 2FA OTP');
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
        let finalError = error;
        if (error.response?.status === 400 || error.message?.includes('Invalid or expired OTP')) {
           const msg = 'Mã OTP không đúng hoặc đã hết hạn.';
           setError(msg);
           finalError = new Error(msg);
        } else {
           setError(error.message || 'Failed to reset password');
        }
        throw finalError;
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
        console.log('[AuthViewModel] updateProfile error:', JSON.stringify(error, null, 2));
        // Parse error message properly
        let errorMsg = 'Failed to update profile';
        if (typeof error === 'string') {
          errorMsg = error;
        } else if (error?.message && typeof error.message === 'string') {
          errorMsg = error.message;
        } else if (error?.response?.data?.message) {
          errorMsg = typeof error.response.data.message === 'string' 
            ? error.response.data.message 
            : JSON.stringify(error.response.data.message);
        }
        setError(errorMsg);
        throw new Error(errorMsg);
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
    } catch (error: any) {
      // Ignore API error logic for logout (e.g. 404) to allow local logout
      console.warn('Logout API failed, forcing local logout:', error.message);
    } finally {
      setAuthState({
        isLoading: false,
        error: null,
        success: 'Logged out successfully',
        user: null,
        isAuthenticated: false,
        token: null,
      });
      setLoading(false);
    }
  }, [setLoading]);

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
  }, []);

  // Update Avatar URL (after Cloudinary upload)
  const updateAvatar = useCallback(
    async (avatarUrl: string) => {
      setLoading(true);
      clearMessages();
      try {
        const updatedUser = await userRepository.updateAvatar(avatarUrl);
        setAuthState(prev => ({
          ...prev,
          user: { ...prev.user, ...updatedUser },
        }));
        setSuccess('Avatar đã được cập nhật');
        return updatedUser;
      } catch (error: any) {
        setError(error.message || 'Không thể cập nhật avatar');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  return {
    authState,
    login,
    register,
    verifyOtp,
    resendOtp,
    requestTwoFactor,
    confirmTwoFactor,
    verifyTwoFactorLogin,
    resendTwoFactorLogin,
    forgotPassword,
    resetPassword,
    changePassword,
    getProfile,
    updateProfile,
    updateAvatar,
    logout,
    clearAuth,
    clearMessages,
    // loginWithGoogle,
  };
};
