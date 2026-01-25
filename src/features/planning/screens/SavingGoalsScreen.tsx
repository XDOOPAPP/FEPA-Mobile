import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  icon?: string;
  color?: string;
  deadline?: string;
};

const GOAL_ICONS = [
  { name: 'home', label: 'Nhà' },
  { name: 'car', label: 'Xe' },
  { name: 'airplane', label: 'Du lịch' },
  { name: 'gift', label: 'Quà tặng' },
  { name: 'school', label: 'Học tập' },
  { name: 'medkit', label: 'Y tế' },
  { name: 'diamond', label: 'Trang sức' },
  { name: 'phone-portrait', label: 'Điện thoại' },
  { name: 'trophy', label: 'Khác' },
];

const GOAL_COLORS = [
  '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6',
  '#3B82F6', '#10B981', '#06B6D4', '#84CC16',
];

const SavingGoalsScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('trophy');
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const totals = useMemo(() => {
    return goals.reduce(
      (acc, item) => {
        acc.target += item.target;
        acc.current += item.current;
        return acc;
      },
      { target: 0, current: 0 },
    );
  }, [goals]);

  const overallProgress = totals.target > 0 ? (totals.current / totals.target) * 100 : 0;

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_goals');
      if (stored) {
        setGoals(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load goals');
    }
  };

  const saveGoals = async (newGoals: Goal[]) => {
    try {
      await AsyncStorage.setItem('user_goals', JSON.stringify(newGoals));
    } catch (e) {
      console.error('Failed to save goals');
    }
  };

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên mục tiêu.');
      return;
    }
    const targetValue = Number(target);
    const currentValue = Number(current) || 0;
    if (!targetValue || Number.isNaN(targetValue)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền mục tiêu.');
      return;
    }

    if (editingGoal) {
      // Update existing goal
      const updatedGoals = goals.map(g =>
        g.id === editingGoal.id
          ? {
              ...g,
              name: name.trim(),
              target: targetValue,
              current: currentValue,
              icon: selectedIcon,
              color: selectedColor,
            }
          : g
      );
      setGoals(updatedGoals);
      saveGoals(updatedGoals);
    } else {
      // Add new goal
      const newGoal: Goal = {
        id: `${Date.now()}`,
        name: name.trim(),
        target: targetValue,
        current: currentValue,
        icon: selectedIcon,
        color: selectedColor,
      };
      const updatedGoals = [newGoal, ...goals];
      setGoals(updatedGoals);
      saveGoals(updatedGoals);
    }

    resetForm();
    setModalVisible(false);
  };

  const resetForm = () => {
    setName('');
    setTarget('');
    setCurrent('');
    setSelectedIcon('trophy');
    setSelectedColor(GOAL_COLORS[0]);
    setEditingGoal(null);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTarget(goal.target.toString());
    setCurrent(goal.current.toString());
    setSelectedIcon(goal.icon || 'trophy');
    setSelectedColor(goal.color || GOAL_COLORS[0]);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn muốn xóa mục tiêu này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          const updatedGoals = goals.filter(g => g.id !== id);
          setGoals(updatedGoals);
          saveGoals(updatedGoals);
        },
      },
    ]);
  };

  const handleAddProgress = (goalId: string) => {
    // For simplicity, let's use a fixed increment or navigate to edit
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    Alert.alert(
      'Thêm tiến độ',
      `Bạn muốn thêm bao nhiêu vào "${goal.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: '100.000₫',
          onPress: () => updateGoalProgress(goalId, 100000),
        },
        {
          text: '500.000₫',
          onPress: () => updateGoalProgress(goalId, 500000),
        },
        {
          text: '1.000.000₫',
          onPress: () => updateGoalProgress(goalId, 1000000),
        },
      ]
    );
  };

  const updateGoalProgress = (goalId: string, amount: number) => {
    const updatedGoals = goals.map(g =>
      g.id === goalId ? { ...g, current: g.current + amount } : g
    );
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
  };

  const renderGoalCard = ({ item }: { item: Goal }) => {
    const progress = Math.min(item.current / item.target, 1);
    const percent = Math.round(progress * 100);
    const remaining = Math.max(item.target - item.current, 0);
    const isCompleted = item.current >= item.target;
    const goalColor = item.color || GOAL_COLORS[0];

    return (
      <TouchableOpacity
        style={styles.goalCard}
        activeOpacity={0.8}
        onPress={() => handleEdit(item)}
      >
        <View style={styles.goalHeader}>
          <View style={[styles.goalIconContainer, { backgroundColor: `${goalColor}20` }]}>
            <Ionicons name={item.icon || 'trophy'} size={28} color={goalColor} />
          </View>

          <View style={styles.goalHeaderInfo}>
            <Text style={styles.goalName}>{item.name}</Text>
            <View style={styles.goalAmounts}>
              <Text style={[styles.currentAmount, { color: goalColor }]}>
                {item.current.toLocaleString()}₫
              </Text>
              <Text style={styles.targetAmount}>
                / {item.target.toLocaleString()}₫
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={isCompleted ? ['#10B981', '#059669'] : [goalColor, `${goalColor}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]}
              />
            </View>
            <Text style={[styles.percentText, { color: goalColor }]}>{percent}%</Text>
          </View>

          {!isCompleted && (
            <Text style={styles.remainingText}>
              Còn {remaining.toLocaleString()}₫
            </Text>
          )}
        </View>

        {/* Status Badge */}
        {isCompleted ? (
          <View style={[styles.statusBadge, { backgroundColor: `${Colors.success}15` }]}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={[styles.statusText, { color: Colors.success }]}>
              Hoàn thành
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addProgressButton, { borderColor: goalColor }]}
            onPress={() => handleAddProgress(item.id)}
          >
            <Ionicons name="add-circle-outline" size={16} color={goalColor} />
            <Text style={[styles.addProgressText, { color: goalColor }]}>
              Thêm tiến độ
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        resetForm();
        setModalVisible(false);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingGoal ? 'Chỉnh sửa mục tiêu' : 'Thêm mục tiêu mới'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                setModalVisible(false);
              }}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Tên mục tiêu (VD: Mua xe)"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <View style={styles.inputRow}>
            <TextInput
              placeholder="Số tiền mục tiêu"
              placeholderTextColor={Colors.textMuted}
              value={target}
              onChangeText={setTarget}
              keyboardType="numeric"
              style={[styles.input, styles.inputHalf]}
            />
            <TextInput
              placeholder="Số tiền hiện tại"
              placeholderTextColor={Colors.textMuted}
              value={current}
              onChangeText={setCurrent}
              keyboardType="numeric"
              style={[styles.input, styles.inputHalf]}
            />
          </View>

          {/* Icon Selection */}
          <Text style={styles.sectionLabel}>Chọn biểu tượng</Text>
          <View style={styles.iconGrid}>
            {GOAL_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon.name}
                style={[
                  styles.iconOption,
                  selectedIcon === icon.name && {
                    backgroundColor: Colors.primarySoft,
                    borderColor: Colors.primary,
                  },
                ]}
                onPress={() => setSelectedIcon(icon.name)}
              >
                <Ionicons
                  name={icon.name}
                  size={24}
                  color={selectedIcon === icon.name ? Colors.primary : Colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Selection */}
          <Text style={styles.sectionLabel}>Chọn màu</Text>
          <View style={styles.colorGrid}>
            {GOAL_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
            <Text style={styles.saveButtonText}>
              {editingGoal ? 'Cập nhật' : 'Thêm mục tiêu'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Summary Card */}
      <LinearGradient
        colors={Colors.successGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Tổng tiến độ</Text>
            <Text style={styles.summaryValue}>
              {totals.current.toLocaleString()}₫
            </Text>
            <Text style={styles.summarySubValue}>
              / {totals.target.toLocaleString()}₫
            </Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.goalsCount}>{goals.length}</Text>
            <Text style={styles.goalsCountLabel}>mục tiêu</Text>
          </View>
        </View>

          <View style={styles.overallProgress}>
          <View style={styles.overallProgressBar}>
            <View
              style={[
                styles.overallProgressFill,
                { width: `${Math.min(overallProgress, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.overallPercentText}>
            {Math.round(overallProgress)}%
          </Text>
        </View>
      </LinearGradient>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle" size={20} color="#FFF" />
        <Text style={styles.addButtonText}>Tạo mục tiêu mới</Text>
      </TouchableOpacity>

      {/* Goals List */}
      <FlatList
        data={goals}
        keyExtractor={item => item.id}
        renderItem={renderGoalCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyText}>Chưa có mục tiêu nào</Text>
            <Text style={styles.emptySubText}>
              Tạo mục tiêu để bắt đầu tiết kiệm
            </Text>
          </View>
        }
      />

      {renderCreateModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  summaryCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  summarySubValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  goalsCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  goalsCountLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  overallProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  overallProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  overallPercentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    minWidth: 40,
    textAlign: 'right',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  listContent: {
    paddingBottom: 100,
  },
  goalCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  goalHeaderInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  targetAmount: {
    fontSize: 13,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  progressSection: {
    marginBottom: Spacing.sm,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  remainingText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addProgressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 4,
  },
  addProgressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inputHalf: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default SavingGoalsScreen;
