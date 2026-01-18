import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlanningScreen from '../screens/PlanningScreen';
import { BudgetNavigator } from '../../budget/navigation/BudgetNavigator';
import SavingGoalsScreen from '../screens/SavingGoalsScreen';
import DebtsScreen from '../screens/DebtsScreen';
import { Colors } from '../../../constants/theme';

export type PlanningStackParamList = {
  PlanningHome: undefined;
  Budgets: undefined;
  SavingGoals: undefined;
  Debts: undefined;
};

const Stack = createNativeStackNavigator<PlanningStackParamList>();

const PlanningNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: Colors.card },
        headerShadowVisible: false,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="PlanningHome"
        component={PlanningScreen}
        options={{ title: 'Kế hoạch' }}
      />
      <Stack.Screen
        name="Budgets"
        component={BudgetNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SavingGoals"
        component={SavingGoalsScreen}
        options={{ title: 'Mục tiêu tiết kiệm' }}
      />
      <Stack.Screen
        name="Debts"
        component={DebtsScreen}
        options={{ title: 'Nợ' }}
      />
    </Stack.Navigator>
  );
};

export default PlanningNavigator;
