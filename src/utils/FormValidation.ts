/**
 * FormValidation - Comprehensive form validation utility for Level 1 features
 * Handles validation for all CRUD screens with Vietnamese error messages
 */

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

interface ValidationErrors {
  [key: string]: string | null;
}

interface FormData {
  [key: string]: any;
}

/**
 * Validate a single field based on rules
 */
export const validateField = (
  fieldName: string,
  value: any,
  rules: ValidationRule,
): string | null => {
  // Check required
  if (rules.required && (!value || value.toString().trim() === '')) {
    return `${fieldName} không được để trống`;
  }

  // If not required and empty, pass
  if (!value || value.toString().trim() === '') {
    return null;
  }

  // Convert to string for string validations
  const stringValue = value.toString().trim();

  // Check minLength
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `${fieldName} phải có ít nhất ${rules.minLength} ký tự`;
  }

  // Check maxLength
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `${fieldName} không được vượt quá ${rules.maxLength} ký tự`;
  }

  // Convert to number for number validations
  if (rules.min !== undefined || rules.max !== undefined) {
    const numValue = parseFloat(stringValue);
    if (isNaN(numValue)) {
      return `${fieldName} phải là một số hợp lệ`;
    }

    if (rules.min !== undefined && numValue < rules.min) {
      return `${fieldName} phải lớn hơn hoặc bằng ${rules.min}`;
    }

    if (rules.max !== undefined && numValue > rules.max) {
      return `${fieldName} không được vượt quá ${rules.max}`;
    }
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return rules.message || `${fieldName} định dạng không hợp lệ`;
  }

  // Check custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
};

/**
 * Validate entire form
 */
export const validateForm = (
  data: FormData,
  rules: Record<string, ValidationRule>,
): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach(fieldName => {
    const error = validateField(fieldName, data[fieldName], rules[fieldName]);
    errors[fieldName] = error;
  });

  return errors;
};

/**
 * Check if form has any errors
 */
export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== null);
};

/**
 * Get first error in form
 */
export const getFirstError = (errors: ValidationErrors): string | null => {
  for (const error of Object.values(errors)) {
    if (error !== null) {
      return error;
    }
  }
  return null;
};

/**
 * Pre-built validation schemas for common fields
 */
export const ValidationSchemas = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email không hợp lệ',
  } as ValidationRule,

  password: {
    required: true,
    minLength: 6,
  } as ValidationRule,

  passwordStrong: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
  } as ValidationRule,

  fullName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[\p{L}\s'-]*$/u,
    message: 'Tên không hợp lệ',
  } as ValidationRule,

  phoneNumber: {
    required: true,
    pattern: /^(\+84|0)[0-9]{9,10}$/,
    message: 'Số điện thoại không hợp lệ',
  } as ValidationRule,

  amount: {
    required: true,
    min: 1,
    max: 999999999,
    custom: value => {
      if (isNaN(parseFloat(value))) return 'Số tiền phải là một con số';
      return null;
    },
  } as ValidationRule,

  description: {
    required: true,
    minLength: 1,
    maxLength: 500,
  } as ValidationRule,

  budgetLimit: {
    required: true,
    min: 1000,
    max: 999999999,
    message: 'Ngân sách phải từ 1.000₫ trở lên',
  } as ValidationRule,

  category: {
    required: true,
    minLength: 1,
  } as ValidationRule,

  otp: {
    required: true,
    pattern: /^\d{6}$/,
    message: 'OTP phải gồm 6 chữ số',
  } as ValidationRule,

  month: {
    required: true,
    pattern: /^\d{4}-\d{2}$/,
    message: 'Tháng phải có định dạng YYYY-MM',
  } as ValidationRule,
};

/**
 * Create custom form validation rules
 */
export const createValidationRules = (
  schema: Record<string, any>,
): Record<string, ValidationRule> => {
  const rules: Record<string, ValidationRule> = {};

  Object.entries(schema).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const schemaKey = value as keyof typeof ValidationSchemas;
      if (schemaKey in ValidationSchemas) {
        rules[key] = ValidationSchemas[schemaKey];
      }
    } else if (typeof value === 'object') {
      rules[key] = value as ValidationRule;
    }
  });

  return rules;
};

/**
 * Real-time field validation (debounced)
 */
let validationTimeouts: Record<string, any> = {};

export const validateFieldRealtime = (
  fieldName: string,
  value: any,
  rule: ValidationRule,
  onError: (fieldName: string, error: string | null) => void,
  delay: number = 300,
): void => {
  // Clear existing timeout for this field
  if (validationTimeouts[fieldName]) {
    clearTimeout(validationTimeouts[fieldName]);
  }

  // Set new timeout
  validationTimeouts[fieldName] = setTimeout(() => {
    const error = validateField(fieldName, value, rule);
    onError(fieldName, error);
  }, delay);
};

/**
 * Clear all validation timeouts
 */
export const clearValidationTimeouts = (): void => {
  Object.values(validationTimeouts).forEach(timeout => clearTimeout(timeout));
  validationTimeouts = {};
};

/**
 * Specific field validators
 */
export const FieldValidators = {
  /**
   * Validate email format
   */
  validateEmail: (email: string): string | null => {
    if (!email || email.trim() === '') return 'Email không được để trống';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Email không hợp lệ';
    }
    return null;
  },

  /**
   * Validate password (minimum 6 chars)
   */
  validatePassword: (password: string): string | null => {
    if (!password || password.trim() === '') {
      return 'Mật khẩu không được để trống';
    }
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    return null;
  },

  /**
   * Validate strong password (8+ chars, mixed case, number, special char)
   */
  validatePasswordStrong: (password: string): string | null => {
    if (!password || password.trim() === '') {
      return 'Mật khẩu không được để trống';
    }
    if (password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
        password,
      )
    ) {
      return 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt';
    }
    return null;
  },

  /**
   * Validate full name
   */
  validateFullName: (fullName: string): string | null => {
    if (!fullName || fullName.trim() === '') {
      return 'Tên không được để trống';
    }
    if (fullName.length < 2) {
      return 'Tên phải có ít nhất 2 ký tự';
    }
    if (fullName.length > 100) {
      return 'Tên không được vượt quá 100 ký tự';
    }
    if (!/^[\p{L}\s'-]*$/u.test(fullName)) {
      return 'Tên chỉ được chứa chữ cái, dấu cách, gạch ngang và dấu ngoặc';
    }
    return null;
  },

  /**
   * Validate phone number (Vietnam format)
   */
  validatePhoneNumber: (phoneNumber: string): string | null => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return 'Số điện thoại không được để trống';
    }
    if (!/^(\+84|0)[0-9]{9,10}$/.test(phoneNumber)) {
      return 'Số điện thoại không hợp lệ (định dạng: 0812345678 hoặc +84812345678)';
    }
    return null;
  },

  /**
   * Validate amount (number, positive, max 999,999,999)
   */
  validateAmount: (amount: string | number): string | null => {
    if (amount === '' || amount === null || amount === undefined) {
      return 'Số tiền không được để trống';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return 'Số tiền phải là một con số';
    }
    if (numAmount < 1) {
      return 'Số tiền phải lớn hơn 0';
    }
    if (numAmount > 999999999) {
      return 'Số tiền không được vượt quá 999,999,999₫';
    }
    return null;
  },

  /**
   * Validate description (non-empty, max 500 chars)
   */
  validateDescription: (description: string): string | null => {
    if (!description || description.trim() === '') {
      return 'Mô tả không được để trống';
    }
    if (description.length > 500) {
      return 'Mô tả không được vượt quá 500 ký tự';
    }
    return null;
  },

  /**
   * Validate budget limit
   */
  validateBudgetLimit: (limit: string | number): string | null => {
    if (limit === '' || limit === null || limit === undefined) {
      return 'Ngân sách không được để trống';
    }
    const numLimit = typeof limit === 'string' ? parseFloat(limit) : limit;
    if (isNaN(numLimit)) {
      return 'Ngân sách phải là một con số';
    }
    if (numLimit < 1000) {
      return 'Ngân sách phải từ 1.000₫ trở lên';
    }
    if (numLimit > 999999999) {
      return 'Ngân sách không được vượt quá 999,999,999₫';
    }
    return null;
  },

  /**
   * Validate category
   */
  validateCategory: (category: string): string | null => {
    if (!category || category.trim() === '') {
      return 'Danh mục không được để trống';
    }
    return null;
  },

  /**
   * Validate OTP (6 digits)
   */
  validateOTP: (otp: string): string | null => {
    if (!otp || otp.trim() === '') {
      return 'OTP không được để trống';
    }
    if (!/^\d{6}$/.test(otp)) {
      return 'OTP phải gồm 6 chữ số';
    }
    return null;
  },

  /**
   * Validate month (YYYY-MM format)
   */
  validateMonth: (month: string): string | null => {
    if (!month || month.trim() === '') {
      return 'Tháng không được để trống';
    }
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return 'Tháng phải có định dạng YYYY-MM';
    }
    // Validate actual month value
    const [year, monthNum] = month.split('-').map(Number);
    if (monthNum < 1 || monthNum > 12) {
      return 'Tháng phải từ 01 đến 12';
    }
    return null;
  },

  /**
   * Validate date (YYYY-MM-DD format)
   */
  validateDate: (date: string): string | null => {
    if (!date || date.trim() === '') {
      return 'Ngày không được để trống';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return 'Ngày phải có định dạng YYYY-MM-DD';
    }
    // Validate actual date value
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return 'Ngày không hợp lệ';
    }
    return null;
  },

  /**
   * Validate password match
   */
  validatePasswordMatch: (
    password: string,
    confirmPassword: string,
  ): string | null => {
    if (password !== confirmPassword) {
      return 'Mật khẩu xác nhận không trùng khớp';
    }
    return null;
  },

  /**
   * Validate required field
   */
  validateRequired: (
    value: any,
    fieldName: string = 'Trường',
  ): string | null => {
    if (!value || value.toString().trim() === '') {
      return `${fieldName} không được để trống`;
    }
    return null;
  },
};

/**
 * Export all utilities as object for easier access
 */
export default {
  validateField,
  validateForm,
  hasErrors,
  getFirstError,
  ValidationSchemas,
  createValidationRules,
  validateFieldRealtime,
  clearValidationTimeouts,
  FieldValidators,
};
