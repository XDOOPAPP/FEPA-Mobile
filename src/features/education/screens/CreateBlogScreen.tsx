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
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
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
  const [summary, setSummary] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

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
        setAuthor(blog.authorName || '');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', ' không thể tải thông tin bài viết');
      navigation.goBack();
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'android') {
      try {
        const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version as string, 10);
        
        // Safety check for API 33 permission constant
        const permission = apiLevel >= 33 
             ? (PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES || 'android.permission.READ_MEDIA_IMAGES')
             : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        
        const granted = await PermissionsAndroid.request(permission);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Cần cấp quyền', 'Vui lòng cho phép truy cập thư viện ảnh để tải lên.');
            return;
        }
      } catch (err) {
        console.warn('Permission err:', err);
      }
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
      });

      if (result.didCancel) return;
      if (result.assets && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        console.log('Selected image URI:', uri);
        
        setUploadingImage(true);
        try {
          const uploadRes = await uploadImage(uri);
          console.log('Upload success result:', uploadRes);
          if (uploadRes && uploadRes.url) {
            setThumbnailUrl(uploadRes.url);
          } else {
            throw new Error('Không nhận được URL ảnh từ server');
          }
        } catch (err: any) {
          console.error('Upload image error:', err);
          Alert.alert('Lỗi', err.message || 'Không thể upload ảnh');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (err) {
      console.error('Pick image error:', err);
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh');
    }
  };

  const handleSave = async (submit = false) => {
    if (!title || !content) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ tiêu đề và nội dung');
      return;
    }

    const data = {
      title,
      content,
      thumbnailUrl,
      author: author || undefined,
      slug: generateSlug(title),
      status: (submit ? 'pending' : 'draft') as 'pending' | 'draft',
    };

    try {
      if (isEditing) {
        await updateBlog(blogId, data);
      } else {
        await createBlog(data);
      }
      
      Alert.alert(
        'Thành công',
        submit ? 'Đã gửi duyệt bài viết' : 'Đã lưu bản nháp',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu bài viết');
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
          disabled={blogState.isLoading}
          style={styles.saveHeaderBtn}
        >
          {blogState.isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Thumbnail Picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {thumbnailUrl ? (
            <View>
              <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={24} color="#FFF" />
                <Text style={styles.imageOverlayText}>Đổi ảnh bìa</Text>
              </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              {uploadingImage ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
                  <Text style={styles.imagePlaceholderText}>Thêm ảnh bìa bài viết</Text>
                </>
              )}
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.label}>Tiêu đề bài viết</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Nhập tiêu đề ấn tượng..."
            multiline
          />

          <Text style={styles.label}>Tên tác giả hển thị (tuỳ chọn)</Text>
          <TextInput
            style={styles.input}
            value={author}
            onChangeText={setAuthor}
            placeholder="Mặc định là tên của bạn"
          />

          <Text style={styles.label}>Nội dung bài viết</Text>
          <TextInput
            style={[styles.input, styles.contentArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Chia sẻ kiến thức của bạn tại đây..."
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={styles.submitBtn}
          onPress={() => handleSave(true)}
          disabled={blogState.isLoading}
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
                <Text style={styles.submitBtnText}>Gửi duyệt bài viết</Text>
                <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.tipText}>
          * Lưu ý: Bài viết của bạn sẽ được admin kiểm duyệt trước khi hiển thị công khai.
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
    height: 200,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  thumbnail: {
    width: width,
    height: 200,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
