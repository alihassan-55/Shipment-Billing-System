import { describe, it, expect } from 'vitest';

describe('Shipper Validation', () => {
  describe('CNIC validation', () => {
    it('should accept valid CNIC formats', () => {
      const validCNICs = [
        '12345-1234567-1',
        '12345-1234567-2',
        '1234567890123',
        '12345-1234567'
      ];

      validCNICs.forEach(cnic => {
        expect(/^[0-9-]{5,20}$/.test(cnic)).toBe(true);
      });
    });

    it('should reject invalid CNIC formats', () => {
      const invalidCNICs = [
        '1234-1234567-1', // Too short
        '12345-1234567-1-2', // Too long
        '12345-1234567-a', // Contains letters
        '12345 1234567 1', // Contains spaces
        '' // Empty
      ];

      invalidCNICs.forEach(cnic => {
        expect(/^[0-9-]{5,20}$/.test(cnic)).toBe(false);
      });
    });
  });

  describe('NTN validation', () => {
    it('should accept valid NTN formats', () => {
      const validNTNs = [
        'NTN123456',
        '123456789',
        'ABC-123-DEF',
        '12345',
        'NTN-123456-789'
      ];

      validNTNs.forEach(ntn => {
        expect(/^[A-Za-z0-9-]{3,25}$/.test(ntn)).toBe(true);
      });
    });

    it('should reject invalid NTN formats', () => {
      const invalidNTNs = [
        'AB', // Too short
        '123456789012345678901234567890', // Too long
        'NTN 123456', // Contains spaces
        'NTN@123456', // Contains special chars
        '' // Empty
      ];

      invalidNTNs.forEach(ntn => {
        expect(/^[A-Za-z0-9-]{3,25}$/.test(ntn)).toBe(false);
      });
    });
  });
});







