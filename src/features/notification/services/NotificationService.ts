import axiosInstance from '../../../api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  timestamp: string;
  createdAt?: string;
  sender?: string;
}

export interface NotificationResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

export const getNotificationsApi = async (page = 1, limit = 20): Promise<NotificationResponse> => {
  const response = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS, {
    params: { page, limit },
  });
  return response.data;
};

export const markReadApi = async (id: string) => {
  const response = await axiosInstance.patch(API_ENDPOINTS.NOTIFICATION_READ(id));
  return response.data;
};

export const markAllReadApi = async () => {
  const response = await axiosInstance.patch(API_ENDPOINTS.NOTIFICATION_READ_ALL);
  return response.data;
};

export const getUnreadCountApi = async (): Promise<{ count: number }> => {
  const response = await axiosInstance.get(API_ENDPOINTS.NOTIFICATION_UNREAD_COUNT);
  return response.data;
};
