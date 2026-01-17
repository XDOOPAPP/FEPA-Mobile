/**
 * OCR Context
 * Global state management for OCR scans and history
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  StoredOCRScan,
  getOCRHistory,
  addOCRScan,
  updateOCRScan,
  deleteOCRScan,
  getPendingOCRScans,
  markOCRScanSynced,
  getOCRStatistics,
} from '../utils/ocrStorage';
import expenseService from '../services/expenseService';

export interface OCRContextType {
  // State
  history: StoredOCRScan[];
  pendingScans: StoredOCRScan[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  statistics: any | null;

  // Actions
  loadHistory: () => Promise<void>;
  addScan: (scan: StoredOCRScan) => Promise<void>;
  updateScan: (id: string, updates: Partial<StoredOCRScan>) => Promise<void>;
  deleteScan: (id: string) => Promise<void>;
  loadPendingScans: () => Promise<void>;
  markScanSynced: (id: string) => Promise<void>;
  refreshStatistics: () => Promise<void>;
  syncPendingScans: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const OCRContext = createContext<OCRContextType | undefined>(undefined);

interface OCRProviderProps {
  children: ReactNode;
}

export const OCRProvider: React.FC<OCRProviderProps> = ({ children }) => {
  const [history, setHistory] = useState<StoredOCRScan[]>([]);
  const [pendingScans, setPendingScans] = useState<StoredOCRScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [statistics, setStatistics] = useState<any | null>(null);

  /**
   * Load OCR history from AsyncStorage
   */
  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getOCRHistory();
      setHistory(data);
      console.log('[OCRContext] Loaded', data.length, 'OCR scans from history');
    } catch (error) {
      console.error('[OCRContext] Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add new OCR scan
   */
  const addScan = useCallback(
    async (scan: StoredOCRScan) => {
      try {
        await addOCRScan(scan);
        await loadHistory();
        console.log('[OCRContext] Added new scan:', scan.id);
      } catch (error) {
        console.error('[OCRContext] Error adding scan:', error);
        throw error;
      }
    },
    [loadHistory],
  );

  /**
   * Update an OCR scan
   */
  const updateScan = useCallback(
    async (id: string, updates: Partial<StoredOCRScan>) => {
      try {
        await updateOCRScan(id, updates);
        await loadHistory();
        console.log('[OCRContext] Updated scan:', id);
      } catch (error) {
        console.error('[OCRContext] Error updating scan:', error);
        throw error;
      }
    },
    [loadHistory],
  );

  /**
   * Delete an OCR scan
   */
  const deleteScan = useCallback(
    async (id: string) => {
      try {
        await deleteOCRScan(id);
        await loadHistory();
        console.log('[OCRContext] Deleted scan:', id);
      } catch (error) {
        console.error('[OCRContext] Error deleting scan:', error);
        throw error;
      }
    },
    [loadHistory],
  );

  /**
   * Load pending scans
   */
  const loadPendingScans = useCallback(async () => {
    try {
      const pending = await getPendingOCRScans();
      setPendingScans(pending);
      console.log('[OCRContext] Loaded', pending.length, 'pending scans');
    } catch (error) {
      console.error('[OCRContext] Error loading pending scans:', error);
    }
  }, []);

  /**
   * Mark scan as synced
   */
  const markScanSynced = useCallback(
    async (id: string) => {
      try {
        await markOCRScanSynced(id);
        await loadHistory();
        await loadPendingScans();
        console.log('[OCRContext] Marked scan as synced:', id);
      } catch (error) {
        console.error('[OCRContext] Error marking scan synced:', error);
        throw error;
      }
    },
    [loadHistory, loadPendingScans],
  );

  /**
   * Refresh statistics
   */
  const refreshStatistics = useCallback(async () => {
    try {
      const stats = await getOCRStatistics();
      setStatistics(stats);
      console.log('[OCRContext] Refreshed statistics');
    } catch (error) {
      console.error('[OCRContext] Error refreshing statistics:', error);
    }
  }, []);

  /**
   * Sync pending scans to backend
   */
  const syncPendingScans = useCallback(async () => {
    if (pendingScans.length === 0) {
      console.log('[OCRContext] No pending scans to sync');
      return;
    }

    setIsSyncing(true);
    try {
      console.log(
        '[OCRContext] Syncing',
        pendingScans.length,
        'pending scans...',
      );

      // Sync each pending scan via expenseService
      for (const scan of pendingScans) {
        try {
          const expense = await expenseService.createExpenseFromOCR(scan);
          await markOCRScanSynced(scan.id);
          console.log(
            '[OCRContext] Synced scan:',
            scan.id,
            '→ expense:',
            expense.id,
          );
        } catch (error) {
          console.error('[OCRContext] Failed to sync scan:', scan.id, error);
          // Continue with next scan on individual failure
        }
      }

      setLastSyncTime(Date.now());
      await loadPendingScans();
      console.log('[OCRContext] Completed sync of pending scans');
    } catch (error) {
      console.error('[OCRContext] Error during sync:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [pendingScans, loadPendingScans]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(async () => {
    try {
      setHistory([]);
      setPendingScans([]);
      setStatistics(null);
      console.log('[OCRContext] Cleared all history');
    } catch (error) {
      console.error('[OCRContext] Error clearing history:', error);
      throw error;
    }
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    loadHistory();
    loadPendingScans();
    refreshStatistics();
  }, [loadHistory, loadPendingScans, refreshStatistics]);

  const value: OCRContextType = {
    history,
    pendingScans,
    isLoading,
    isSyncing,
    lastSyncTime,
    statistics,
    loadHistory,
    addScan,
    updateScan,
    deleteScan,
    loadPendingScans,
    markScanSynced,
    refreshStatistics,
    syncPendingScans,
    clearHistory,
  };

  return <OCRContext.Provider value={value}>{children}</OCRContext.Provider>;
};

/**
 * Custom hook to use OCR Context
 */
export const useOCR = (): OCRContextType => {
  const context = React.useContext(OCRContext);
  if (context === undefined) {
    throw new Error('useOCR must be used within OCRProvider');
  }
  return context;
};
