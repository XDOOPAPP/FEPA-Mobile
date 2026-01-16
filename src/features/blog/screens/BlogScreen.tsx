import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import axiosInstance from '../../../api/axiosInstance';

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  createdAt: string;
  category: string;
  readTime: number;
}

const BlogScreen: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/blogs');
      setPosts(response.data || []);
    } catch (error: any) {
      console.error('Error loading blog posts:', error);
      // Fallback mock posts
      setPosts([
        {
          _id: '1',
          title: '10 Cách Để Tiết Kiệm 1 Triệu Đồng Mỗi Tháng',
          summary: 'Tìm hiểu các chiến lược tiết kiệm hiệu quả...',
          content:
            '1. Lập ngân sách chi tiêu hàng tháng\n2. Cắt giảm chi phí không cần thiết\n3. Dùng phương pháp 50/30/20\n4. Tiết kiệm từng khoản nhỏ\n5. Đặt mục tiêu tiết kiệm rõ ràng\n6. Tìm nguồn thu nhập thêm\n7. Tránh tiêu tiền xung động\n8. Theo dõi chi tiêu hàng ngày\n9. Sử dụng ứng dụng quản lý tài chính\n10. Chia sẻ kinh nghiệm với bạn bè',
          author: 'Chuyên gia Tài Chính',
          createdAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          category: 'Tiết Kiệm',
          readTime: 5,
        },
        {
          _id: '2',
          title: 'Hiểu Rõ Về Các Loại Hình Đầu Tư Dành Cho Người Mới',
          summary: 'Bắt đầu với những khoản đầu tư cơ bản...',
          content:
            'Các hình thức đầu tư cơ bản bao gồm: Tiết kiệm, Trái phiếu, Cổ phiếu, Bất động sản, Vàng...',
          author: 'Cố Vấn Đầu Tư',
          createdAt: new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          category: 'Đầu Tư',
          readTime: 7,
        },
        {
          _id: '3',
          title: 'Quản Lý Nợ Thông Minh - Cách Thoát Khỏi Vòng Nợ',
          summary: 'Chiến lược trả nợ hiệu quả...',
          content:
            'Để thoát khỏi vòng nợ, bạn cần: 1. Liệt kê tất cả khoản nợ 2. Ưu tiên nợ lãi cao 3. Tăng thu nhập 4. Giảm chi tiêu 5. Lập kế hoạch trả nợ rõ ràng...',
          author: 'Chuyên Gia Quản Lý Tài Chính',
          createdAt: new Date(
            Date.now() - 21 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          category: 'Quản Lý Nợ',
          readTime: 6,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderPostCard = ({ item }: { item: BlogPost }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => setSelectedPost(item)}
    >
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postCategory}>{item.category}</Text>
      </View>
      <Text style={styles.postSummary} numberOfLines={2}>
        {item.summary}
      </Text>
      <View style={styles.postFooter}>
        <Text style={styles.postMeta}>
          {item.author} • {item.readTime} phút đọc
        </Text>
        <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (selectedPost) {
    return (
      <ScrollView style={styles.container}>
        {/* Article Header */}
        <View style={styles.articleHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedPost(null)}
          >
            <Text style={styles.backButtonText}>← Quay Lại</Text>
          </TouchableOpacity>
          <Text style={styles.articleTitle}>{selectedPost.title}</Text>
        </View>

        {/* Article Meta */}
        <View style={styles.articleMeta}>
          <Text style={styles.articleAuthor}>✍️ {selectedPost.author}</Text>
          <Text style={styles.articleDate}>
            📅 {formatDate(selectedPost.createdAt)}
          </Text>
          <Text style={styles.articleReadTime}>
            ⏱️ {selectedPost.readTime} phút đọc
          </Text>
        </View>

        {/* Article Content */}
        <View style={styles.articleContent}>
          <Text style={styles.articleBody}>{selectedPost.content}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>👍</Text>
            <Text style={styles.actionButtonText}>Thích</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>💾</Text>
            <Text style={styles.actionButtonText}>Lưu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>📤</Text>
            <Text style={styles.actionButtonText}>Chia Sẻ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📖 Blog Tài Chính</Text>
        <Text style={styles.subtitle}>Kiến thức quản lý tài chính cá nhân</Text>
      </View>

      {/* Posts List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : posts.length > 0 ? (
        <FlatList
          data={posts}
          renderItem={renderPostCard}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FF5722',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#FFCCBC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  postCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  postCategory: {
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#FF5722',
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  postSummary: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postMeta: {
    fontSize: 11,
    color: '#999999',
  },
  postDate: {
    fontSize: 11,
    color: '#FF5722',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },
  articleHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FF5722',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  articleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    lineHeight: 28,
  },
  articleMeta: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  articleAuthor: {
    fontSize: 13,
    color: '#1A1A1A',
    marginBottom: 6,
  },
  articleDate: {
    fontSize: 13,
    color: '#1A1A1A',
    marginBottom: 6,
  },
  articleReadTime: {
    fontSize: 13,
    color: '#1A1A1A',
  },
  articleContent: {
    padding: 16,
  },
  articleBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFF',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '600',
  },
});

export default BlogScreen;
