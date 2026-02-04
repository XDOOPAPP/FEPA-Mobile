import { useState, useCallback } from 'react';
import { ocrRepository } from '../repositories/OcrRepository';
import { OcrJob } from '../models/Ocr';
import { useBaseViewModel } from './BaseViewModel';

export interface OcrViewModelState {
  currentJob: OcrJob | null;
  loading: boolean;
  error: string | null;
}

export const useOcrViewModel = () => {
  const { setLoading, setError, state } = useBaseViewModel();
  const [currentJob, setCurrentJob] = useState<OcrJob | null>(null);

  /**
   * Bắt đầu quét hóa đơn
   */
  const scanInvoice = async (fileUri: string, userId: string = '', mimeType?: string) => {
    setLoading(true);
    setError(null);
    setCurrentJob(null);
    try {
      const job = await ocrRepository.scanInvoice(fileUri, userId, mimeType);
      setCurrentJob(job);
      return job;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cập nhật trạng thái job hiện tại
   */
  const refreshJobStatus = async (jobId: string) => {
    try {
      const updatedJob = await ocrRepository.getJob(jobId);
      setCurrentJob(updatedJob);
      return updatedJob;
    } catch (e) {
      console.error('[OCR ViewModel] Refresh failed:', e);
      return null;
    }
  };

  return {
    state: {
      ...state,
      currentJob,
    },
    scanInvoice,
    refreshJobStatus,
    setLoading,
    setError,
  };
};
