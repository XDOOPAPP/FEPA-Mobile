import axios from 'axios';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../models/User';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

class UserRepository {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });

  setAuthToken(token: string) {
    this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.apiClient.defaults.headers.common['Authorization'];
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.apiClient.post(API_ENDPOINTS.LOGIN, request);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Đăng ký - Gửi OTP
   * Response: { message: "OTP sent to email. Please verify your account." }
   */
  async register(request: RegisterRequest): Promise<any> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.REGISTER,
        request,
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Xác thực OTP
   * Response: { accessToken: string, refreshToken: string }
   */
  async verifyOtp(email: string, otp: string): Promise<LoginResponse> {
    try {
      const response = await this.apiClient.post(API_ENDPOINTS.VERIFY_OTP, {
        email,
        otp,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Gửi lại OTP
   * Response: { message: "OTP resent to email" }
   */
  async resendOtp(email: string): Promise<any> {
    try {
      const response = await this.apiClient.post(API_ENDPOINTS.RESEND_OTP, {
        email,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Quên mật khẩu - Gửi OTP
   * Response: { message: "OTP sent to email. Please verify your account." }
   */
  async forgotPassword(email: string): Promise<any> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.FORGOT_PASSWORD,
        { email },
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Đặt lại mật khẩu
   * Response: { message: "Password reset successfully" }
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<any> {
    try {
      const response = await this.apiClient.post(API_ENDPOINTS.RESET_PASSWORD, {
        email,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_PROFILE);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await this.apiClient.put(
        API_ENDPOINTS.UPDATE_PROFILE,
        updates,
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Đổi mật khẩu (khi user đã authenticated)
   * Response: { message: "Password changed successfully" }
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<any> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.CHANGE_PASSWORD,
        {
          currentPassword,
          newPassword,
        },
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.apiClient.post(API_ENDPOINTS.LOGOUT);
      this.clearAuthToken();
    } catch (error: any) {
      // Vẫn clear token ngay cả khi API fail
      this.clearAuthToken();
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    // Lấy message từ backend response
    const message =
      error.response?.data?.message ||
      error.message ||
      'Có lỗi xảy ra. Vui lòng thử lại.';
    return new Error(message);
  }
}

export const userRepository = new UserRepository();
