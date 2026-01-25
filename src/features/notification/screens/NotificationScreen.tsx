import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadow } from '../../../constants/theme';
import { 
  getNotificationsApi, 
  markReadApi, 
  markAllReadApi, 
  Notification 
} from '../services/NotificationService';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadNotifications = async (pageNum: number, shouldRefresh = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      
      const res = await getNotificationsApi(pageNum, 20);
      const newItems = res.data || []; // Adjust based on actual backend response structure (res.data.data vs res.data)
      // Assuming res.data IS the array based on common patterns, or adjust if it is { data: [], meta: {} }
      // Based on service type definition above, it's NotificationResponse.data
      
      if (shouldRefresh) {
         setNotifications(newItems);
      } else {
         setNotifications(prev => [...prev, ...newItems]);
      }

      setHasMore(newItems.length >= 20);

    } catch (error) {
      console.error('Failed to load notifications', error);
      // Silent fail or toast
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadNotifications(1, true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
        setLoadingMore(true);
        const nextPage = page + 1;
        setPage(nextPage);
        loadNotifications(nextPage);
    }
  };

  const handleMarkRead = async (item: Notification) => {
    if (item.isRead) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => n._id === item._id ? { ...n, isRead: true } : n));
    try {
        await markReadApi(item._id);
    } catch (error) {
        console.error('Mark read failed');
    }
  };

  const handleMarkAllRead = () => {
      Alert.alert('Đánh dấu đã đọc', 'Bạn muốn đánh dấu tất cả là đã đọc?', [
          { text: 'Hủy', style: 'cancel' },
          { 
              text: 'Đồng ý', 
              onPress: async () => {
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  try {
                      await markAllReadApi();
                  } catch (e) {
                      console.error(e);
                  }
              }
          }
      ]);
  }

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
        style={[styles.itemCard, !item.isRead && styles.unreadCard]} 
        onPress={() => handleMarkRead(item)}
        activeOpacity={0.7}
    >
        <View style={[styles.iconContainer, { backgroundColor: !item.isRead ? Colors.primarySoft : '#F3F4F6' }]}>
            <Ionicons 
                name={item.type === 'PAYMENT' ? 'card' : 'notifications'} 
                size={20} 
                color={!item.isRead ? Colors.primary : Colors.textMuted} 
            />
        </View>
        <View style={styles.contentContainer}>
            <Text style={[styles.itemTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
            <Text style={styles.itemMessage} numberOfLines={3}>{item.message}</Text>
            <Text style={styles.itemTime}>{new Date(item.timestamp || item.createdAt || Date.now()).toLocaleString('vi-VN')}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thông báo</Text>
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionButton}>
                <Ionicons name="checkmark-done-all" size={24} color={Colors.primary} />
            </TouchableOpacity>
        </View>

        {loading && page === 1 ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
        ) : (
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                    </View>
                }
            />
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
      backgroundColor: '#FFF',
  },
  backButton: {
      padding: 4,
  },
  actionButton: {
      padding: 4,
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.textPrimary,
  },
  listContent: {
      padding: Spacing.md,
  },
  itemCard: {
      flexDirection: 'row',
      padding: Spacing.md,
      backgroundColor: '#FFF',
      borderRadius: Radius.lg,
      marginBottom: Spacing.sm,
      // borderBottomWidth: 1,
      // borderBottomColor: '#F3F4F6',
  },
  unreadCard: {
      backgroundColor: '#F5F3FF', // Light primary bg
  },
  iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
  },
  contentContainer: {
      flex: 1,
  },
  itemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: Colors.textPrimary,
      marginBottom: 4,
  },
  unreadText: {
      color: '#000',
      fontWeight: '700',
  },
  itemMessage: {
      fontSize: 13,
      color: Colors.textSecondary,
      marginBottom: 6,
      lineHeight: 18,
  },
  itemTime: {
      fontSize: 11,
      color: Colors.textMuted,
  },
  unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.primary,
      alignSelf: 'center',
      marginLeft: 4,
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 100,
  },
  emptyText: {
      color: Colors.textMuted,
      marginTop: 10,
  }
});

export default NotificationScreen;
