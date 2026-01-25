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
    const subscription = DeviceEventEmitter.addListener('notification_received', (payload) => {
      // Handle payload structure from backend
      // Might be payload.data or payload directly
      const displayData = payload.notification || payload; 
      
      setData(displayData);
      setVisible(true);
      
      // Start animation
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideAnimation();
      }, 4000);

      return () => clearTimeout(timer);
    });

    return () => {
      subscription.remove();
    };
  }, []);

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

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={hideAnimation}>
        <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={20} color="#FFF" />
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
