import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Shadow } from '../../../constants/theme';
import { launchImageLibrary } from 'react-native-image-picker';
import { useBlog } from '../../../common/hooks/useMVVM';

const { width } = Dimensions.get('window');

const CreateBlogScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { blogId } = route.params || {};
  const isEditing = !!blogId;

  const { blogState, createBlog, updateBlog, getBlogById, uploadImage, generateSlug, clearCurrentBlog } = useBlog();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'pending' | 'published' | 'rejected'>('draft');

  useEffect(() => {
    if (isEditing) {
      loadBlog();
    }
    return () => clearCurrentBlog();
  }, [blogId]);

  const loadBlog = async () => {
    try {
      const blog = await getBlogById(blogId);
      if (blog) {
        setTitle(blog.title);
        setContent(blog.content);
        setThumbnailUrl(blog.thumbnailUrl || '');
        setAuthor(blog.author || '');
        setCurrentStatus(blog.status as any);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể tải thông tin bài viết');
      navigation.goBack();
    }
  };

  const checkPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version as string, 10);
      const permission = apiLevel >= 33 
           ? (PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES || 'android.permission.READ_MEDIA_IMAGES')
           : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      
      const granted = await PermissionsAndroid.request(permission);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  };

  const handlePickImage = async () => {
    // Nếu đang chờ duyệt hoặc đã đăng bài, không cho sửa ảnh
    if (isEditing && (currentStatus === 'pending' || currentStatus === 'published')) {
      Alert.alert('Thông báo', 'Không thể sửa bài viết đang chờ duyệt hoặc đã công khai.');
      return;
    }

    const hasPermission = await checkPermission();
    if (!hasPermission) {
      Alert.alert('Cần cấp quyền', 'Vui lòng cho phép truy cập thư viện ảnh.');
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.3, // Giảm chất lượng xuống để file nhẹ hơn
        maxWidth: 1000,
        maxHeight: 1000,
      });

      if (result.didCancel || !result.assets?.[0]?.uri) return;

      const asset = result.assets[0];
      const uri = asset.uri!;
      const mimeType = asset.type || 'image/jpeg';
      
      setUploadingImage(true);
      
      try {
        const uploadRes = await uploadImage(uri, mimeType);
        if (uploadRes?.url) {
          setThumbnailUrl(uploadRes.url);
        }
      } catch (err: any) {
        Alert.alert('Lỗi Upload', err.message || 'Không thể tải ảnh lên Hosting');
      } finally {
        setUploadingImage(false);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh');
    }
  };

  const handleSave = async (submit = false) => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tiêu đề và nội dung bài viết');
      return;
    }

    const blogData = {
      title: title.trim(),
      content: content.trim(),
      thumbnailUrl,
      author: author.trim() || undefined,
      slug: generateSlug(title),
      status: (submit ? 'pending' : 'draft') as 'pending' | 'draft',
    };

    try {
      if (isEditing) {
        // Kiểm tra status trước khi gọi cập nhật phía Mobile để báo lỗi sớm cho người dùng
        if (currentStatus === 'pending' || currentStatus === 'published') {
          Alert.alert('Thông báo', 'Bài viết đang chờ duyệt hoặc đã công khai nên không thể chỉnh sửa.');
          return;
        }
        await updateBlog(blogId, blogData);
      } else {
        await createBlog(blogData);
      }
      
      Alert.alert(
        'Thành công',
        submit ? 'Đã gửi duyệt bài viết' : 'Đã lưu bản nháp',
        [{ text: 'Đóng', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      // Bắt lỗi Forbidden từ server
      if (err.message?.includes('403') || err.message?.includes('published or pending')) {
        Alert.alert('Lỗi', 'Bài viết này hiện không thể chỉnh sửa (đang chờ duyệt hoặc đã đăng).');
      } else {
        Alert.alert('Lỗi', err.message || 'Không thể lưu bài viết');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Sửa bài viết' : 'Viết bài mới'}</Text>
        <TouchableOpacity 
          onPress={() => handleSave(false)}
          disabled={blogState.isLoading || uploadingImage}
          style={styles.saveHeaderBtn}
        >
          {blogState.isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Lưu nháp</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Thumbnail Section */}
        <TouchableOpacity 
          style={styles.imagePicker} 
          onPress={handlePickImage}
          disabled={uploadingImage}
        >
          {thumbnailUrl ? (
            <View>
              <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={24} color="#FFF" />
                <Text style={styles.imageOverlayText}>Thay đổi ảnh bìa</Text>
              </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              {uploadingImage ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
                  <Text style={styles.imagePlaceholderText}>Thêm ảnh bìa (Thumbnail)</Text>
                </>
              )}
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          {isEditing && currentStatus !== 'draft' && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                Trạng thái: {currentStatus === 'pending' ? 'Đang chờ duyệt' : currentStatus === 'published' ? 'Đã công khai' : 'Bị từ chối'}
              </Text>
            </View>
          )}

          <Text style={styles.label}>Tiêu đề bài viết</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Ví dụ: 5 bước quản lý tài chính cá nhân"
            multiline
            editable={!(isEditing && (currentStatus === 'pending' || currentStatus === 'published'))}
          />

          <Text style={styles.label}>Tên tác giả hiển thị (Tùy chọn)</Text>
          <TextInput
            style={styles.input}
            value={author}
            onChangeText={setAuthor}
            placeholder="Để trống nếu muốn dùng tên thật"
            editable={!(isEditing && (currentStatus === 'pending' || currentStatus === 'published'))}
          />

          <Text style={styles.label}>Nội dung bài viết</Text>
          <TextInput
            style={[styles.input, styles.contentArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Nội dung kiến thức bạn muốn chia sẻ..."
            multiline
            textAlignVertical="top"
            editable={!(isEditing && (currentStatus === 'pending' || currentStatus === 'published'))}
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.submitBtn, 
            (blogState.isLoading || uploadingImage || (isEditing && (currentStatus === 'pending' || currentStatus === 'published'))) && { opacity: 0.5 }
          ]}
          onPress={() => handleSave(true)}
          disabled={blogState.isLoading || uploadingImage || (isEditing && (currentStatus === 'pending' || currentStatus === 'published'))}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {blogState.isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {currentStatus === 'pending' ? 'Đang chờ duyệt...' : 'Gửi xét duyệt bài viết'}
                </Text>
                <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.tipText}>
          {isEditing && (currentStatus === 'pending' || currentStatus === 'published')
            ? '* Bài viết này đang trong quá trình xét duyệt hoặc đã đăng, không thể sửa đổi.'
            : '* Bài viết sẽ được Admin duyệt trước khi xuất bản rộng rãi.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  saveHeaderBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imagePicker: {
    width: width,
    height: 220,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  thumbnail: {
    width: width,
    height: 220,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#FFF',
    fontWeight: '600',
    marginTop: 4,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: Colors.textMuted,
    marginTop: 8,
    fontSize: 14,
  },
  form: {
    padding: 16,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusBadgeText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  contentArea: {
    minHeight: 250,
  },
  submitBtn: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Shadow.glow,
  },
  submitGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tipText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  }
});

export default CreateBlogScreen;
