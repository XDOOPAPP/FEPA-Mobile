import React from 'react';
import {
  createBottomTabNavigator,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import ExpenseNavigator from '../features/expense/navigation/ExpenseNavigator';
import PlanningNavigator from '../features/planning/navigation/PlanningNavigator';
import EducationNavigator from '../features/education/navigation/EducationNavigator';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import OCRScanScreen from '../features/ocr/screens/OCRScanScreen';
import { Colors, Shadow } from '../constants/theme';

export type AppTabParamList = {
  DashboardTab: undefined;
  ExpenseTab: undefined;
  OCRTab: undefined;
  PlanningTab: undefined;
  EducationTab: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const CenterTabButton = ({ onPress }: BottomTabBarButtonProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.centerWrap}>
      <View style={styles.centerButton}>
        <Text style={styles.centerText}>Quét</Text>
      </View>
    </TouchableOpacity>
  );
};

const AppStack = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Tổng quan' }}
      />
      <Tab.Screen
        name="ExpenseTab"
        component={ExpenseNavigator}
        options={{ title: 'Giao dịch' }}
      />
      <Tab.Screen
        name="OCRTab"
        component={OCRScanScreen}
        options={{
          title: 'Quét',
          tabBarButton: CenterTabButton,
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen
        name="PlanningTab"
        component={PlanningNavigator}
        options={{ title: 'Kế hoạch' }}
      />
      <Tab.Screen
        name="EducationTab"
        component={EducationNavigator}
        options={{ title: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  centerWrap: {
    top: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  centerText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default AppStack;
