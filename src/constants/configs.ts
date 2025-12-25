import { Platform } from 'react-native';


const BASE_IP = Platform.OS === 'android' ? '192.168.1.133' : 'localhost';

export const SERVICES = {
  AUTH: `http://${BASE_IP}:3001`,    // Port của Auth Service
  EXPENSE: `http://${BASE_IP}:3002`, // Port của Expense Service
};

export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: `${SERVICES.AUTH}/api/v1/auth/register`,
  LOGIN: `${SERVICES.AUTH}/api/v1/auth/login`, 
  REFRESH: `${SERVICES.AUTH}/api/v1/auth/refresh`,
  ME: `${SERVICES.AUTH}/api/v1/auth/me`,
  
  // Expense endpoints
  GET_EXPENSES: `${SERVICES.EXPENSE}/api/v1/expenses`,
};