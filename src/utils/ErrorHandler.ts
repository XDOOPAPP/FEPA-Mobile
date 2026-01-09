/**
 * Error Handler Utility
 * Xử lý các loại lỗi khác nhau và return thông báo thân thiện
 */

export interface ApiError {
  status?: number;
  message: string;
  data?: any;
}

export class ErrorHandler {
  /**
   * Parse lỗi từ API response
   */
  static parseApiError(error: any): string {
    // Network error
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.';
    }

    // Server error (5xx)
    if (error.response?.status >= 500) {
      return 'Lỗi máy chủ. Vui lòng thử lại sau.';
    }

    // Unauthorized (401)
    if (error.response?.status === 401) {
      return 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại.';
    }

    // Forbidden (403)
    if (error.response?.status === 403) {
      return 'Bạn không có quyền truy cập tài nguyên này.';
    }

    // Not found (404)
    if (error.response?.status === 404) {
      return 'Không tìm thấy tài nguyên.';
    }

    // Bad request (400)
    if (error.response?.status === 400) {
      const data = error.response?.data;
      if (data?.message) {
        return data.message;
      }
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    }

    // Validation error
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors;
      if (Array.isArray(errors)) {
        return errors.map((e: any) => e.message || e).join('\n');
      }
      return Object.values(errors).join('\n');
    }

    // Custom error message
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Default error
    return error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }

  /**
   * Validate form fields
   */
  static validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email không được bỏ trống';
    }
    if (!emailRegex.test(email)) {
      return 'Email không hợp lệ';
    }
    return null;
  }

  static validatePassword(password: string): string | null {
    if (!password) {
      return 'Mật khẩu không được bỏ trống';
    }
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    return null;
  }

  static validateFullName(name: string): string | null {
    if (!name.trim()) {
      return 'Tên không được bỏ trống';
    }
    if (name.trim().length < 2) {
      return 'Tên phải có ít nhất 2 ký tự';
    }
    return null;
  }

  static validateAmount(amount: string): string | null {
    if (!amount.trim()) {
      return 'Số tiền không được bỏ trống';
    }
    if (isNaN(Number(amount))) {
      return 'Số tiền phải là một số';
    }
    if (Number(amount) <= 0) {
      return 'Số tiền phải lớn hơn 0';
    }
    return null;
  }

  static validateDescription(desc: string): string | null {
    if (!desc.trim()) {
      return 'Ghi chú không được bỏ trống';
    }
    if (desc.trim().length < 3) {
      return 'Ghi chú phải có ít nhất 3 ký tự';
    }
    return null;
  }

  /**
   * Get error title based on type
   */
  static getErrorTitle(error: any): string {
    if (error.response?.status >= 500) {
      return '⚠️ Lỗi máy chủ';
    }
    if (error.response?.status === 401) {
      return '🔒 Phiên hết hạn';
    }
    if (error.response?.status === 403) {
      return '🚫 Truy cập bị từ chối';
    }
    if (error.response?.status === 400) {
      return '❌ Dữ liệu không hợp lệ';
    }
    return '❌ Lỗi';
  }
}

export default ErrorHandler;
