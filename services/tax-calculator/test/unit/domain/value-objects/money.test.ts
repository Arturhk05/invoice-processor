import { describe, it, expect } from 'vitest'
import { Money, InvalidMoneyError } from '../../../../src/domain/value-objects/money.js'
import type { Result } from '../../../../src/domain/result.js'

function unwrap<T>(result: Result<T, unknown>): T {
  if (!result.ok) throw new Error(`Expected ok result, got error: ${result.error}`)
  return result.value
}

describe('Money', () => {
  describe('create', () => {
    it('accepts a positive number', () => {
      const result = Money.create(100)
      expect(result.ok).toBe(true)
      expect(unwrap(result).toString()).toBe('100.00')
    })

    it('accepts a decimal string', () => {
      const result = Money.create('1500.75')
      expect(result.ok).toBe(true)
      expect(unwrap(result).toString()).toBe('1500.75')
    })

    it('accepts zero', () => {
      expect(Money.create(0).ok).toBe(true)
    })

    it('rejects a negative value', () => {
      const result = Money.create(-1)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBeInstanceOf(InvalidMoneyError)
    })

    it('rejects an invalid string', () => {
      const result = Money.create('abc')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBeInstanceOf(InvalidMoneyError)
    })
  })

  describe('fromString', () => {
    it('reconstructs from a stored decimal string', () => {
      const money = Money.fromString('180.00')
      expect(money.toString()).toBe('180.00')
    })
  })

  describe('add', () => {
    it('sums two money values', () => {
      const a = unwrap(Money.create(100))
      const b = unwrap(Money.create('50.25'))
      expect(a.add(b).toString()).toBe('150.25')
    })
  })

  describe('multiply', () => {
    it('multiplies by ICMS rate', () => {
      const base = unwrap(Money.create(1500))
      expect(base.multiply(0.12).toString()).toBe('180.00')
    })

    it('multiplies by COFINS rate', () => {
      const base = unwrap(Money.create(1000))
      expect(base.multiply(0.076).toString()).toBe('76.00')
    })

    it('multiplies by PIS rate', () => {
      const base = unwrap(Money.create(1000))
      expect(base.multiply(0.0165).toString()).toBe('16.50')
    })

    it('rounds half-up', () => {
      const base = unwrap(Money.create(1))
      // 1 * 0.015 = 0.015 → rounds to 0.02
      expect(base.multiply(0.015).toString()).toBe('0.02')
    })
  })

  describe('equals', () => {
    it('returns true for equal values', () => {
      const a = unwrap(Money.create('100.00'))
      const b = unwrap(Money.create(100))
      expect(a.equals(b)).toBe(true)
    })

    it('returns false for different values', () => {
      const a = unwrap(Money.create(100))
      const b = unwrap(Money.create(200))
      expect(a.equals(b)).toBe(false)
    })
  })
})
