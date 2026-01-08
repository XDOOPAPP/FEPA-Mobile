import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  PermissionsAndroid,
  Platform,
  Image,
} from 'react-native';
// Try to import camera, but it may fail on some devices
let Camera: any = null;
let useCameraDevice: any = null;
try {
  const cameraModule = require('react-native-vision-camera');
  Camera = cameraModule.Camera;
  useCameraDevice = cameraModule.useCameraDevice;
} catch (e) {
  // Camera library not available, will use simulated camera
}

interface ScannedReceipt {
  id: string;
  storeName: string;
  totalAmount: number;
  date: string;
  category: 'food' | 'transport' | 'shopping' | 'utilities' | 'other';
  notes: string;
  items: Array<{
    name: string;
    price: number;
  }>;
}

const CATEGORIES = ['food', 'transport', 'shopping', 'utilities', 'other'];
const CATEGORY_LABELS: Record<string, string> = {
  food: '🍽️ Ăn uống',
  transport: '🚗 Giao thông',
  shopping: '🛍️ Mua sắm',
  utilities: '💡 Tiện ích',
  other: '📦 Khác',
};

const ReceiptOCRScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ScannedReceipt | null>(
    null,
  );
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ScannedReceipt['category']>('food');
  const [notes, setNotes] = useState<string>('');
  const [historyList, setHistoryList] = useState<ScannedReceipt[]>([
    {
      id: '1',
      storeName: 'Phở Quán Ngon',
      totalAmount: 35000,
      date: '2024-01-08',
      category: 'food',
      notes: 'Phở gà, cơm tấm',
      items: [
        { name: 'Phở Gà', price: 25000 },
        { name: 'Cơm Tấm', price: 10000 },
      ],
    },
    {
      id: '2',
      storeName: 'Grab/Go-Jek',
      totalAmount: 45000,
      date: '2024-01-07',
      category: 'transport',
      notes: 'Đi từ nhà đến công ty',
      items: [{ name: 'Xe Grab', price: 45000 }],
    },
  ]);

  const cameraRef = useRef<any>(null);
  const device = useCameraDevice ? useCameraDevice('back') : null;
  const cameraAvailable = !!(Camera && useCameraDevice && device);

  // Request camera permission
  useEffect(() => {
    const requestCameraPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Quyền truy cập camera',
              message: 'Ứng dụng cần quyền truy cập camera để quét hóa đơn',
              buttonNeutral: 'Hỏi lại sau',
              buttonNegative: 'Hủy',
              buttonPositive: 'Được',
            },
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setHasPermission(true);
          } else {
            Alert.alert('Lỗi', 'Cần quyền truy cập camera để tiếp tục');
          }
        } catch (err) {
          console.warn(err);
        }
      } else {
        setHasPermission(true);
      }
    };

    if (activeTab === 'scan') {
      requestCameraPermission();
    }
  }, [activeTab]);

  // Simulate OCR scanning
  const handleStartScan = useCallback(async () => {
    if (!cameraRef.current) {
      Alert.alert('Lỗi', 'Camera không khả dụng');
      return;
    }

    setIsScanning(true);

    try {
      // Simulate 2-second scan time for actual camera processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock OCR result - in production, this would use ML Kit or similar
      const mockScannedData: ScannedReceipt = {
        id: Date.now().toString(),
        storeName: 'Quán Cơm Tấm Tây',
        totalAmount: 42000,
        date: new Date().toISOString().split('T')[0],
        category: 'food',
        notes: '',
        items: [
          { name: 'Cơm Tấm Sườn Nướng', price: 32000 },
          { name: 'Nước Cam', price: 10000 },
        ],
      };

      setSelectedReceipt(mockScannedData);
      setAmount(mockScannedData.totalAmount.toString());
      setCategory(mockScannedData.category);
      setNotes(mockScannedData.notes);
      setShowConfirmModal(true);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể quét hóa đơn. Vui lòng thử lại.');
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleSaveReceipt = useCallback(() => {
    if (!selectedReceipt || !amount) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const newReceipt: ScannedReceipt = {
      ...selectedReceipt,
      totalAmount: parseFloat(amount),
      category,
      notes,
    };

    setHistoryList(prev => [newReceipt, ...prev]);
    setShowConfirmModal(false);
    setSelectedReceipt(null);
    setAmount('');
    setCategory('food');
    setNotes('');

    Alert.alert('Thành công', 'Hóa đơn đã được lưu!');
  }, [selectedReceipt, amount, category, notes]);

  const handleEditAmount = useCallback((value: string) => {
    setAmount(value);
  }, []);

  const handleCancel = useCallback(() => {
    setShowConfirmModal(false);
    setSelectedReceipt(null);
    setAmount('');
    setCategory('food');
    setNotes('');
  }, []);

  // Render Camera View
  if (activeTab === 'scan' && device == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera không khả dụng</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'scan' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('scan')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'scan' && styles.tabTextActive,
            ]}
          >
            📷 Quét mới
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'history' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.tabTextActive,
            ]}
          >
            📋 Lịch sử
          </Text>
        </TouchableOpacity>
      </View>

      {/* SCAN TAB */}
      {activeTab === 'scan' && (
        <View style={styles.scanContainer}>
          {cameraAvailable && hasPermission && device ? (
            <>
              <Camera
                ref={cameraRef}
                style={styles.camera}
                device={device}
                isActive={true}
                photo={true}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <Text style={styles.scanHint}>
                  {isScanning ? '📸 Đang quét...' : 'Đặt hóa đơn vào khung'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.simulatedCameraContainer}>
              <View style={styles.simulatedCamera}>
                <Text style={styles.simulatedCameraText}>📱 Mô phỏng Camera</Text>
                <Text style={styles.simulatedCameraSubtext}>
                  {isScanning ? '⏳ Quét hóa đơn...' : 'Chờ để quét'}
                </Text>
              </View>
              <View style={styles.scanOverlay}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <Text style={styles.scanHint}>
                  {isScanning ? '📸 Đang quét...' : 'Chế độ mô phỏng'}
                </Text>
              </View>
            </View>
          )}
                style={styles.permissionButton}
                onPress={() => setActiveTab('history')}
              >
                <Text style={styles.permissionButtonText}>
                  Xem lịch sử thay vào
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scan Button */}
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
            onPress={handleStartScan}
            disabled={isScanning || !hasPermission}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? '⏳ Quét...' : '📸 Quét hóa đơn'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <FlatList
          data={historyList}
          keyExtractor={item => item.id}
          style={styles.historyList}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historyStore}>{item.storeName}</Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
                <Text style={styles.historyAmount}>
                  {item.totalAmount.toLocaleString('vi-VN')} ₫
                </Text>
              </View>

              <View style={styles.historyCategoryContainer}>
                <Text style={styles.historyCategory}>
                  {CATEGORY_LABELS[item.category]}
                </Text>
              </View>

              {item.items.length > 0 && (
                <View style={styles.itemsContainer}>
                  <Text style={styles.itemsLabel}>
                    {item.items.length} mục:
                  </Text>
                  {item.items.slice(0, 3).map((it, idx) => (
                    <Text key={idx} style={styles.itemText}>
                      • {it.name} - {it.price.toLocaleString('vi-VN')} ₫
                    </Text>
                  ))}
                  {item.items.length > 3 && (
                    <Text style={styles.moreItems}>
                      +{item.items.length - 3} mục khác
                    </Text>
                  )}
                </View>
              )}

              {item.notes && (
                <Text style={styles.historyNotes}>📝 {item.notes}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có hóa đơn nào được lưu</Text>
            </View>
          }
          contentContainerStyle={styles.historyContent}
        />
      )}

      {/* CONFIRMATION MODAL */}
      <Modal
        visible={showConfirmModal}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Xác nhận hóa đơn</Text>
            <View style={{ width: 30 }} />
          </View>

          {selectedReceipt && (
            <View style={styles.modalContent}>
              {/* Store Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Cửa hàng</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={selectedReceipt.storeName}
                  editable={false}
                />
              </View>

              {/* Amount */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Tổng tiền *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số tiền"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={handleEditAmount}
                />
              </View>

              {/* Date */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Ngày</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={selectedReceipt.date}
                  editable={false}
                />
              </View>

              {/* Category */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Danh mục</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        category === cat && styles.categoryOptionActive,
                      ]}
                      onPress={() =>
                        setCategory(cat as ScannedReceipt['category'])
                      }
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          category === cat && styles.categoryOptionTextActive,
                        ]}
                      >
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Notes */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Ghi chú</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Thêm ghi chú..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>

              {/* Items List */}
              {selectedReceipt.items.length > 0 && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Chi tiết hóa đơn</Text>
                  {selectedReceipt.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>
                        {item.price.toLocaleString('vi-VN')} ₫
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveReceipt}
                >
                  <Text style={styles.saveButtonText}>💾 Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#2196F3',
  },
  scanContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 80,
    left: 20,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFD700',
  },
  cornerTR: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFD700',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFD700',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFD700',
  },
  scanHint: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanButton: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  noPermissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  simulatedCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulatedCamera: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulatedCameraText: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '700',
    marginBottom: 10,
  },
  simulatedCameraSubtext: {
    fontSize: 16,
    color: '#AAA',
  },
  historyList: {
    flex: 1,
  },
  historyContent: {
    padding: 12,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyStore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  historyCategoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  historyCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  itemsContainer: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  itemText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  historyNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  modalContent: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginBottom: 0,
  },
  categoryOption: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryOptionActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  categoryOptionTextActive: {
    color: '#FFF',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  itemName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EEE',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default ReceiptOCRScreen;
