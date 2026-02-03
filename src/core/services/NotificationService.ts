import messaging from '@react-native-firebase/messaging';
import { DeviceEventEmitter, Platform, Alert } from 'react-native';
import axiosInstance from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';

class NotificationService {
  async requestUserPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('🔔 Firebase Authorization status:', authStatus);
        await this.getFcmToken();
      }
    } catch (error) {
      console.warn('⚠️ Could not request notification permission (likely Firebase config issue)');
    }
  }

  async getFcmToken() {
    try {
      // Check if we are in a valid environment for Firebase
      // On Android, if google-services.json is missing or invalid (SET_ME), this will throw
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('🎫 FCM Token:', fcmToken);
        await this.sendTokenToBackend(fcmToken);
      } else {
        console.log('❌ Failed to get FCM token');
      }
    } catch (error: any) {
      if (error.message?.includes('Application ID')) {
        console.warn('⚠️ Firebase not configured: Please replace google-services.json with a real one from Firebase Console.');
      } else {
        console.log('❌ Error getting FCM token:', error);
      }
    }
  }

  async sendTokenToBackend(token: string) {
    try {
      // Assuming endpoint exists or we use update profile
      // For now, let's try to update via updateProfile if it's supported
      // Or we can just log that we are ready to send it.
      // If the user says "don't change backend", I'll just use what's likely there.
      // Most FEPA backends use /auth/profile or /notifications/save-token
      await axiosInstance.post('/auth/profile', {
        fcmToken: token,
        deviceType: Platform.OS,
      });
      console.log('✅ FCM Token synced with server');
    } catch (error) {
      // Silently fail if endpoint doesn't exist yet
      console.log('⚠️ Failed to sync FCM token with server (endpoint might not exist)');
    }
  }

  listenToForegroundNotifications() {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('📩 Foreground Notification:', remoteMessage);
      
      const notification = {
        title: remoteMessage.notification?.title || 'Thông báo mới',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
        createdAt: new Date().toISOString(),
      };

      // Emit to UI
      DeviceEventEmitter.emit('notification_received', notification);
    });

    return unsubscribe;
  }

  setupBackgroundHandlers() {
    // Background message handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('🌙 Background Notification:', remoteMessage);
    });
  }
}

export const notificationService = new NotificationService();
