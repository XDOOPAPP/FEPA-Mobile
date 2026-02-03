import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { useBlog } from '../../../common/hooks/useMVVM';
import { Blog } from '../../../core/models/Blog';

const MyBlogsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { blogState, getMyBlogs, deleteBlog, submitForReview } = useBlog();
  const [filter, setFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    getMyBlogs(filter);
  }, [getMyBlogs, filter]);

  const onRefresh = useCallback(() => {
    getMyBlogs(filter);
  }, [getMyBlogs, filter]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa bài viết này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteBlog(id);
              Alert.alert('Thành công', 'Đã xóa bài viết');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa bài viết');
            }
          } 
        },
      ]
    );
  };

  const handleSubmit = (id: string) => {
    Alert.alert(
      'Gửi duyệt',
      'Sau khi gửi duyệt, bạn sẽ không thể chỉnh sửa bài viết cho đến khi được admin xử lý. Tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Gửi', 
          onPress: async () => {
            try {
              await submitForReview(id);
              Alert.alert('Thành công', 'Đã gửi bài viết đi chờ duyệt');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể gửi duyệt');
            }
          } 
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Đã đăng';
      case 'pending': return 'Đang chờ duyệt';
      case 'rejected': return 'Bị từ chối';
      default: return 'Bản nháp';
    }
  };

  const renderBlogItem = ({ item }: { item: Blog }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => {
        if (item.status === 'published') {
          navigation.navigate('BlogDetail', { slug: item.slug });
        } else {
          navigation.navigate('CreateBlog', { blogId: item.id });
        }
      }}
    >
      <View style={styles.cardHeader}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="document-text-outline" size={32} color={Colors.textMuted} />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.blogTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.blogDate}>
          Cập nhật: {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
        </Text>
        
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('CreateBlog', { blogId: item.id })}
            disabled={item.status === 'published' || item.status === 'pending'}
          >
            <Ionicons name="create-outline" size={18} color={(item.status === 'published' || item.status === 'pending') ? Colors.textMuted : Colors.primary} />
            <Text style={[styles.actionText, (item.status === 'published' || item.status === 'pending') && { color: Colors.textMuted }]}>Sửa</Text>
          </TouchableOpacity>

          {item.status === 'draft' && (
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => handleSubmit(item.id)}
            >
              <Ionicons name="send-outline" size={18} color="#10B981" />
              <Text style={[styles.actionText, { color: '#10B981' }]}>Gửi duyệt</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết của tôi</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateBlog')}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { label: 'Tất cả', value: undefined },
            { label: 'Bản nháp', value: 'draft' },
            { label: 'Chờ duyệt', value: 'pending' },
            { label: 'Đã đăng', value: 'published' },
            { label: 'Bị từ chối', value: 'rejected' },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.filterItem, filter === item.value && styles.filterItemActive]}
              onPress={() => setFilter(item.value)}
            >
              <Text style={[styles.filterLabel, filter === item.value && styles.filterLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {blogState.isLoading && !blogState.myBlogs.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={blogState.myBlogs}
          renderItem={renderBlogItem}
          keyExtractor={(item, index) => `my-blog-${item.id}-${index}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={blogState.isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Bạn chưa có bài viết nào</Text>
              <TouchableOpacity 
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('CreateBlog')}
              >
                <Text style={styles.emptyBtnText}>Viết bài ngay</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFF',
    ...Shadow.card,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addBtn: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: '#FFF',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    ...Shadow.card,
    overflow: 'hidden',
  },
  cardHeader: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 120,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 16,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  blogDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default MyBlogsScreen;
