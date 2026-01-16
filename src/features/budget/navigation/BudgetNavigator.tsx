import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BudgetOverviewScreen from '../screens/BudgetOverviewScreen';
import CreateBudgetScreen from '../screens/CreateBudgetScreen';

export type BudgetStackParamList = {
  BudgetOverview: undefined;
  CreateBudget: { budgetId?: string };
  SavingGoals: undefined;
};

const Stack = createNativeStackNavigator<BudgetStackParamList>();

export const BudgetNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerTintColor: '#2196F3',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name="BudgetOverview"
        component={BudgetOverviewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateBudget"
        component={CreateBudgetScreen}
        options={{
          title: 'Ngân Sách',
          headerBackTitle: 'Quay Lại',
        }}
      />
    </Stack.Navigator>
  );
};
