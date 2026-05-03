import { describe, it, expect } from 'vitest';
import {
  AccessKey,
  InvalidAccessKeyError,
} from '../../../../src/domain/value-objects/access-key.js';

const VALID_KEY = '35240312345678000195550010000001231234567890';

describe('AccessKey', () => {
  describe('create', () => {
    it('accepts a valid 44-digit key', () => {
      const result = AccessKey.create(VALID_KEY);
      expect(result.ok).toBe(true);
    });

    it('strips non-digit characters before validating', () => {
      const formatted =
        '3524 0312 3456 7800 0195 5500 1000 0001 2312 3456 7890';
      const result = AccessKey.create(formatted);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.value).toBe(VALID_KEY);
    });

    it('rejects a key with fewer than 44 digits', () => {
      const result = AccessKey.create(
        '3524031234567800019555001000000123123456789',
      );
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.error).toBeInstanceOf(InvalidAccessKeyError);
    });

    it('rejects a key with more than 44 digits', () => {
      const result = AccessKey.create(
        '352403123456780001955500100000012312345678901',
      );
      expect(result.ok).toBe(false);
    });

    it('rejects an empty string', () => {
      expect(AccessKey.create('').ok).toBe(false);
    });
  });

  describe('value', () => {
    it('exposes the raw digits', () => {
      const result = AccessKey.create(VALID_KEY);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const key = result.value;
      expect(key.value).toBe(VALID_KEY);
      expect(key.value).toHaveLength(44);
    });
  });
});
