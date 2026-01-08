import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

interface DebtItem {
  id: string;
  name: string;
  amount: number;
  creditor: string;
  startDate: string;
  dueDate: string;
  status: 'active' | 'paid';
  interestRate?: number;
}

interface LoanItem {
  id: string;
  borrowerName: string;
  amount: number;
  loanDate: string;
  dueDate: string;
  status: 'active' | 'repaid';
}

const DebtTrackerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'debts' | 'loans'>('debts');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock debts data
  const [debts] = useState<DebtItem[]>([
    {
      id: '1',
      name: 'Thẻ tín dụng Agribank',
      amount: 5000000,
      creditor: 'Agribank',
      startDate: '2025-10-01',
      dueDate: '2026-12-01',
      status: 'active',
      interestRate: 12.5,
    },
    {
      id: '2',
      name: 'Vay tiêu dùng Vietcombank',
      amount: 10000000,
      creditor: 'Vietcombank',
      startDate: '2024-06-15',
      dueDate: '2027-06-15',
      status: 'active',
      interestRate: 8.9,
    },
    {
      id: '3',
      name: 'Vay mua xe',
      amount: 200000000,
      creditor: 'MB Bank',
      startDate: '2023-01-01',
      dueDate: '2028-01-01',
      status: 'active',
      interestRate: 6.5,
    },
  ]);

  // Mock loans data (money you lent)
  const [loans] = useState<LoanItem[]>([
    {
      id: '1',
      borrowerName: 'Nguyễn Văn A',
      amount: 2000000,
      loanDate: '2025-11-15',
      dueDate: '2026-01-15',
      status: 'active',
    },
    {
      id: '2',
      borrowerName: 'Trần Thị B',
      amount: 5000000,
      loanDate: '2025-09-01',
      dueDate: '2026-03-01',
      status: 'active',
    },
  ]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const calculateTotalDebt = () => {
    return debts.reduce((sum, debt) => sum + debt.amount, 0);
  };

  const calculateTotalLoan = () => {
    return loans.reduce((sum, loan) => sum + loan.amount, 0);
  };

  const calculateInterest = (debt: DebtItem) => {
    if (!debt.interestRate) return 0;
    return Math.round((debt.amount * debt.interestRate) / 100);
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const days = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 3600 * 24),
    );
    return Math.max(0, days);
  };

  const handleMarkAsPaid = (id: string, name: string) => {
    Alert.alert('Xác nhận thanh toán', `Đánh dấu "${name}" đã thanh toán?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: () => {
          Alert.alert(
            'Thành công',
            `${name} đã được đánh dấu là đã thanh toán`,
          );
        },
      },
    ]);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Theo dõi nợ & Cho vay</Text>
        <Text style={styles.subtitle}>Quản lý tất cả khoản nợ của bạn</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'debts' && styles.tabActive]}
          onPress={() => setActiveTab('debts')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'debts' && styles.tabTextActive,
            ]}
          >
            💳 Khoản nợ ({debts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'loans' && styles.tabActive]}
          onPress={() => setActiveTab('loans')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'loans' && styles.tabTextActive,
            ]}
          >
            🤝 Cho vay ({loans.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {activeTab === 'debts' ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng nợ</Text>
            <Text style={styles.summaryValue}>
              ₫{calculateTotalDebt().toLocaleString('vi-VN')}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Lãi suất ước tính</Text>
            <Text style={[styles.summaryValue, { color: '#E53935' }]}>
              ₫
              {debts
                .reduce((sum, debt) => sum + calculateInterest(debt), 0)
                .toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng đã cho vay</Text>
            <Text style={styles.summaryValue}>
              ₫{calculateTotalLoan().toLocaleString('vi-VN')}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Chờ thanh toán</Text>
            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
              {loans.filter(l => l.status === 'active').length} khoản
            </Text>
          </View>
        </View>
      )}

      {/* Debts List */}
      {activeTab === 'debts' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh sách khoản nợ</Text>
          {debts.map(debt => (
            <View key={debt.id} style={styles.debtCard}>
              <View style={styles.debtHeader}>
                <View style={styles.debtInfo}>
                  <Text style={styles.debtName}>{debt.name}</Text>
                  <Text style={styles.debtCreditor}>
                    Chủ nợ: {debt.creditor}
                  </Text>
                </View>
                <View
                  style={[
                    styles.debtBadge,
                    {
                      backgroundColor:
                        debt.status === 'active' ? '#E3F2FD' : '#C8E6C9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.debtBadgeText,
                      {
                        color: debt.status === 'active' ? '#1976D2' : '#388E3C',
                      },
                    ]}
                  >
                    {debt.status === 'active' ? 'Đang nợ' : 'Đã thanh toán'}
                  </Text>
                </View>
              </View>

              <View style={styles.debtAmount}>
                <Text style={styles.debtAmountValue}>
                  ₫{debt.amount.toLocaleString('vi-VN')}
                </Text>
                {debt.interestRate && (
                  <Text style={styles.debtInterest}>
                    Lãi: {debt.interestRate}%/năm
                  </Text>
                )}
              </View>

              <View style={styles.debtDates}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Bắt đầu</Text>
                  <Text style={styles.dateValue}>
                    {new Date(debt.startDate).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Hạn cuối</Text>
                  <Text
                    style={[
                      styles.dateValue,
                      {
                        color:
                          getDaysRemaining(debt.dueDate) < 30
                            ? '#E53935'
                            : '#333',
                      },
                    ]}
                  >
                    {new Date(debt.dueDate).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Còn lại</Text>
                  <Text style={styles.dateValue}>
                    {getDaysRemaining(debt.dueDate)} ngày
                  </Text>
                </View>
              </View>

              {debt.status === 'active' && (
                <TouchableOpacity
                  style={styles.markPaidButton}
                  onPress={() => handleMarkAsPaid(debt.id, debt.name)}
                >
                  <Text style={styles.markPaidText}>
                    ✓ Đánh dấu đã thanh toán
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Loans List */}
      {activeTab === 'loans' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh sách cho vay</Text>
          {loans.map(loan => (
            <View key={loan.id} style={styles.loanCard}>
              <View style={styles.loanHeader}>
                <View style={styles.loanInfo}>
                  <Text style={styles.loanName}>{loan.borrowerName}</Text>
                  <Text style={styles.loanStatus}>
                    Ngày vay:{' '}
                    {new Date(loan.loanDate).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.loanBadge,
                    {
                      backgroundColor:
                        loan.status === 'active' ? '#FFF3E0' : '#C8E6C9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.loanBadgeText,
                      {
                        color: loan.status === 'active' ? '#E65100' : '#388E3C',
                      },
                    ]}
                  >
                    {loan.status === 'active' ? 'Chờ hoàn' : 'Đã hoàn'}
                  </Text>
                </View>
              </View>

              <View style={styles.loanAmount}>
                <Text style={styles.loanAmountValue}>
                  ₫{loan.amount.toLocaleString('vi-VN')}
                </Text>
              </View>

              <View style={styles.loanDates}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Hạn thanh toán</Text>
                  <Text
                    style={[
                      styles.dateValue,
                      {
                        color:
                          getDaysRemaining(loan.dueDate) < 7
                            ? '#E53935'
                            : '#333',
                      },
                    ]}
                  >
                    {new Date(loan.dueDate).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Còn lại</Text>
                  <Text style={styles.dateValue}>
                    {getDaysRemaining(loan.dueDate)} ngày
                  </Text>
                </View>
              </View>

              {loan.status === 'active' && (
                <TouchableOpacity
                  style={styles.remindButton}
                  onPress={() => {
                    Alert.alert(
                      'Gửi nhắc nhở',
                      `Gửi nhắc nhở tới ${loan.borrowerName}?`,
                    );
                  }}
                >
                  <Text style={styles.remindButtonText}>📬 Gửi nhắc nhở</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 15,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#EEE',
    marginHorizontal: 10,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  debtCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  debtCreditor: {
    fontSize: 12,
    color: '#999',
  },
  debtBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debtBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  debtAmount: {
    marginBottom: 12,
  },
  debtAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E53935',
    marginBottom: 4,
  },
  debtInterest: {
    fontSize: 11,
    color: '#FF9800',
  },
  debtDates: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  markPaidButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  markPaidText: {
    color: '#388E3C',
    fontWeight: '600',
    fontSize: 12,
  },
  loanCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanInfo: {
    flex: 1,
  },
  loanName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  loanStatus: {
    fontSize: 12,
    color: '#999',
  },
  loanBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  loanBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loanAmount: {
    marginBottom: 12,
  },
  loanAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
  },
  loanDates: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  remindButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  remindButtonText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default DebtTrackerScreen;
