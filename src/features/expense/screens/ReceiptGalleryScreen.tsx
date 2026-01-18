import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import {
  deleteReceipt,
  getReceipts,
  ReceiptItem,
} from '../../../utils/receiptStorage';

const ReceiptGalleryScreen: React.FC = () => {
  const [items, setItems] = useState<ReceiptItem[]>([]);

  const loadReceipts = useCallback(async () => {
    const data = await getReceipts();
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts]),
  );

  const handleDelete = (id: string) => {
    Alert.alert('Xóa hóa đơn', 'Bạn muốn xóa hóa đơn này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await deleteReceipt(id);
          loadReceipts();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hóa đơn</Text>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có hóa đơn nào.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.amount}>
                  {(item.amount || 0).toLocaleString()}₫
                </Text>
                <Text style={styles.metaText}>
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </Text>
                {item.category ? (
                  <Text style={styles.metaText}>{item.category}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: Radius.md,
    backgroundColor: Colors.border,
  },
  metaRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  deleteText: {
    color: '#FFF',
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },
});

export default ReceiptGalleryScreen;
