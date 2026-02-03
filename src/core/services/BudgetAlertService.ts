import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, Alert } from 'react-native';
import { budgetRepository } from '../repositories/BudgetRepository';

const ALERT_SETTINGS_KEY = '@budget_alert_settings';
const LAST_ALERT_KEY = '@budget_last_alert';

export interface BudgetAlertConfig {
  budgetId: string;
  reach80: boolean;
  exceeded: boolean;
  threshold: number;
}

class BudgetAlertService {
  /**
   * Check all budgets against their alert thresholds after an expense is added
   * Call this after successfully creating an expense
   */
  async checkBudgetAlerts(expenseCategory?: string): Promise<void> {
    try {
      const budgets = await budgetRepository.getAllBudgetsWithProgress();
      
      for (const budget of budgets) {
        // Only check budgets matching the expense category if specified
        if (expenseCategory && budget.category && budget.category !== expenseCategory) {
          continue;
        }

        const progress = budget.progress;
        if (!progress) continue;

        const percentage = progress.percentage || 0;
        const settings = await this.getAlertSettings(budget.id);
        
        // Check thresholds
        if (settings.exceeded && percentage > 100) {
          await this.triggerAlert(budget.id, budget.name, 'exceeded', percentage, progress.totalSpent, budget.limitAmount);
        } else if (settings.reach80 && percentage >= 80 && percentage <= 100) {
          await this.triggerAlert(budget.id, budget.name, 'warning', percentage, progress.totalSpent, budget.limitAmount);
        } else if (percentage >= settings.threshold && percentage < 100) {
          await this.triggerAlert(budget.id, budget.name, 'threshold', percentage, progress.totalSpent, budget.limitAmount);
        }
      }
    } catch (error) {
      console.warn('Error checking budget alerts:', error);
    }
  }

  /**
   * Get alert settings for a specific budget
   */
  async getAlertSettings(budgetId: string): Promise<BudgetAlertConfig> {
    try {
      const saved = await AsyncStorage.getItem(`${ALERT_SETTINGS_KEY}_${budgetId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Error loading alert settings:', error);
    }
    
    // Default settings
    return {
      budgetId,
      reach80: true,
      exceeded: true,
      threshold: 85,
    };
  }

  /**
   * Trigger an alert notification
   */
  private async triggerAlert(
    budgetId: string,
    budgetName: string,
    type: 'warning' | 'exceeded' | 'threshold',
    percentage: number,
    spent: number,
    limit: number
  ): Promise<void> {
    // Check if we already sent this alert today to avoid spam
    const lastAlertKey = `${LAST_ALERT_KEY}_${budgetId}_${type}`;
    const lastAlert = await AsyncStorage.getItem(lastAlertKey);
    const today = new Date().toDateString();
    
    if (lastAlert === today) {
      // Already sent this type of alert today for this budget
      return;
    }

    // Save that we sent this alert today
    await AsyncStorage.setItem(lastAlertKey, today);

    let title = '';
    let message = '';
    
    switch (type) {
      case 'exceeded':
        title = '🚨 Vượt ngân sách!';
        message = `Ngân sách "${budgetName}" đã vượt ${Math.round(percentage)}%! Bạn đã chi ${spent.toLocaleString()}₫ trên hạn mức ${limit.toLocaleString()}₫.`;
        break;
      case 'warning':
        title = '⚠️ Sắp hết ngân sách';
        message = `Ngân sách "${budgetName}" đã đạt ${Math.round(percentage)}%. Còn lại ${(limit - spent).toLocaleString()}₫.`;
        break;
      case 'threshold':
        title = '📊 Cảnh báo ngân sách';
        message = `Ngân sách "${budgetName}" đã đạt ${Math.round(percentage)}% ngưỡng cảnh báo của bạn.`;
        break;
    }

    // Emit event for in-app notification banner
    DeviceEventEmitter.emit('budget_alert', {
      budgetId,
      budgetName,
      type,
      percentage,
      spent,
      limit,
      title,
      message,
      createdAt: new Date().toISOString(),
    });

    // Also show an immediate Alert dialog for important alerts
    if (type === 'exceeded') {
      setTimeout(() => {
        Alert.alert(title, message, [
          { text: 'Xem chi tiết', onPress: () => {
            DeviceEventEmitter.emit('navigate_to_budget', { budgetId, budgetName });
          }},
          { text: 'Đóng', style: 'cancel' },
        ]);
      }, 500);
    }
  }

  /**
   * Reset daily alert flags (call this at app start or midnight)
   */
  async resetDailyAlerts(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const alertKeys = keys.filter(k => k.startsWith(LAST_ALERT_KEY));
      
      for (const key of alertKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value !== new Date().toDateString()) {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Error resetting daily alerts:', error);
    }
  }
}

export const budgetAlertService = new BudgetAlertService();
