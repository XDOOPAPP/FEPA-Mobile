import React, { useMemo, useState, useContext } from 'react';
import { useAI } from '../../../common/hooks/useAI';
import { AuthContext } from '../../../store/AuthContext';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

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
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Xin chào! Bạn muốn hỏi gì về chi tiêu?',
      role: 'assistant',
    },
  ]);
  const authContext = useContext(AuthContext);
  const {
    assistantChat,
    loading: aiLoading,
    error: aiError,
  } = useAI(authContext?.userToken || null);

  const canSend = input.trim().length > 0 && !aiLoading;

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
      const res = await assistantChat({ message: content });
      setMessages(prev => [
        {
          id: `${Date.now()}-assistant`,
          text: res.reply,
          role: 'assistant',
        },
        ...prev,
      ]);
    } catch (err) {
      setMessages(prev => [
        {
          id: `${Date.now()}-assistant`,
          text: 'Xin lỗi, AI không trả lời được lúc này.',
          role: 'assistant',
        },
        ...prev,
      ]);
    }
  };

  const suggestions = useMemo(() => SUGGESTIONS, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.role === 'user' && styles.userText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={styles.suggestionRow}>
        {suggestions.map(suggestion => (
          <TouchableOpacity
            key={suggestion}
            style={styles.suggestionChip}
            onPress={() => handleSend(suggestion)}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nhập câu hỏi..."
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendDisabled]}
          onPress={() => handleSend()}
          disabled={!canSend}
        >
          <Text style={styles.sendText}>{aiLoading ? '...' : 'Gửi'}</Text>
        </TouchableOpacity>
        {aiError && (
          <Text style={{ color: 'red', marginLeft: 8 }}>{aiError}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  listContent: {
    paddingBottom: Spacing.md,
  },
  messageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    maxWidth: '80%',
    ...Shadow.soft,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: 13,
  },
  userText: {
    color: '#FFF',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    color: Colors.textPrimary,
  },
  sendButton: {
    marginLeft: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  sendDisabled: {
    opacity: 0.6,
  },
  sendText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default AssistantChatScreen;
