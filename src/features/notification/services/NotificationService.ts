import axiosInstance from '../../../api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/api';

export interface Notification {
  _id: string;
  id?: string; // Optional id field for compatibility
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

const unwrapResponse = (res: any) => {
  // If its { data: { data: [], ... } }
  if (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data) && ('data' in res.data || 'count' in res.data)) {
    return res.data;
  }
  // Generic unwrap { data: [] }
  if (res && res.data) {
    return res; 
  }
  return res;
};

export const getNotificationsApi = async (page = 1, limit = 20): Promise<NotificationResponse> => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS, {
      params: { page, limit },
    });
    console.log('[NotificationAPI] Raw Response Body:', JSON.stringify(response.data).substring(0, 200));
    const unpacked = unwrapResponse(response.data);
    
    if (Array.isArray(unpacked)) {
      return { data: unpacked, total: unpacked.length, page: 1, limit: limit };
    }
    
    return {
      data: unpacked.data || [],
      total: unpacked.total || unpacked.data?.length || 0,
      page: unpacked.page || 1,
      limit: unpacked.limit || 20
    };
  } catch (err) {
    console.error('[NotificationAPI] Error:', err);
    throw err;
  }
};

export const markReadApi = async (id: string) => {
  // Try to find the correct ID if it's an object or just use as is
  const finalId = typeof id === 'object' ? (id as any)._id || (id as any).id : id;
  // Based on Backend Documentation, this should be a POST request
  const response = await axiosInstance.post(API_ENDPOINTS.NOTIFICATION_READ(finalId));
  return response.data;
};

export const markAllReadApi = async () => {
  // Based on Backend Documentation, this should be a POST request
  const response = await axiosInstance.post(API_ENDPOINTS.NOTIFICATION_READ_ALL);
  return response.data;
};

export const getUnreadCountApi = async (): Promise<{ count: number }> => {
  const response = await axiosInstance.get(API_ENDPOINTS.NOTIFICATION_UNREAD_COUNT);
  const unpacked = unwrapResponse(response.data);
  // Ensure we return a valid count even if the structure is odd
  if (unpacked && typeof unpacked === 'object') {
     return { count: unpacked.count ?? unpacked.unreadCount ?? 0 };
  }
  return { count: typeof unpacked === 'number' ? unpacked : 0 };
};
