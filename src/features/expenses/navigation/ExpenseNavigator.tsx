import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import CreateExpenseScreen from '../screens/CreateExpenseScreen';
import EditExpenseScreen from '../screens/EditExpenseScreen';

export type ExpenseStackParamList = {
  ExpenseList: undefined;
  CreateExpense: undefined;
  EditExpense: { id: string };
};

const Stack = createNativeStackNavigator<ExpenseStackParamList>();

export const ExpenseNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFF',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#333',
        },
        headerTintColor: '#2196F3',
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="ExpenseList"
        component={ExpenseListScreen}
        options={({ navigation }) => ({
          title: 'Chi tiêu của tôi',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={() => navigation.navigate('CreateExpense')}
            >
              <Text style={{ fontSize: 28, color: '#2196F3' }}>＋</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{
          title: 'Thêm chi tiêu',
        }}
      />
      <Stack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{
          title: 'Sửa chi tiêu',
        }}
      />
    </Stack.Navigator>
  );
};

import { TouchableOpacity, Text } from 'react-native';
