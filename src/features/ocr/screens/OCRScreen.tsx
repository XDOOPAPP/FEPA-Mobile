import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePickerLib from 'expo-image-picker';
import axiosInstance from '../../../api/axiosInstance';

interface ExtractedExpense {
  amount: number;
  category: string;
  description: string;
  date: string;
  merchant?: string;
}

const OCRScreen: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedExpense | null>(
    null,
  );

  const handleSelectImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;

      if (source === 'camera') {
        const permission = await ImagePickerLib.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Lỗi', 'Cần quyền truy cập camera');
          return;
        }
        result = await ImagePickerLib.launchCameraAsync({
          mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
          allowsEditing: false,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission =
          await ImagePickerLib.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
          return;
        }
        result = await ImagePickerLib.launchImageLibraryAsync({
          mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
          allowsEditing: false,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets?.[0]) {
        setImage(result.assets[0].uri);
        setExtractedData(null);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
      console.error('Image picker error:', error);
    }
  };

  const handleExtractOCR = async () => {
    if (!image) {
      Alert.alert('Thông báo', 'Vui lòng chọn ảnh trước');
      return;
    }

    setIsProcessing(true);
    try {
      // Tạo FormData để upload ảnh
      const formData = new FormData();
      formData.append('image', {
        uri: image,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as any);

      const response = await axiosInstance.post('/ocr/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        setExtractedData({
          amount: response.data.amount || 0,
          category: response.data.category || 'Khác',
          description: response.data.description || 'Nhập từ OCR',
          date: response.data.date || new Date().toISOString(),
          merchant: response.data.merchant,
        });
      }
    } catch (error: any) {
      Alert.alert(
        'Lỗi OCR',
        error.response?.data?.message || 'Không thể xử lý ảnh',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateExpense = async () => {
    if (!extractedData) {
      return;
    }

    try {
      await axiosInstance.post('/expenses', {
        amount: extractedData.amount,
        category: extractedData.category,
        description: extractedData.description,
        date: extractedData.date,
      });

      Alert.alert('Thành công', 'Chi tiêu đã được tạo từ hóa đơn', [
        {
          text: 'OK',
          onPress: () => {
            setImage(null);
            setExtractedData(null);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tạo chi tiêu');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quét Hóa Đơn</Text>
        <Text style={styles.subtitle}>
          Chụp hoặc chọn ảnh hóa đơn để tự động nhập chi tiêu
        </Text>
      </View>

      {/* Image Display */}
      {image ? (
        <View style={styles.imageSection}>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => setImage(null)}
          >
            <Text style={styles.changeButtonText}>Thay Đổi Ảnh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderIcon}>📸</Text>
          <Text style={styles.placeholderText}>Chưa chọn ảnh</Text>
        </View>
      )}

      {/* Action Buttons */}
      {!extractedData && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleSelectImage('camera')}
            disabled={isProcessing}
          >
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Chụp Ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => handleSelectImage('gallery')}
            disabled={isProcessing}
          >
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={styles.buttonText}>Chọn Ảnh</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Extract Button */}
      {image && !extractedData && (
        <TouchableOpacity
          style={[styles.extractButton, isProcessing && styles.buttonDisabled]}
          onPress={handleExtractOCR}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.extractButtonIcon}>🔍</Text>
              <Text style={styles.extractButtonText}>
                Phân Tích Hóa Đơn (OCR)
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Extracted Data */}
      {extractedData && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>✅ Thông Tin Từ Hóa Đơn</Text>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Số Tiền:</Text>
            <Text style={styles.dataAmount}>
              ₫{extractedData.amount.toLocaleString('vi-VN')}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Danh Mục:</Text>
            <Text style={styles.dataValue}>{extractedData.category}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Ghi Chú:</Text>
            <Text style={styles.dataValue}>{extractedData.description}</Text>
          </View>

          {extractedData.merchant && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Cửa Hàng:</Text>
              <Text style={styles.dataValue}>{extractedData.merchant}</Text>
            </View>
          )}

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Ngày:</Text>
            <Text style={styles.dataValue}>
              {new Date(extractedData.date).toLocaleDateString('vi-VN')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleCreateExpense}
          >
            <Text style={styles.confirmButtonText}>✓ Tạo Chi Tiêu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setImage(null);
              setExtractedData(null);
            }}
          >
            <Text style={styles.cancelButtonText}>Quét Lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 Mẹo</Text>
        <Text style={styles.infoText}>
          • Chụp ảnh hóa đơn với ánh sáng tốt{'\n'}• Đảm bảo số tiền rõ ràng
          {'\n'}• Hệ thống sẽ tự động nhận dạng dữ liệu
        </Text>
      </View>
    </ScrollView>
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
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#E3F2FD',
  },
  placeholderSection: {
    margin: 16,
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#DDDDDD',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999999',
  },
  imageSection: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 300,
  },
  changeButton: {
    paddingVertical: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  buttonIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  extractButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  extractButtonIcon: {
    fontSize: 20,
  },
  extractButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  resultSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dataLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  dataValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  dataAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#F57C00',
    lineHeight: 18,
  },
});

export default OCRScreen;
