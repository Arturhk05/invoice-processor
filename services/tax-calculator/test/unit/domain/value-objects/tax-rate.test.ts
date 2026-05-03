import { describe, it, expect } from 'vitest';
import {
  TaxRate,
  InvalidTaxRateError,
} from '../../../../src/domain/value-objects/tax-rate.js';

describe('TaxRate', () => {
  describe('create', () => {
    it('accepts zero', () => {
      expect(TaxRate.create(0).ok).toBe(true);
    });

    it('accepts the three v1 rates', () => {
      expect(TaxRate.create(0.12).ok).toBe(true); // ICMS
      expect(TaxRate.create(0.0165).ok).toBe(true); // PIS
      expect(TaxRate.create(0.076).ok).toBe(true); // COFINS
    });

    it('accepts 1 (100%)', () => {
      expect(TaxRate.create(1).ok).toBe(true);
    });

    it('rejects a negative value', () => {
      const result = TaxRate.create(-0.1);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBeInstanceOf(InvalidTaxRateError);
    });

    it('rejects a value greater than 1', () => {
      const result = TaxRate.create(1.01);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBeInstanceOf(InvalidTaxRateError);
    });

    it('rejects NaN', () => {
      expect(TaxRate.create(NaN).ok).toBe(false);
    });

    it('rejects Infinity', () => {
      expect(TaxRate.create(Infinity).ok).toBe(false);
    });
  });

  describe('value', () => {
    it('exposes the raw rate', () => {
      const result = TaxRate.create(0.12);
      if (!result.ok) throw new Error('Expected ok');
      expect(result.value.value).toBe(0.12);
    });
  });
});
