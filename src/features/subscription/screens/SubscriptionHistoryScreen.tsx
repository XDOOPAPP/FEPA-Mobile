import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useSubscription } from '../../../core/viewmodels/SubscriptionViewModel';
import type { UserSubscription } from '../../../core/models/Subscription';

interface SubscriptionHistoryScreenProps {
  navigation: any;
}

export const SubscriptionHistoryScreen: React.FC<SubscriptionHistoryScreenProps> = ({
  navigation,
}) => {
  const { subscriptionState, getHistory, isLoading, error } = useSubscription();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      await getHistory();
    } catch (err) {
      console.error('Error loading subscription history:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#27ae60';
      case 'EXPIRED':
        return '#e67e22';
      case 'CANCELLED':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hoạt động';
      case 'EXPIRED':
        return 'Hết hạn';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'INACTIVE':
        return 'Không hoạt động';
      default:
        return status;
    }
  };

  if (isLoading && subscriptionState.history.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  if (error && subscriptionState.history.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lỗi: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử đăng ký</Text>
      </View>

      {subscriptionState.history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có lịch sử đăng ký</Text>
        </View>
      ) : (
        <FlatList
          data={subscriptionState.history}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <SubscriptionHistoryItem item={item} />}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      )}
    </View>
  );
};

interface SubscriptionHistoryItemProps {
  item: UserSubscription;
}

const SubscriptionHistoryItem: React.FC<SubscriptionHistoryItemProps> = ({ item }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#27ae60';
      case 'EXPIRED':
        return '#e67e22';
      case 'CANCELLED':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hoạt động';
      case 'EXPIRED':
        return 'Hết hạn';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'INACTIVE':
        return 'Không hoạt động';
      default:
        return status;
    }
  };

  return (
    <View style={styles.historyItem}>
      <View style={styles.itemHeader}>
        <View>
          <Text style={styles.itemTier}>{item.tier === 'PREMIUM' ? '⭐ Premium' : '○ Free'}</Text>
          <Text style={styles.itemDate}>
            {formatDate(item.startDate)}
            {item.endDate && ` - ${formatDate(item.endDate)}`}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ID:</Text>
          <Text style={styles.detailValue}>{item.id.substring(0, 8)}...</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Gia hạn tự động:</Text>
          <Text style={styles.detailValue}>{item.autoRenew ? 'Có' : 'Không'}</Text>
        </View>
        {item.plan && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gói:</Text>
            <Text style={styles.detailValue}>{item.plan.name}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTier: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
});

export default SubscriptionHistoryScreen;
