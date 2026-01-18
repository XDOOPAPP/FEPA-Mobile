import { useCallback, useState } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import { ocrRepository } from '../repositories/OcrRepository';
import { OcrJob } from '../models/Ocr';

export interface OcrViewModelState extends ViewModelState {
  currentJob: OcrJob | null;
}

export const useOcrViewModel = (token: string | null) => {
  const { state, setLoading, setError, clearMessages } = useBaseViewModel();
  const [ocrState, setOcrState] = useState<OcrViewModelState>({
    ...state,
    currentJob: null,
  });

  const syncState = useCallback((updates: Partial<OcrViewModelState>) => {
    setOcrState(prev => ({ ...prev, ...updates }));
  }, []);

  const scanInvoice = useCallback(
    async (fileUrl: string): Promise<OcrJob> => {
      setLoading(true);
      clearMessages();
      try {
        const job = await ocrRepository.scanInvoice(fileUrl);
        syncState({ currentJob: job });
        return job;
      } catch (error: any) {
        setError(error.message || 'Failed to scan invoice');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [token, setLoading, setError, clearMessages, syncState],
  );

  const getJob = useCallback(
    async (jobId: string): Promise<OcrJob> => {
      setLoading(true);
      clearMessages();
      try {
        const job = await ocrRepository.getJob(jobId);
        syncState({ currentJob: job });
        return job;
      } catch (error: any) {
        setError(error.message || 'Failed to load OCR job');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [token, setLoading, setError, clearMessages, syncState],
  );

  return {
    ocrState,
    scanInvoice,
    getJob,
    clearMessages,
  };
};
