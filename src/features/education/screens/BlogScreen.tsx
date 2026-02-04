import React, { useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { useBlog } from '../../../common/hooks/useMVVM';
import { Blog } from '../../../core/models/Blog';

const BlogScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { blogState, getBlogs } = useBlog();

  useFocusEffect(
    useCallback(() => {
      getBlogs(true);
    }, [getBlogs])
  );

  const onRefresh = useCallback(() => {
    getBlogs(true);
  }, [getBlogs]);

  const renderBlogItem = ({ item }: { item: Blog }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => {
        navigation.navigate('BlogDetail', { slug: item.slug });
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
                {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
            </Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        
        <View style={styles.cardFooter}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                  <Ionicons name="eye-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.statText}>{item.viewCount || 0}</Text>
              </View>
              <View style={[styles.statItem, { marginLeft: 12 }]}>
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.statText}>
                    {Math.max(1, Math.ceil((item.content?.split(' ').length || 0) / 200))} phút đọc
                  </Text>
              </View>
            </View>
            <View style={styles.readMoreContainer}>
                <Text style={styles.readMore}>Đọc thêm</Text>
                <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View>
              <Text style={styles.headerTitle}>Blog & Kiến thức</Text>
              <Text style={styles.headerSubtitle}>Làm chủ tài chính cùng chuyên gia FEPA</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('MyBlogs')} 
                style={styles.iconBtn}
              >
                <Ionicons name="document-text-outline" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {blogState.isLoading && !blogState.blogs.length ? (
         <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color={Colors.primary} />
             <Text style={styles.loadingText}>Đang tải bài viết...</Text>
         </View>
      ) : (
          <FlatList
            data={blogState.blogs.filter(b => b.status?.toString().toLowerCase() === 'published')}
            keyExtractor={(item, index) => `blog-${item.id}-${index}`}
            renderItem={renderBlogItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={blogState.isLoading} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
                </View>
            }
          />
      )}

      {/* Floating Action Button for Create Blog */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateBlog')}
      >
        <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.fabGradient}
        >
            <Ionicons name="create" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Shadow.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: '#FFF',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
      height: 160,
  },
  cardImagePlaceholder: {
      width: '100%',
      height: 160,
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
      backgroundColor: Colors.primaryHighlight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
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
    ...Typography.bodyBold,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  cardSummary: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: Colors.divider,
      paddingTop: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
  },
  statText: {
      fontSize: 11,
      color: Colors.textMuted,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMore: {
      fontSize: 13,
      fontWeight: '700',
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
      marginTop: 60,
  },
  emptyText: {
      marginTop: 12,
      color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...Shadow.glow,
    elevation: 5,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default BlogScreen;
