import { useState, useCallback, useMemo } from 'react';
import {
  aiRepository,
  CategorizeExpenseRequest,
  CategorizeExpenseResult,
  PredictSpendingRequest,
  PredictSpendingResult,
  AnomalyDetectionRequest,
  AnomalyDetectionResult,
  BudgetAlertRequest,
  BudgetAlertResult,
  AssistantChatRequest,
  AssistantChatResult,
} from '../../core/repositories/AiRepository';

export const useAI = (token: string | null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    | CategorizeExpenseResult
    | PredictSpendingResult
    | AnomalyDetectionResult
    | BudgetAlertResult
    | AssistantChatResult
    | null
  >(null);
  const assistantChat = useCallback(async (payload: AssistantChatRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await aiRepository.assistantChat(payload);
      setResult(res);
      return res;
    } catch (err: any) {
      setError(err.message || 'Có lỗi AI');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBudgetAlerts = useCallback(async (payload: BudgetAlertRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await aiRepository.getBudgetAlerts(payload);
      setResult(res);
      return res;
    } catch (err: any) {
      setError(err.message || 'Có lỗi AI');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const detectAnomalies = useCallback(async (payload: AnomalyDetectionRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await aiRepository.detectAnomalies(payload);
      setResult(res);
      return res;
    } catch (err: any) {
      setError(err.message || 'Có lỗi AI');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const categorizeExpense = useCallback(async (payload: CategorizeExpenseRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await aiRepository.categorizeExpense(payload);
      setResult(res);
      return res;
    } catch (err: any) {
      setError(err.message || 'Có lỗi AI');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const predictSpending = useCallback(async (payload: PredictSpendingRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await aiRepository.predictSpending(payload);
      setResult(res);
      return res;
    } catch (err: any) {
      setError(err.message || 'Có lỗi AI');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAiInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await aiRepository.getAiInsights();
      setResult(res);
      return res;
    } catch (err: any) {
      setError(err.message || 'Có lỗi AI');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    loading,
    error,
    result,
    categorizeExpense,
    predictSpending,
    detectAnomalies,
    getBudgetAlerts,
    assistantChat,
    getAiInsights,
  }), [
    loading, 
    error, 
    result, 
    categorizeExpense, 
    predictSpending, 
    detectAnomalies, 
    getBudgetAlerts, 
    assistantChat, 
    getAiInsights
  ]);
};
