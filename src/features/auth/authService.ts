import axios from 'axios';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import axiosInstance from '../../api/axiosInstance';

// Đăng ký tài khoản mới
export const registerApi = async (email: string, password: string, fullName: string) => {
  try {
    // Dùng axios thường vì lúc này chưa có Token
    const response = await axios.post(API_ENDPOINTS.REGISTER, { 
      email: email, 
      password: password,
      fullName: fullName
    });
    
    return response.data; 
  } catch (error: any) {
    // Ném lỗi ra để phía màn hình (UI) bắt được và hiển thị thông báo
    throw error.response ? error.response.data : new Error("Lỗi kết nối Server");
  }
};

// Đăng nhập
export const loginApi = async (email: string, password: string) => {
  try {
    // Dùng axios thường vì lúc này chưa có Token
    const response = await axios.post(API_ENDPOINTS.LOGIN, { 
      email: email, 
      password: password 
    });
    
    return response.data; 
  } catch (error: any) {
    // Ném lỗi ra để phía màn hình (UI) bắt được và hiển thị thông báo
    throw error.response ? error.response.data : new Error("Lỗi kết nối Server");
  }
};

// Làm mới token
export const refreshTokenApi = async (refreshToken: string) => {
  try {
    // Dùng axios thường vì refresh token được gửi trong body
    const response = await axios.post(API_ENDPOINTS.REFRESH, { 
      refreshToken: refreshToken
    });
    
    return response.data; 
  } catch (error: any) {
    throw error.response ? error.response.data : new Error("Lỗi kết nối Server");
  }
};

// Lấy thông tin user hiện tại
export const getMeApi = async () => {
  try {
    // Dùng axiosInstance vì cần token trong header
    const response = await axiosInstance.get(API_ENDPOINTS.GET_PROFILE);
    
    return response.data; 
  } catch (error: any) {
    throw error.response ? error.response.data : new Error("Lỗi kết nối Server");
  }
};