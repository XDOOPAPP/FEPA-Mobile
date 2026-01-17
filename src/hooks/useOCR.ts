/**
 * Custom hooks for OCR features
 */

import { useState, useCallback, useEffect } from 'react';
import { useOCR } from '../store/OCRContext';
import { StoredOCRScan } from '../utils/ocrStorage';

/**
 * Hook to get filtered OCR history by category
 */
export const useOCRHistoryByCategory = (category?: string) => {
  const { history, isLoading } = useOCR();

  const filtered = category
    ? history.filter(scan => scan.category === category)
    : history;

  return {
    scans: filtered,
    total: filtered.length,
    totalAmount: filtered.reduce((sum, scan) => sum + scan.amount, 0),
    isLoading,
  };
};

/**
 * Hook to get OCR history for a date range
 */
export const useOCRHistoryByDateRange = (
  startDate?: string,
  endDate?: string,
) => {
  const { history, isLoading } = useOCR();

  const filtered = history.filter(scan => {
    const scanDate = new Date(scan.date);
    if (startDate && scanDate < new Date(startDate)) return false;
    if (endDate && scanDate > new Date(endDate)) return false;
    return true;
  });

  return {
    scans: filtered,
    total: filtered.length,
    totalAmount: filtered.reduce((sum, scan) => sum + scan.amount, 0),
    isLoading,
  };
};

/**
 * Hook to handle OCR scan upload status
 */
export const useOCRScanStatus = (scanId: string) => {
  const { history } = useOCR();

  const scan = history.find(s => s.id === scanId);

  return {
    scan,
    isSynced: scan?.syncedToBackend ?? false,
    syncedAt: scan?.syncedAt,
    isPending: scan && !scan.syncedToBackend,
  };
};

/**
 * Hook for paginated OCR history
 */
export const useOCRHistoryPaginated = (pageSize: number = 10) => {
  const { history, isLoading } = useOCR();
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(history.length / pageSize);
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPage = history.slice(startIndex, endIndex);

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 0 && newPage < totalPages) {
        setPage(newPage);
      }
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 0) {
      setPage(page - 1);
    }
  }, [page]);

  return {
    scans: currentPage,
    page,
    totalPages,
    totalScans: history.length,
    hasNextPage: page < totalPages - 1,
    hasPrevPage: page > 0,
    goToPage,
    nextPage,
    prevPage,
    isLoading,
  };
};

/**
 * Hook for searching OCR history
 */
export const useOCRSearch = (query: string) => {
  const { history, isLoading } = useOCR();
  const [results, setResults] = useState<StoredOCRScan[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = history.filter(
      scan =>
        scan.merchant.toLowerCase().includes(q) ||
        scan.category.toLowerCase().includes(q) ||
        scan.description.toLowerCase().includes(q) ||
        scan.amount.toString().includes(q),
    );

    setResults(filtered);
  }, [query, history]);

  return {
    results,
    total: results.length,
    isLoading,
  };
};

/**
 * Hook to get OCR scan analytics
 */
export const useOCRAnalytics = () => {
  const { history, statistics } = useOCR();

  const getAverageAmount = () => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, scan) => sum + scan.amount, 0);
    return Math.round(total / history.length);
  };

  const getMostCommonCategory = () => {
    if (history.length === 0) return null;
    const counts = history.reduce((acc, scan) => {
      acc[scan.category] = (acc[scan.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b,
    );
  };

  const getHighestAmount = () => {
    if (history.length === 0) return 0;
    return Math.max(...history.map(s => s.amount));
  };

  const getLowestAmount = () => {
    if (history.length === 0) return 0;
    return Math.min(...history.map(s => s.amount));
  };

  const getQRSuccessRate = () => {
    if (history.length === 0) return 0;
    const qrScans = history.filter(s => s.source === 'qr').length;
    return Math.round((qrScans / history.length) * 100);
  };

  const getAverageConfidence = () => {
    const scansWithConfidence = history.filter(s => s.confidence);
    if (scansWithConfidence.length === 0) return 0;
    const total = scansWithConfidence.reduce(
      (sum, s) => sum + (s.confidence || 0),
      0,
    );
    return Math.round(total / scansWithConfidence.length);
  };

  return {
    totalScans: history.length,
    totalAmount: history.reduce((sum, s) => sum + s.amount, 0),
    averageAmount: getAverageAmount(),
    highestAmount: getHighestAmount(),
    lowestAmount: getLowestAmount(),
    mostCommonCategory: getMostCommonCategory(),
    qrSuccessRate: getQRSuccessRate(),
    averageConfidence: getAverageConfidence(),
    statistics,
  };
};
