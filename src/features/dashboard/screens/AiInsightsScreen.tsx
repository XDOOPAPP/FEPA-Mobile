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

      // Gọi đồng thời các API AI
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

  const score = insights?.score || 85; // Giả lập nếu API chưa trả về score

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FEPA AI Insights</Text>
          <TouchableOpacity onPress={loadAllAiData} disabled={loading}>
            <Ionicons name="refresh" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* AI Financial Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>ĐIỂM SỨC KHỎE TÀI CHÍNH</Text>
            <View style={styles.scoreCircle}>
                <LinearGradient 
                    colors={['#8B5CF6', '#3B82F6']} 
                    style={styles.scoreInner}
                >
                    <Text style={styles.scoreValue}>{score}</Text>
                    <Text style={styles.scoreMax}>/100</Text>
                </LinearGradient>
            </View>
            <Text style={styles.scoreLevel}>
                {score >= 80 ? 'Rất Tốt' : score >= 60 ? 'Khá' : 'Cần Cải Thiện'}
            </Text>
          </View>

          {/* Personalized Summary from Gemini */}
          <GlassCard style={styles.aiCard}>
             <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={20} color="#A78BFA" />
                <Text style={styles.aiTitle}>Tóm tắt từ Trợ lý Gemini</Text>
             </View>
             {loading ? (
                 <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} />
             ) : (
                <Text style={styles.aiText}>
                    {insights?.summary || `Dựa trên thu nhập ${profile?.monthlyIncome?.toLocaleString()}đ, bạn đang duy trì thói quen ${profile?.spendingStyle === 'frugal' ? 'tiết kiệm' : 'ổn định'}. Dự kiến tháng này bạn sẽ chi tiêu khoảng ${prediction?.predictions?.reduce((a: any, b: any) => a + b.amount, 0).toLocaleString()}đ.`}
                </Text>
             )}
          </GlassCard>

          {/* Key Insights Row */}
          <View style={styles.insightGrid}>
             <View style={styles.insightItem}>
                <View style={[styles.insightIcon, {backgroundColor: '#34D39920'}]}>
                    <Ionicons name="trending-up" size={20} color="#34D399" />
                </View>
                <Text style={styles.insightVal}>{prediction?.predictions?.length || 0}</Text>
                <Text style={styles.insightLab}>Dự báo mới</Text>
             </View>
             <View style={styles.insightItem}>
                <View style={[styles.insightIcon, {backgroundColor: '#F8717120'}]}>
                    <Ionicons name="alert-circle" size={20} color="#F87171" />
                </View>
                <Text style={styles.insightVal}>{anomalies.length}</Text>
                <Text style={styles.insightLab}>Bất thường</Text>
             </View>
          </View>

          {/* Anomalies List */}
          {anomalies.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Chi tiêu cần lưu ý</Text>
                {anomalies.map((item, idx) => (
                    <GlassCard key={idx} style={styles.itemCard}>
                        <View style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemCat}>{item.category}</Text>
                                <Text style={styles.itemDate}>{new Date(item.date).toLocaleDateString('vi-VN')}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.itemAmt}>{item.amount.toLocaleString()}đ</Text>
                                <Text style={styles.itemReason}>Cao hơn {((item.score - 1) * 100).toFixed(0)}% mức bình thường</Text>
                            </View>
                        </View>
                    </GlassCard>
                ))}
            </View>
          )}

          {/* Future Predictions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dự báo tháng {new Date().getMonth() + 2}</Text>
            <GlassCard>
                {prediction?.predictions?.map((p: any, idx: number) => (
                    <View key={idx} style={styles.predictRow}>
                        <Text style={styles.predictCat}>{p.category}</Text>
                        <View style={styles.predictBarContainer}>
                            <View style={[styles.predictBar, { width: `${p.confidence * 100}%`, backgroundColor: Colors.primary }]} />
                        </View>
                        <Text style={styles.predictAmt}>{Math.round(p.amount/1000)}k</Text>
                    </View>
                ))}
            </GlassCard>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 2,
    marginBottom: 20,
  },
  scoreCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      padding: 10,
      backgroundColor: 'rgba(255,255,255,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  scoreInner: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      ...Shadow.glow,
  },
  scoreValue: {
      fontSize: 48,
      fontWeight: '900',
      color: '#FFF',
  },
  scoreMax: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      fontWeight: '600',
  },
  scoreLevel: {
      marginTop: 15,
      fontSize: 18,
      fontWeight: '700',
      color: '#34D399',
  },
  aiCard: {
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
  },
  aiTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#A78BFA',
      marginLeft: 8,
  },
  aiText: {
      fontSize: 15,
      lineHeight: 22,
      color: '#E2E8F0',
      fontWeight: '500',
  },
  insightGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
  },
  insightItem: {
      width: (width - 52) / 2,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
  },
  insightIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
  },
  insightVal: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFF',
  },
  insightLab: {
      fontSize: 12,
      color: '#94A3B8',
      marginTop: 4,
  },
  section: {
      marginBottom: 24,
  },
  sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFF',
      marginBottom: 12,
      marginLeft: 4,
  },
  itemCard: {
      padding: 12,
      marginBottom: 10,
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
      fontSize: 15,
      fontWeight: '700',
      color: '#FFF',
  },
  itemDate: {
      fontSize: 12,
      color: '#94A3B8',
      marginTop: 2,
  },
  itemAmt: {
      fontSize: 15,
      fontWeight: '800',
      color: '#F87171',
  },
  itemReason: {
      fontSize: 10,
      color: '#F87171',
      marginTop: 2,
  },
  predictRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
  },
  predictCat: {
      width: 80,
      fontSize: 13,
      fontWeight: '600',
      color: '#E2E8F0',
  },
  predictBarContainer: {
      flex: 1,
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 3,
      marginHorizontal: 12,
  },
  predictBar: {
      height: '100%',
      borderRadius: 3,
  },
  predictAmt: {
      width: 45,
      fontSize: 13,
      fontWeight: '800',
      color: '#FFF',
      textAlign: 'right',
  }
});

export default AiInsightsScreen;
