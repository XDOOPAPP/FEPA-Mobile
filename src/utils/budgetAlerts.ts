import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Budget, BudgetWithProgress } from '../core/models/Budget';

const STORAGE_KEY = '@budget_alerts';
const THRESHOLDS = [50, 80, 100];

type AlertStore = Record<string, number[]>;

const getAlertStore = async (): Promise<AlertStore> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AlertStore) : {};
  } catch {
    return {};
  }
};

const saveAlertStore = async (store: AlertStore) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const wasNotified = (
  store: AlertStore,
  budgetId: string,
  threshold: number,
) => {
  return store[budgetId]?.includes(threshold) ?? false;
};

const markNotified = (
  store: AlertStore,
  budgetId: string,
  threshold: number,
) => {
  const current = store[budgetId] || [];
  if (!current.includes(threshold)) {
    store[budgetId] = [...current, threshold];
  }
};

export const checkBudgetAlerts = async (
  budgets: Budget[],
  getProgress: (id: string) => Promise<BudgetWithProgress>,
) => {
  const store = await getAlertStore();

  for (const budget of budgets) {
    try {
      const data = await getProgress(budget.id);
      const percentage = data.progress?.percentage ?? 0;

      for (const threshold of THRESHOLDS) {
        if (
          percentage >= threshold &&
          !wasNotified(store, budget.id, threshold)
        ) {
          Alert.alert(
            'Cảnh báo ngân sách',
            `Ngân sách ${budget.name} đã đạt ${threshold}%` +
              (threshold === 100 ? ' (vượt giới hạn)' : ''),
          );
          markNotified(store, budget.id, threshold);
        }
      }
    } catch {
      // ignore per-budget failures
    }
  }

  await saveAlertStore(store);
};
