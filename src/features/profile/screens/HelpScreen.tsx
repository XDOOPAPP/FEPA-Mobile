import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Spacing, Shadow } from '../../../constants/theme';
import { useNavigation } from '@react-navigation/native';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity 
        style={styles.faqHeader} 
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text style={[styles.question, expanded && styles.questionActive]}>{question}</Text>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={expanded ? Colors.primary : Colors.textSecondary} 
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answer}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

const HelpScreen = () => {
  const navigation = useNavigation();

  const faqs = [
    {
      question: "Làm thế nào để nâng cấp Premium?",
      answer: "Bạn có thể nâng cấp bằng cách truy cập vào Hồ sơ > Gói dịch vụ và chọn gói Premium phù hợp để mở khóa các tính năng nâng cao như AI Insights không giới hạn và đồng bộ đa thiết bị."
    },
    {
        question: "Làm thế nào để xuất dữ liệu chi tiêu?",
        answer: "Vào Hồ sơ > Ứng dụng > Xuất dữ liệu. File CSV sẽ được lưu vào thư mục Tải xuống (Downloads) trên điện thoại của bạn."
    },
    {
      question: "AI phân tích tài chính hoạt động ra sao?",
      answer: "FEPA sử dụng AI để tự động phân loại giao dịch và phát hiện các xu hướng chi tiêu bất thường, từ đó đưa ra lời khuyên giúp bạn tiết kiệm hiệu quả hơn."
    },
    {
      question: "Tôi có thể sử dụng FEPA trên nhiều thiết bị không?",
      answer: "Có, nếu bạn nâng cấp lên tài khoản Premium, dữ liệu của bạn sẽ được đồng bộ hóa an toàn trên cloud và có thể truy cập từ nhiều thiết bị."
    },
    {
        question: "Làm sao để lấy lại mật khẩu?",
        answer: "Tại màn hình đăng nhập, hãy chọn 'Quên mật khẩu' và làm theo hướng dẫn gửi về email để thiết lập lại mật khẩu mới."
    }
  ];

  const handleContactSupport = () => {
    Linking.openURL('mailto:nhutp2945@gmail.com?subject=Hỗ trợ người dùng FEPA');
  };

  const handleCallHotline = () => {
    Linking.openURL('tel:0827410398');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.primaryGradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trợ giúp & FAQ</Text>
        <View style={{ width: 40 }} /> 
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
            <View style={styles.card}>
                {faqs.map((faq, index) => (
                    <View key={index}>
                        <FAQItem question={faq.question} answer={faq.answer} />
                        {index < faqs.length - 1 && <View style={styles.divider} />}
                    </View>
                ))}
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liên hệ hỗ trợ</Text>
            <View style={styles.card}>
                <TouchableOpacity style={styles.contactItem} onPress={handleContactSupport}>
                    <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                        <Ionicons name="mail" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>Email hỗ trợ</Text>
                        <Text style={styles.contactValue}>nhutp2945@gmail.com</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.contactItem} onPress={handleCallHotline}>
                    <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                        <Ionicons name="call" size={24} color="#10B981" />
                    </View>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>Hotline</Text>
                        <Text style={styles.contactValue}>0827 410 398</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
            </View>
        </View>

        <Text style={styles.footerText}>
            FEPA Mobile v1.0.0{'\n'}
            Phát triển bởi FEPA Team
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.sm,
    ...Shadow.sm,
  },
  faqItem: {
    padding: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 10,
    lineHeight: 22,
  },
  questionActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  answerContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  answer: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  footerText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 20,
    lineHeight: 18,
  },
});

export default HelpScreen;
