/**
 * OCR Storage Utility
 * Handles AsyncStorage operations for OCR scans and history
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredOCRScan {
  id: string;
  timestamp: number;
  date: string;
  amount: number;
  merchant: string;
  category: 'food' | 'transport' | 'shopping' | 'utilities' | 'other';
  description: string;
  items: Array<{ name: string; price: number }>;
  confidence?: number;
  source?: 'qr' | 'ocr';
  syncedToBackend: boolean;
  syncedAt?: number;
}

const STORAGE_KEYS = {
  OCR_HISTORY: '@ocr_history',
  OCR_PENDING: '@ocr_pending', // Scans waiting to be synced to backend
  LAST_SYNC: '@ocr_last_sync',
};

/**
 * Get all stored OCR scans
 */
export const getOCRHistory = async (): Promise<StoredOCRScan[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OCR_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[ocrStorage] Error loading OCR history:', error);
    return [];
  }
};

/**
 * Add new OCR scan to history
 */
export const addOCRScan = async (scan: StoredOCRScan): Promise<void> => {
  try {
    const history = await getOCRHistory();
    const updated = [scan, ...history]; // Most recent first
    await AsyncStorage.setItem(
      STORAGE_KEYS.OCR_HISTORY,
      JSON.stringify(updated),
    );
  } catch (error) {
    console.error('[ocrStorage] Error adding OCR scan:', error);
    throw error;
  }
};

/**
 * Update an OCR scan
 */
export const updateOCRScan = async (
  id: string,
  updates: Partial<StoredOCRScan>,
): Promise<void> => {
  try {
    const history = await getOCRHistory();
    const updated = history.map(scan =>
      scan.id === id ? { ...scan, ...updates } : scan,
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.OCR_HISTORY,
      JSON.stringify(updated),
    );
  } catch (error) {
    console.error('[ocrStorage] Error updating OCR scan:', error);
    throw error;
  }
};

/**
 * Delete an OCR scan
 */
export const deleteOCRScan = async (id: string): Promise<void> => {
  try {
    const history = await getOCRHistory();
    const updated = history.filter(scan => scan.id !== id);
    await AsyncStorage.setItem(
      STORAGE_KEYS.OCR_HISTORY,
      JSON.stringify(updated),
    );
  } catch (error) {
    console.error('[ocrStorage] Error deleting OCR scan:', error);
    throw error;
  }
};

/**
 * Get pending scans (not yet synced to backend)
 */
export const getPendingOCRScans = async (): Promise<StoredOCRScan[]> => {
  try {
    const history = await getOCRHistory();
    return history.filter(scan => !scan.syncedToBackend);
  } catch (error) {
    console.error('[ocrStorage] Error getting pending scans:', error);
    return [];
  }
};

/**
 * Mark scan as synced to backend
 */
export const markOCRScanSynced = async (
  id: string,
  expenseId?: string,
): Promise<void> => {
  try {
    await updateOCRScan(id, {
      syncedToBackend: true,
      syncedAt: Date.now(),
    });
  } catch (error) {
    console.error('[ocrStorage] Error marking scan synced:', error);
    throw error;
  }
};

/**
 * Get last sync timestamp
 */
export const getLastSyncTime = async (): Promise<number | null> => {
  try {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('[ocrStorage] Error getting last sync time:', error);
    return null;
  }
};

/**
 * Set last sync timestamp
 */
export const setLastSyncTime = async (timestamp: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
  } catch (error) {
    console.error('[ocrStorage] Error setting last sync time:', error);
    throw error;
  }
};

/**
 * Clear all OCR data
 */
export const clearOCRData = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.OCR_HISTORY),
      AsyncStorage.removeItem(STORAGE_KEYS.OCR_PENDING),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
    ]);
  } catch (error) {
    console.error('[ocrStorage] Error clearing OCR data:', error);
    throw error;
  }
};

/**
 * Get OCR statistics
 */
export const getOCRStatistics = async () => {
  try {
    const history = await getOCRHistory();
    const pending = await getPendingOCRScans();

    const totalScans = history.length;
    const syncedScans = history.filter(s => s.syncedToBackend).length;
    const pendingScans = pending.length;
    const totalAmount = history.reduce((sum, scan) => sum + scan.amount, 0);

    // By category
    const byCategory = history.reduce((acc, scan) => {
      acc[scan.category] = (acc[scan.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // By source (QR vs OCR)
    const bySource = history.reduce((acc, scan) => {
      const source = scan.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalScans,
      syncedScans,
      pendingScans,
      totalAmount,
      byCategory,
      bySource,
    };
  } catch (error) {
    console.error('[ocrStorage] Error getting OCR statistics:', error);
    return null;
  }
};
