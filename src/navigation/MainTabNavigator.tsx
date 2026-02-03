import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardStack from './DashboardStack';
import ExpenseNavigator from '../features/expense/navigation/ExpenseNavigator';
import OCRNavigator from '../features/ocr/navigation/OCRNavigator'; // Smart Scan Navigator
import PlanningNavigator from '../features/planning/navigation/PlanningNavigator';
import EducationNavigator from '../features/education/navigation/EducationNavigator';
import { Colors, Radius, Shadow, Spacing } from '../constants/theme';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

const ModernTabBar = ({ state, descriptors, navigation }: any) => {
  const focusedOptions = descriptors[state.routes[state.index].key].options;

  if (focusedOptions.tabBarStyle?.display === 'none') {
    return null;
  }

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.glassBackground}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const isCenterButton = route.name === 'SmartScan';

          if (isCenterButton) {
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={onPress}
                style={styles.centerButtonWrapper}
              >
                <LinearGradient
                  colors={Colors.primaryGradient}
                  style={styles.centerButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="scan" size={28} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          let iconName = 'help-outline';
          // Tab 1: Dashboard
          if (route.name === 'Dashboard') iconName = isFocused ? 'grid' : 'grid-outline';
          // Tab 2: Transactions (Lịch sử)
          if (route.name === 'Transactions') iconName = isFocused ? 'receipt' : 'receipt-outline';
          // Tab 4: Planning (Kế hoạch: Budget, Goals, Debts)
          if (route.name === 'Planning') iconName = isFocused ? 'pie-chart' : 'pie-chart-outline';
          // Tab 5: Education & Profile (Cá nhân)
          if (route.name === 'Profile') iconName = isFocused ? 'person' : 'person-outline';

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={onPress}
              style={styles.tabItem}
            >
              <View style={[
                  styles.iconContainer,
                  isFocused && styles.iconActive
              ]}>
                 <Ionicons 
                    name={iconName} 
                    size={22} 
                    color={isFocused ? Colors.primary : Colors.textSecondary} 
                 />
              </View>
              {isFocused && (
                  <Text style={styles.label}>{options.title || route.name}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <ModernTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0, 
            right: 0,
            backgroundColor: 'transparent',
            elevation: 0,
            borderTopWidth: 0,
        }
      }}
    >
      {/* Tab 1: Dashboard */}
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack} 
        options={{ title: 'Tổng quan' }} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Dashboard', { screen: 'DashboardHome' });
          },
        })}
      />
      
      {/* Tab 2: Transactions */}
      <Tab.Screen 
        name="Transactions" 
        component={ExpenseNavigator} 
        options={{ title: 'Lịch sử' }} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Transactions', { screen: 'ExpenseList' });
          },
        })}
      />
      
      {/* Tab 3: Smart Scan (Center) */}
      <Tab.Screen 
        name="SmartScan" 
        component={OCRNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('SmartScan');
          },
        })}
        options={{ 
            title: 'Scan',
            headerShown: false,
            tabBarStyle: { display: 'none' },
        }} 
      />
       
      {/* Tab 4: Planning */}
       <Tab.Screen 
        name="Planning" 
        component={PlanningNavigator} 
        options={{ title: 'Kế hoạch' }} 
      />
       
       {/* Tab 5: Profile */}
       <Tab.Screen 
        name="Profile" 
        component={EducationNavigator} 
        options={{ title: 'Cá nhân' }} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
  },
  glassBackground: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF', 
    borderRadius: Radius.xl,
    height: 70,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs, 
    ...Shadow.glow,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonWrapper: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.glow,
    borderWidth: 4,
    borderColor: '#F8FAFC',
  },
  iconContainer: {
    padding: 6,
    borderRadius: 12,
  },
  iconActive: {
    backgroundColor: Colors.primaryHighlight,
  },
  label: {
    fontSize: 9, 
    marginTop: 2,
    fontWeight: 'bold',
    color: Colors.primary,
  }
});

export default MainTabNavigator;
