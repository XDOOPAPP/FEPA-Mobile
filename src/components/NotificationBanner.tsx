import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  DeviceEventEmitter,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Shadow, Spacing, Radius } from '../constants/theme';

export const NotificationBanner = () => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<any>(null);
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    // Listen for regular notifications
    const notifySubscription = DeviceEventEmitter.addListener('notification_received', (payload) => {
      const displayData = payload.notification || payload; 
      
      setData({ ...displayData, alertType: 'info' });
      showNotification();
    });

    // Listen for budget alerts
    const budgetSubscription = DeviceEventEmitter.addListener('budget_alert', (payload) => {
      setData({
        title: payload.title,
        body: payload.message,
        alertType: payload.type, // 'exceeded', 'warning', 'threshold'
        budgetId: payload.budgetId,
      });
      showNotification();
    });

    return () => {
      notifySubscription.remove();
      budgetSubscription.remove();
    };
  }, []);

  const showNotification = () => {
    setVisible(true);
    
    // Start animation
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    // Auto hide after 5 seconds
    setTimeout(() => {
      hideAnimation();
    }, 5000);
  };

  const hideAnimation = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setData(null);
    });
  };

  if (!visible || !data) return null;

  // Dynamic colors based on alert type
  const getAlertColors = () => {
    switch (data.alertType) {
      case 'exceeded':
        return { bg: '#EF4444', border: '#EF4444', icon: 'warning' };
      case 'warning':
      case 'threshold':
        return { bg: '#F59E0B', border: '#F59E0B', icon: 'alert-circle' };
      default:
        return { bg: Colors.primary, border: Colors.primary, icon: 'notifications' };
    }
  };
  
  const alertColors = getAlertColors();

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: alertColors.border }]} 
        activeOpacity={0.9} 
        onPress={hideAnimation}
      >
        <View style={[styles.iconContainer, { backgroundColor: alertColors.bg }]}>
            <Ionicons name={alertColors.icon as any} size={20} color="#FFF" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{data.title || 'Thông báo mới'}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {data.body || data.message || 'Bạn có một thông báo mới từ hệ thống.'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 9999, // Ensure it floats on top
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
