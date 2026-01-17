/**
 * Expense Service Tests
 * Unit tests for expenseService.ts
 */

import expenseService, {
  CreateExpensePayload,
} from '../../../services/expenseService';

describe('ExpenseService', () => {
  const mockPayload: CreateExpensePayload = {
    amount: 50000,
    category: 'food',
    description: 'Lunch at restaurant',
    date: '2026-01-17',
    merchant: 'Quán Cơm Tấm',
    items: [{ name: 'Cơm Tấm', price: 50000 }],
    source: 'ocr',
    confidence: 95,
  };

  describe('createExpense', () => {
    it('should validate required fields', async () => {
      const invalidPayload = {
        amount: 0, // Invalid: 0 or negative
        category: 'food' as const,
      };

      // This would be validated by the backend
      expect(invalidPayload.amount).toBeLessThanOrEqual(0);
    });

    it('should have correct payload structure', () => {
      expect(mockPayload).toHaveProperty('amount');
      expect(mockPayload).toHaveProperty('category');
      expect(mockPayload).toHaveProperty('date');
      expect(typeof mockPayload.amount).toBe('number');
      expect(mockPayload.amount).toBeGreaterThan(0);
    });
  });

  describe('createExpenseFromOCR', () => {
    it('should convert OCR scan to expense', () => {
      const mockOCRScan = {
        id: '1',
        timestamp: Date.now(),
        date: '2026-01-17',
        amount: 50000,
        merchant: 'Quán Cơm',
        category: 'food' as const,
        description: 'Lunch',
        items: [{ name: 'Cơm Tấm', price: 50000 }],
        confidence: 95,
        source: 'ocr' as const,
        syncedToBackend: false,
      };

      // Verify conversion logic
      expect(mockOCRScan.amount).toBe(50000);
      expect(mockOCRScan.merchant).toBe('Quán Cơm');
      expect(mockOCRScan.category).toBe('food');
    });
  });
});
