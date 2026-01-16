import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text } from 'react-native';
import BudgetListScreen from '../screens/BudgetListScreen';
import CreateBudgetScreen from '../screens/CreateBudgetScreen';

export type BudgetStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  EditBudget: { id: string };
};

const Stack = createNativeStackNavigator<BudgetStackParamList>();

export const BudgetNavigator = () => {
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
        name="BudgetList"
        component={BudgetListScreen}
        options={({ navigation }) => ({
          title: 'Ngân sách của tôi',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={() => navigation.navigate('CreateBudget')}
            >
              <Text style={{ fontSize: 28, color: '#2196F3' }}>＋</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="CreateBudget"
        component={CreateBudgetScreen}
        options={{
          title: 'Tạo ngân sách',
        }}
      />
    </Stack.Navigator>
  );
};
