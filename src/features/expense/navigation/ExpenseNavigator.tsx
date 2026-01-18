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
  OCRResult: { job: any };
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
      }}
    >
      <Stack.Screen
        name="ExpenseList"
        component={ExpenseListScreen}
        options={{ title: 'Chi tiêu' }}
      />
      <Stack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ title: 'Thêm chi tiêu' }}
      />
      <Stack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{ title: 'Sửa chi tiêu' }}
      />
      <Stack.Screen
        name="ExpenseStats"
        component={ExpenseStatsScreen}
        options={{ title: 'Thống kê' }}
      />
      <Stack.Screen
        name="ReceiptGallery"
        component={ReceiptGalleryScreen}
        options={{ title: 'Hóa đơn' }}
      />
      <Stack.Screen
        name="AssistantChat"
        component={AssistantChatScreen}
        options={{ title: 'Trợ lý chi tiêu' }}
      />
      <Stack.Screen
        name="VoiceInput"
        component={VoiceInputScreen}
        options={{ title: 'Giọng nói' }}
      />
      <Stack.Screen
        name="OCRScan"
        component={OCRScanScreen}
        options={{ title: 'Quét hóa đơn' }}
      />
      <Stack.Screen
        name="OCRResult"
        component={OCRResultScreen}
        options={{ title: 'Kết quả OCR' }}
      />
    </Stack.Navigator>
  );
};

export default ExpenseNavigator;

