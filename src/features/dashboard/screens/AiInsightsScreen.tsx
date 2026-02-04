import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../../constants/theme';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { useAI } from '../../../common/hooks/useAI';
import { AuthContext } from '../../../store/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const AiInsightsScreen: React.FC = () => {
  const navigation = useNavigation();
  const authContext = useContext(AuthContext);
  const { getAiInsights, predictSpending, detectAnomalies, loading } = useAI(authContext?.userToken || null);
  
  const [insights, setInsights] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadAllAiData();
  }, []);

  const loadAllAiData = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('ai_financial_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));

      const [insightsRes, predictRes, anomaliesRes] = await Promise.all([
        getAiInsights(),
        predictSpending({ month: new Date().toISOString().substring(0, 7) }),
        detectAnomalies({ 
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
            to: new Date().toISOString().substring(0, 10)
        })
      ]);

      setInsights(insightsRes);
      setPrediction(predictRes);
      setAnomalies(anomaliesRes?.anomalies || []);
    } catch (error) {
      console.log('AI Insights Load Error:', error);
    }
  };

  const score = insights?.score || 85;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông phân tích AI</Text>
          <TouchableOpacity onPress={loadAllAiData} disabled={loading} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* AI Financial Score */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreCircle}>
                  <LinearGradient 
                      colors={['#E0F2FE', '#BAE6FD']} 
                      style={styles.scoreInner}
                  >
                      <Text style={styles.scoreValue}>{score}</Text>
                      <Text style={styles.scoreMax}>/100</Text>
                  </LinearGradient>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreLabel}>ĐIỂM TÀI CHÍNH</Text>
                <Text style={[styles.scoreLevel, { color: score >= 80 ? Colors.success : Colors.warning }]}>
                    {score >= 80 ? 'Rất Tốt' : score >= 60 ? 'Khá' : 'Cần Cải Thiện'}
                </Text>
              </View>
            </View>
          </View>

          {/* Personalized Summary from Gemini */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Ionicons name="sparkles" size={20} color="#8B5CF6" />
               <Text style={styles.sectionTitle}>Tóm tắt từ Gemini</Text>
            </View>
            <GlassCard style={styles.aiCard}>
               {loading ? (
                   <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} />
               ) : (
                  <Text style={styles.aiText}>
                      {insights?.summary || `Dựa trên thu nhập ${profile?.monthlyIncome?.toLocaleString() || 'hàng tháng'}đ, bạn đang duy trì thói quen ${profile?.spendingStyle === 'frugal' ? 'tiết kiệm' : 'ổn định'}. Dự kiến tháng này bạn sẽ chi tiêu khoảng ${prediction?.predictions?.reduce((a: any, b: any) => a + b.amount, 0).toLocaleString() || '0'}đ.`}
                  </Text>
               )}
            </GlassCard>
          </View>

          {/* Key Insights Stats */}
          <View style={styles.insightGrid}>
             <View style={styles.insightItem}>
                <View style={[styles.insightIcon, {backgroundColor: '#F0FDF4'}]}>
                    <Ionicons name="trending-up" size={20} color={Colors.success} />
                </View>
                <Text style={styles.insightVal}>{prediction?.predictions?.length || 0}</Text>
                <Text style={styles.insightLab}>Dự báo</Text>
             </View>
             <View style={styles.insightItem}>
                <View style={[styles.insightIcon, {backgroundColor: '#FEF2F2'}]}>
                    <Ionicons name="alert-circle" size={20} color={Colors.danger} />
                </View>
                <Text style={styles.insightVal}>{anomalies.length}</Text>
                <Text style={styles.insightLab}>Bất thường</Text>
             </View>
          </View>

          {/* Anomalies List */}
          {anomalies.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Giao dịch bất thường</Text>
                {anomalies.map((item, idx) => (
                    <GlassCard key={idx} style={styles.itemCard}>
                        <View style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemCat}>{item.category}</Text>
                                <Text style={styles.itemDate}>{new Date(item.date).toLocaleDateString('vi-VN')}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.itemAmt}>{item.amount.toLocaleString()}đ</Text>
                                <Text style={styles.itemReason}>Cao hơn mức thường lệ</Text>
                            </View>
                        </View>
                    </GlassCard>
                ))}
            </View>
          )}

          {/* Future Predictions Bar Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phân bổ dự báo tới</Text>
            <GlassCard style={styles.predictCard}>
                {prediction?.predictions?.map((p: any, idx: number) => (
                    <View key={idx} style={styles.predictRow}>
                        <Text style={styles.predictCat} numberOfLines={1}>{p.category}</Text>
                        <View style={styles.predictBarContainer}>
                            <View style={[styles.predictBar, { width: `${p.confidence * 100}%`, backgroundColor: Colors.primary }]} />
                        </View>
                        <Text style={styles.predictAmt}>{Math.round(p.amount/1000)}k</Text>
                    </View>
                ))}
                {!prediction?.predictions?.length && <Text style={styles.aiText}>Chưa có dữ liệu dự báo.</Text>}
            </GlassCard>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    padding: 5,
  },
  refreshBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  scoreSection: {
    marginBottom: 30,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  scoreCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      padding: 6,
      backgroundColor: '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
  },
  scoreInner: {
      width: 88,
      height: 88,
      borderRadius: 44,
      justifyContent: 'center',
      alignItems: 'center',
  },
  scoreValue: {
      fontSize: 32,
      fontWeight: '800',
      color: Colors.primaryDark,
  },
  scoreMax: {
      fontSize: 10,
      color: Colors.primary,
      fontWeight: '600',
  },
  scoreInfo: {
    marginLeft: 20,
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreLevel: {
      fontSize: 22,
      fontWeight: '800',
  },
  section: {
      marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: Colors.textPrimary,
      marginLeft: 8,
  },
  aiCard: {
      padding: 16,
      backgroundColor: '#F5F3FF', // Light purple
      borderWidth: 1,
      borderColor: '#E9E3FF',
  },
  aiText: {
      fontSize: 15,
      lineHeight: 22,
      color: '#4B5563',
      fontStyle: 'italic',
  },
  insightGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
  },
  insightItem: {
      width: (width - 52) / 2,
      backgroundColor: '#FFF',
      borderRadius: Radius.lg,
      padding: 16,
      alignItems: 'center',
      ...Shadow.sm,
  },
  insightIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
  },
  insightVal: {
      fontSize: 20,
      fontWeight: '800',
      color: Colors.textPrimary,
  },
  insightLab: {
      fontSize: 13,
      color: Colors.textSecondary,
      marginTop: 2,
  },
  itemCard: {
      padding: 16,
      marginBottom: 12,
      backgroundColor: '#FFF',
      ...Shadow.sm,
  },
  itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  itemInfo: {
      flex: 1,
  },
  itemCat: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.textPrimary,
  },
  itemDate: {
      fontSize: 12,
      color: Colors.textMuted,
      marginTop: 2,
  },
  itemAmt: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.danger,
  },
  itemReason: {
      fontSize: 11,
      color: Colors.textMuted,
      marginTop: 2,
  },
  predictCard: {
    backgroundColor: '#FFF',
    padding: 16,
    ...Shadow.sm,
  },
  predictRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
  },
  predictCat: {
      width: 90,
      fontSize: 14,
      fontWeight: '600',
      color: Colors.textPrimary,
  },
  predictBarContainer: {
      flex: 1,
      height: 8,
      backgroundColor: '#F1F5F9',
      borderRadius: 4,
      marginHorizontal: 15,
  },
  predictBar: {
      height: '100%',
      borderRadius: 4,
  },
  predictAmt: {
      width: 50,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.textPrimary,
      textAlign: 'right',
  }
});

export default AiInsightsScreen;
