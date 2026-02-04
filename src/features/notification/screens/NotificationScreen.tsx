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
import { Colors, Spacing, Radius, Shadow, Typography } from '../../../constants/theme';
import { 
  getNotificationsApi, 
  markReadApi, 
  markAllReadApi, 
  Notification 
} from '../services/NotificationService';
import { aiRepository } from '../../../core/repositories/AiRepository';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const generateAiInsight = async (items: Notification[]) => {
    if (items.length === 0) return;
    setLoadingAi(true);
    try {
      const summaryText = items.slice(0, 5).map(n => `- ${n.title}: ${n.message}`).join('\n');
      const res = await aiRepository.assistantChat({ 
        message: `Đây là các thông báo gần đây của người dùng:\n${summaryText}\n\nHãy tóm tắt ngắn gọn thành 1 câu lời khuyên hoặc nhận xét tài chính thân thiện bằng tiếng Việt.` 
      });
      setAiInsight(res.reply);
    } catch (e) {
      console.error(e);
      setAiInsight('Hãy kiểm tra các thông báo bên dưới để cập nhật tình hình tài chính của bạn.');
    } finally {
      setLoadingAi(false);
    }
  };

  const loadNotifications = async (pageNum: number, shouldRefresh = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      
      console.log('[NotificationScreen] Fetching page:', pageNum);
      const res = await getNotificationsApi(pageNum, 20);
      console.log('[NotificationScreen] API Response Data Length:', res.data?.length || 0);
      
      const newItems = res.data || [];
      
      if (shouldRefresh) {
         setNotifications(newItems);
         if (newItems.length > 0) generateAiInsight(newItems);
      } else {
         setNotifications(prev => [...prev, ...newItems]);
      }

      setHasMore(newItems.length >= 20);

    } catch (error: any) {
      console.error('[NotificationScreen] Failed to load:', error);
      // Only alert on initial load failure
      if (pageNum === 1) {
         Alert.alert('Lỗi', 'Không thể tải thông báo. Vui lòng thử lại sau.');
      }
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
    setNotifications(prev => prev.map(n => (n._id === item._id || (n.id && n.id === item.id)) ? { ...n, isRead: true } : n));
    
    try {
        const idToMark = item._id || item.id;
        if (idToMark) await markReadApi(idToMark);
    } catch (error) {
        console.warn('[NotificationScreen] Mark read failed for ID:', item._id);
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

  const renderAiSummary = () => {
    if (!aiInsight && !loadingAi) return null;
    return (
      <View style={styles.aiSummaryContainer}>
        <View style={styles.aiHeader}>
          <View style={styles.aiTitleRow}>
            <Ionicons name="sparkles" size={18} color="#8B5CF6" />
            <Text style={styles.aiTitle}>Tóm tắt thông minh bởi AI</Text>
          </View>
        </View>
        <View style={styles.aiContent}>
          {loadingAi ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <Text style={styles.aiText}>{aiInsight}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
        style={[styles.itemCard, !item.isRead && styles.unreadCard]} 
        onPress={() => handleMarkRead(item)}
        activeOpacity={0.7}
    >
        <View style={[styles.iconContainer, { backgroundColor: !item.isRead ? '#F0F9FF' : '#F8FAFC' }]}>
            <Ionicons 
                name={item.type === 'PAYMENT' ? 'card' : item.type === 'BUDGET' ? 'pie-chart' : 'notifications'} 
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
                ListHeaderComponent={renderAiSummary}
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
  aiSummaryContainer: {
    backgroundColor: '#F5F3FF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E9E3FF',
  },
  aiHeader: {
    marginBottom: 8,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiTitle: {
    ...Typography.smallBold,
    color: '#7C3AED',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  aiContent: {
    minHeight: 20,
    justifyContent: 'center',
  },
  aiText: {
    ...Typography.body,
    color: '#4B5563',
    lineHeight: 20,
    fontSize: 14,
    fontStyle: 'italic',
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
