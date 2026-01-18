export type OcrJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface OcrExpenseData {
  amount: number;
  description: string;
  spentAt: string;
  category?: string;
  confidence?: number;
  source?: 'qr' | 'ocr' | 'hybrid';
}

export interface OcrResultJson {
  rawText?: string;
  confidence?: number;
  hasQrCode?: boolean;
  qrData?: Record<string, unknown> | null;
  expenseData?: OcrExpenseData;
}

export interface OcrJob {
  id: string;
  userId?: string;
  status: OcrJobStatus;
  fileUrl: string;
  resultJson?: OcrResultJson | null;
  createdAt?: string;
  completedAt?: string | null;
  errorMessage?: string | null;
}
