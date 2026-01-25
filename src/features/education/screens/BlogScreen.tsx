import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { useBlog } from '../../../common/hooks/useMVVM';
import { Blog } from '../../../core/models/Blog';

const BlogScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { blogState, getBlogs } = useBlog();

  useEffect(() => {
    getBlogs();
  }, [getBlogs]);

  const onRefresh = useCallback(() => {
    getBlogs(true);
  }, [getBlogs]);

  const renderBlogItem = ({ item }: { item: Blog }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => {
        // navigation.navigate('ArticleDetail', { slug: item.slug });
      }}
    >
        {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
             <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.cardImagePlaceholder}>
                 <Ionicons name="newspaper-outline" size={32} color="#FFF" />
             </LinearGradient>
        )}
      
      <View style={styles.cardContent}>
        <View style={styles.tagRow}>
            <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{item.category || 'Tài chính'}</Text>
            </View>
            <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardSummary} numberOfLines={3}>{item.summary}</Text>
        
        <View style={styles.cardFooter}>
            <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.statText}>{item.viewCount || 0}</Text>
            </View>
            <Text style={styles.readMore}>Đọc tiếp</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.headerTitle}>Blog & Kiến thức</Text>
          <Text style={styles.headerSubtitle}>Nâng cao hiểu biết tài chính của bạn</Text>
      </View>

      {blogState.isLoading && !blogState.blogs.length ? (
         <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color={Colors.primary} />
             <Text style={styles.loadingText}>Đang tải bài viết...</Text>
         </View>
      ) : (
          <FlatList
            data={blogState.blogs}
            keyExtractor={item => item.id}
            renderItem={renderBlogItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={blogState.isLoading} onRefresh={onRefresh} colors={[Colors.primary]} />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
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
    backgroundColor: Colors.background,
  },
  header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.md,
      backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginTop: 4,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
    ...Shadow.card,
    overflow: 'hidden',
  },
  cardImage: {
      width: '100%',
      height: 150,
  },
  cardImagePlaceholder: {
      width: '100%',
      height: 150,
      alignItems: 'center',
      justifyContent: 'center',
  },
  cardContent: {
      padding: Spacing.md,
  },
  tagRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
  },
  categoryTag: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
  },
  categoryText: {
      fontSize: 10,
      fontWeight: '700',
      color: Colors.primary,
      textTransform: 'uppercase',
  },
  dateText: {
      fontSize: 11,
      color: Colors.textMuted,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
  },
  statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
  },
  statText: {
      fontSize: 12,
      color: Colors.textMuted,
  },
  readMore: {
      fontSize: 13,
      fontWeight: '600',
      color: Colors.primary,
  },
  loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
  },
  loadingText: {
      marginTop: 12,
      color: Colors.textSecondary,
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 40,
  },
  emptyText: {
      marginTop: 12,
      color: Colors.textSecondary,
  },
});

export default BlogScreen;
