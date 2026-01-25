import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import CreateExpenseScreen from '../screens/CreateExpenseScreen';
import EditExpenseScreen from '../screens/EditExpenseScreen';
import ExpenseStatsScreen from '../screens/ExpenseStatsScreen';
import ReceiptGalleryScreen from '../screens/ReceiptGalleryScreen';
import AssistantChatScreen from '../screens/AssistantChatScreen';
import VoiceInputScreen from '../screens/VoiceInputScreen';
import OCRScanScreen from '../../ocr/screens/OCRScanScreen';
import OCRResultScreen from '../../ocr/screens/OCRResultScreen';
import { Colors } from '../../../constants/theme';

export type ExpenseStackParamList = {
  ExpenseList: undefined;
  CreateExpense: undefined;
  EditExpense: { expenseId: string };
  ExpenseStats: undefined;
  ReceiptGallery: undefined;
  AssistantChat: undefined;
  VoiceInput: undefined;
  OCRScan: undefined;
  OCRResult: undefined; // Now uses context instead of params
};

const Stack = createNativeStackNavigator<ExpenseStackParamList>();

const ExpenseNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: Colors.card },
        headerShadowVisible: false,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' },
        headerShown: false, // Default hidden mostly
      }}
    >
      <Stack.Screen
        name="ExpenseList"
        component={ExpenseListScreen}
      />
      <Stack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
      />
      <Stack.Screen
        name="ExpenseStats"
        component={ExpenseStatsScreen}
      />
      <Stack.Screen
        name="ReceiptGallery"
        component={ReceiptGalleryScreen}
        options={{ headerShown: true, title: 'Hóa đơn' }}
      />
      <Stack.Screen
        name="AssistantChat"
        component={AssistantChatScreen}
        options={{ headerShown: true, title: 'Trợ lý chi tiêu' }}
      />
      <Stack.Screen
        name="VoiceInput"
        component={VoiceInputScreen}
      />
      <Stack.Screen
        name="OCRScan"
        component={OCRScanScreen}
        options={{ headerShown: true, title: 'Quét hóa đơn' }}
      />
      <Stack.Screen
        name="OCRResult"
        component={OCRResultScreen}
        options={{ headerShown: true, title: 'Kết quả OCR' }}
      />
    </Stack.Navigator>
  );
};

export default ExpenseNavigator;

