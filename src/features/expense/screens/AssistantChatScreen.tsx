import React, { useMemo, useState, useContext, useEffect, useRef } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAI } from '../../../common/hooks/useAI';
import { AuthContext } from '../../../store/AuthContext';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../../constants/theme';

type Message = {
  id: string;
  text: string;
  role: 'user' | 'assistant';
};

const SUGGESTIONS = [
  'Tháng này tôi tiêu bao nhiêu?',
  'Chi tiêu xăng xe tháng này?',
  'Gợi ý tiết kiệm 10%?',
];

const AssistantChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Xin chào! Tôi là FEPA AI. Tôi có thể giúp bạn phân tích chi tiêu hoặc đưa ra lời khuyên tiết kiệm. Bạn muốn hỏi gì?',
      role: 'assistant',
    },
  ]);
  const authContext = useContext(AuthContext);
  const { assistantChat, loading: aiLoading } = useAI(authContext?.userToken || null);

  const route = useRoute<any>();
  const initialMessage = route.params?.initialMessage;
  const hasSentRef = useRef(false);
  const scrollRef = useRef<FlatList>(null);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      text: content,
      role: 'user',
    };
    setMessages(prev => [userMessage, ...prev]);
    setInput('');
    
    try {
      const res = await assistantChat({ message: content } as any);
      setMessages(prev => [
        {
          id: `${Date.now()}-assistant`,
          text: res.reply,
          role: 'assistant',
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.log('[AI Chat] Error:', err);
      const detail = err.message || 'Lỗi kết nối AI';
      setMessages(prev => [
        {
          id: `${Date.now()}-assistant`,
          text: `🆘 LỖI: ${detail}`,
          role: 'assistant',
        },
        ...prev,
      ]);
    }
  };

  useEffect(() => {
    if (initialMessage && !hasSentRef.current) {
        hasSentRef.current = true;
        handleSend(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
    }
    return () => {
      if (parent) {
        parent.setOptions({ tabBarStyle: undefined });
      }
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Trợ lý AI</Text>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Đang trực tuyến</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.container}>
            <FlatList
                ref={scrollRef}
                data={messages}
                keyExtractor={item => item.id}
                inverted
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={[
                      styles.messageWrapper,
                      item.role === 'user' ? styles.userWrapper : styles.assistantWrapper
                  ]}>
                    {item.role === 'assistant' && (
                        <View style={styles.aiAvatar}>
                           <Ionicons name="sparkles" size={14} color="#FFF" />
                        </View>
                    )}
                    <View style={[
                        styles.messageBubble,
                        item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}>
                        <Text style={[styles.messageText, item.role === 'user' && styles.userText]}>
                          {item.text}
                        </Text>
                    </View>
                  </View>
                )}
            />

            <View style={styles.bottomSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionRow}>
                    {SUGGESTIONS.map(suggestion => (
                    <TouchableOpacity
                        key={suggestion}
                        style={styles.suggestionChip}
                        onPress={() => handleSend(suggestion)}
                    >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.inputContainer}>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Hỏi FEPA AI..."
                            placeholderTextColor="#94A3B8"
                            value={input}
                            onChangeText={setInput}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!input.trim() || aiLoading) && styles.sendDisabled]}
                            onPress={() => handleSend()}
                            disabled={!input.trim() || aiLoading}
                        >
                            {aiLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    height: 60,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  statusText: { fontSize: 12, color: '#94A3B8' },
  listContent: { padding: 16, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  assistantWrapper: { alignSelf: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  messageBubble: { padding: 12, borderRadius: 20, elevation: 1 },
  userBubble: { backgroundColor: '#3B82F6', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22, color: '#1E293B' },
  userText: { color: '#FFF' },
  bottomSection: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', padding: 12 },
  suggestionRow: { marginBottom: 12 },
  suggestionChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F1F5F9', borderRadius: 20, marginRight: 8 },
  suggestionText: { fontSize: 13, color: '#64748B' },
  inputContainer: { backgroundColor: '#F8FAFC', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, maxHeight: 100, fontSize: 15, color: '#1E293B', paddingVertical: 8 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendDisabled: { backgroundColor: '#CBD5E1' },
});

export default AssistantChatScreen;
