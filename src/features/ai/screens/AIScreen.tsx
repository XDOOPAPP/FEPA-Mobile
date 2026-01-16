import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import axiosInstance from '../../../api/axiosInstance';

interface AIInsight {
  type: 'warning' | 'suggestion' | 'info';
  title: string;
  description: string;
  icon: string;
}

const AIScreen: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/ai/insights');
      setInsights(response.data || []);
    } catch (error: any) {
      console.error('Error loading insights:', error);
      // Fallback mock insights
      setInsights([
        {
          type: 'warning',
          title: '⚠️ Chi Tiêu Cao Hơn Bình Thường',
          description:
            'Chi tiêu ăn uống của bạn tháng này cao hơn 30% so với bình thường. Hãy cân nhắc giảm bớt.',
          icon: '📈',
        },
        {
          type: 'suggestion',
          title: '💡 Gợi Ý Tiết Kiệm',
          description:
            'Bạn có thể tiết kiệm thêm 500k/tháng bằng cách giảm chi tiêu giải trí.',
          icon: '💰',
        },
        {
          type: 'info',
          title: 'ℹ️ Thông Tin Hữu Ích',
          description:
            'Quy tắc 50/30/20: 50% lương cho nhu cầu, 30% cho muốn, 20% cho tiết kiệm.',
          icon: '📚',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!question.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập câu hỏi');
      return;
    }

    setIsAsking(true);
    try {
      const response = await axiosInstance.post('/ai/ask', {
        question: question,
      });

      setAiResponse(response.data?.answer || 'Không thể xử lý câu hỏi');
      setQuestion('');
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể nhận được câu trả lời từ AI');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🤖 Trợ Lý AI Tài Chính</Text>
        <Text style={styles.subtitle}>
          Nhận gợi ý và phân tích chi tiêu từ AI
        </Text>
      </View>

      {/* Insights Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Phân Tích Của Bạn</Text>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#2196F3"
            style={{ marginVertical: 20 }}
          />
        ) : insights.length > 0 ? (
          insights.map((insight, index) => (
            <View
              key={index}
              style={[
                styles.insightCard,
                insight.type === 'warning' && styles.insightWarning,
                insight.type === 'suggestion' && styles.insightSuggestion,
              ]}
            >
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDesc}>{insight.description}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Không có phân tích nào</Text>
          </View>
        )}
      </View>

      {/* Ask AI Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>❓ Hỏi AI</Text>
        <View style={styles.askContainer}>
          <TextInput
            style={styles.input}
            placeholder="VD: Làm sao để tiết kiệm được 5 triệu?"
            placeholderTextColor="#999999"
            value={question}
            onChangeText={setQuestion}
            multiline
            editable={!isAsking}
          />
          <TouchableOpacity
            style={[styles.askButton, isAsking && styles.buttonDisabled]}
            onPress={handleAskAI}
            disabled={isAsking}
          >
            {isAsking ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.askButtonText}>Gửi</Text>
            )}
          </TouchableOpacity>
        </View>

        {aiResponse && (
          <View style={styles.responseCard}>
            <Text style={styles.responseTitle}>💬 Trả Lời</Text>
            <Text style={styles.responseText}>{aiResponse}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setAiResponse(null)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Mẹo Tiết Kiệm</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>🎯 Lập Ngân Sách Hàng Tháng</Text>
          <Text style={styles.tipText}>
            Xác định mục tiêu chi tiêu cho mỗi danh mục và tuân thủ nó.
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>🧮 Theo Dõi Thường Xuyên</Text>
          <Text style={styles.tipText}>
            Kiểm tra chi tiêu của bạn hàng tuần để phát hiện các chi phí không
            cần thiết.
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>📱 Dùng App Quản Lý</Text>
          <Text style={styles.tipText}>
            Ứng dụng này giúp bạn theo dõi chi tiêu dễ dàng hơn.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#673AB7',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#E1BEE7',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  insightWarning: {
    borderLeftColor: '#FF9800',
  },
  insightSuggestion: {
    borderLeftColor: '#4CAF50',
  },
  insightIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#999999',
  },
  askContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1A1A1A',
    maxHeight: 100,
  },
  askButton: {
    backgroundColor: '#673AB7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  askButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  responseCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#673AB7',
  },
  responseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#673AB7',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 18,
    marginBottom: 12,
  },
  closeButton: {
    backgroundColor: '#673AB7',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  tipCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
});

export default AIScreen;
