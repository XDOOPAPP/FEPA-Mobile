import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../../constants/theme';
import { blogRepository } from '../../../core/repositories/BlogRepository';
import { Blog } from '../../../core/models/Blog';

const { width } = Dimensions.get('window');

const BlogDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { slug } = route.params;
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlog();
  }, [slug]);

  const loadBlog = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await blogRepository.getBlogBySlug(slug);
      setBlog(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải nội dung...</Text>
      </View>
    );
  }

  if (error || !blog) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.danger} />
        <Text style={styles.errorText}>{error || 'Bài viết không tồn tại'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Kiến thức tài chính</Text>
        <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Thumbnail */}
        {blog.thumbnailUrl ? (
          <Image source={{ uri: blog.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <LinearGradient colors={Colors.primaryGradient} style={styles.thumbnailPlaceholder}>
            <Ionicons name="newspaper-outline" size={64} color="#FFF" />
          </LinearGradient>
        )}

        <View style={styles.content}>
          {/* Metadata */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{blog.category || 'Tài chính'}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(blog.createdAt).toLocaleDateString('vi-VN')}
            </Text>
            <View style={styles.viewCount}>
              <Ionicons name="eye-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.viewText}>{blog.viewCount || 0}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{blog.title}</Text>

          {/* Author */}
          {blog.author && (
            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                <Text style={styles.avatarText}>{blog.author[0]}</Text>
              </View>
              <View>
                <Text style={styles.authorName}>{blog.author}</Text>
                <Text style={styles.authorTitle}>Chuyên gia FEPA</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Summary/Intro */}
          {blog.summary && (
            <Text style={styles.summary}>{blog.summary}</Text>
          )}

          <Text style={styles.blogContent}>{blog.content}</Text>
          
          {/* Image Gallery - If multiple images exist */}
          {blog.images && blog.images.length > 0 && (
            <View style={styles.galleryContainer}>
               <Text style={styles.galleryTitle}>Hình ảnh minh họa</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
                 {blog.images.map((img: string, index: number) => (
                   <TouchableOpacity key={index} activeOpacity={0.8} style={styles.galleryItem}>
                     <Image source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
                   </TouchableOpacity>
                 ))}
               </ScrollView>
            </View>
          )}
          
          <View style={styles.footerSpacing} />
        </View>
      </ScrollView>

      {/* Floating Action (Optional) */}
      <TouchableOpacity style={styles.fabAi} onPress={() => navigation.navigate('Transactions', { screen: 'AssistantChat', params: { initialMessage: `Giải thích thêm cho tôi về bài viết: ${blog.title}` } })}>
          <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.fabGradient}>
             <Ionicons name="sparkles" size={24} color="#FFF" />
          </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backIconButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    ...Typography.h4,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  shareBtn: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  thumbnail: {
    width: width,
    height: 240,
  },
  thumbnailPlaceholder: {
    width: width,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 12,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryHighlight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    lineHeight: 34,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  authorName: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  authorTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.lg,
  },
  summary: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  blogContent: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 26,
    fontSize: 16,
  },
  footerSpacing: {
    height: 80,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: 16,
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  fabAi: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      ...Shadow.glow,
  },
  fabGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
  },
  galleryContainer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  galleryTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  galleryScroll: {
    paddingRight: 20,
  },
  galleryItem: {
    width: 240,
    height: 160,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.divider,
    marginRight: 12,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
});

export default BlogDetailScreen;
