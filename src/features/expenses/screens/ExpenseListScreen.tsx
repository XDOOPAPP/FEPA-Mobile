import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { useExpense } from '../../../common/hooks/useMVVM';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthContext } from '../../../store/AuthContext';

type RootStackParamList = {
  ExpenseList: undefined;
  CreateExpense: undefined;
  EditExpense: { id: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ExpenseList'>;

interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

type SortType = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

const ExpenseListScreen: React.FC<Props> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const { expenseState, getExpenses, deleteExpense } = useExpense(
    authContext?.userToken || '',
  );
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortType, setSortType] = useState<SortType>('date-desc');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Lấy danh sách chi tiêu khi screen load
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = useCallback(async () => {
    if (authContext?.userToken) {
      await getExpenses();
    }
  }, [authContext?.userToken, getExpenses]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  }, [loadExpenses]);

  // Xóa chi tiêu
  const handleDelete = useCallback(
    (id: string, description: string) => {
      Alert.alert(
        'Xác nhận xóa',
        `Bạn có chắc muốn xóa "${description}" không?`,
        [
          { text: 'Hủy', onPress: () => {}, style: 'cancel' },
          {
            text: 'Xóa',
            onPress: async () => {
              await deleteExpense(id);
              await loadExpenses();
            },
            style: 'destructive',
          },
        ],
      );
    },
    [deleteExpense, loadExpenses],
  );

  // Lọc chi tiêu theo tìm kiếm
  const filteredExpenses = (expenseState.expenses || [])
    .filter(
      (expense: ExpenseItem) =>
        expense.description.toLowerCase().includes(searchText.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchText.toLowerCase()),
    )
    .filter(
      (expense: ExpenseItem) =>
        !selectedCategory || expense.category === selectedCategory,
    );

  // Sort expenses
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    switch (sortType) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  // Render mỗi chi tiêu
  const renderExpenseItem = ({ item }: { item: ExpenseItem }) => (
    <TouchableOpacity
      style={styles.expenseCard}
      onPress={() => navigation.navigate('EditExpense', { id: item.id })}
    >
      <View style={styles.expenseContent}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseCategory}>{item.category}</Text>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseDate}>
            {new Date(item.date).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <Text style={styles.expenseAmount}>
          ₫{item.amount.toLocaleString('vi-VN')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id, item.description)}
      >
        <Text style={styles.deleteBtnText}>Xóa</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Empty state
  if (
    !expenseState.isLoading &&
    (!sortedExpenses || sortedExpenses.length === 0)
  ) {
    return (
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm chi tiêu..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📊 Chưa có chi tiêu nào</Text>
          <Text style={styles.emptySubText}>
            Nhấn nút + để thêm chi tiêu đầu tiên
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm chi tiêu..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Sort & Filter Options */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortType === 'date-desc' && styles.filterButtonActive,
            ]}
            onPress={() => setSortType('date-desc')}
          >
            <Text
              style={[
                styles.filterText,
                sortType === 'date-desc' && styles.filterTextActive,
              ]}
            >
              📅 Mới nhất
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortType === 'date-asc' && styles.filterButtonActive,
            ]}
            onPress={() => setSortType('date-asc')}
          >
            <Text
              style={[
                styles.filterText,
                sortType === 'date-asc' && styles.filterTextActive,
              ]}
            >
              📅 Cũ nhất
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortType === 'amount-desc' && styles.filterButtonActive,
            ]}
            onPress={() => setSortType('amount-desc')}
          >
            <Text
              style={[
                styles.filterText,
                sortType === 'amount-desc' && styles.filterTextActive,
              ]}
            >
              💰 Cao nhất
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortType === 'amount-asc' && styles.filterButtonActive,
            ]}
            onPress={() => setSortType('amount-asc')}
          >
            <Text
              style={[
                styles.filterText,
                sortType === 'amount-asc' && styles.filterTextActive,
              ]}
            >
              💰 Thấp nhất
            </Text>
          </TouchableOpacity>
          {selectedCategory && (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.filterText}>✖️ Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Stats */}
      {sortedExpenses.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Tổng: ₫
            {sortedExpenses
              .reduce((sum: number, exp: ExpenseItem) => sum + exp.amount, 0)
              .toLocaleString('vi-VN')}
          </Text>
          <Text style={styles.countText}>
            ({sortedExpenses.length} giao dịch)
          </Text>
        </View>
      )}

      {/* Loading state */}
      {expenseState.isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item: ExpenseItem) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Error message */}
      {expenseState.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{expenseState.error}</Text>
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
  searchBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  filterContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filterScroll: {
    marginHorizontal: -15,
    paddingHorizontal: 15,
  },
  filterButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  countText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  listContainer: {
    padding: 15,
  },
  expenseCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  expenseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E53935',
    marginLeft: 10,
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    margin: 15,
    borderRadius: 8,
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
  },
});

export default ExpenseListScreen;
