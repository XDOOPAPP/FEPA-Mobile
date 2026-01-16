// User interface
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  // Có thể thêm các field khác tùy theo API response
}

// Auth response từ API
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user?: User;
}

// AuthContext Type
export interface AuthContextType {
  // State
  userToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  premiumExpiry: string | null;

  // Functions
  login: (
    token: string,
    refreshToken?: string,
    userData?: User,
  ) => Promise<void>;
  logout: () => Promise<void>;
  loadUserInfo: () => Promise<void>;
  refreshAuthToken: () => Promise<boolean>;
  checkTokenValidity: () => Promise<boolean>;
  updateUser: (userData: User) => void;
}
