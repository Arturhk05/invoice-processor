import { describe, it, expect } from 'vitest'
import { Cnpj, InvalidCnpjError } from '../../../../src/domain/value-objects/cnpj.js'

describe('Cnpj', () => {
  describe('create', () => {
    it('accepts a valid CNPJ (digits only)', () => {
      const result = Cnpj.create('11222333000181')
      expect(result.ok).toBe(true)
    })

    it('accepts a valid CNPJ (formatted)', () => {
      const result = Cnpj.create('11.222.333/0001-81')
      expect(result.ok).toBe(true)
    })

    it('strips formatting and stores only digits', () => {
      const result = Cnpj.create('11.222.333/0001-81')
      if (result.ok) expect(result.value.value).toBe('11222333000181')
    })

    it('accepts a second valid CNPJ', () => {
      expect(Cnpj.create('45997418000153').ok).toBe(true)
    })

    it('rejects a CNPJ with wrong check digits', () => {
      const result = Cnpj.create('11222333000100')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBeInstanceOf(InvalidCnpjError)
    })

    it('rejects a CNPJ with all identical digits', () => {
      expect(Cnpj.create('00000000000000').ok).toBe(false)
      expect(Cnpj.create('11111111111111').ok).toBe(false)
    })

    it('rejects a CNPJ with wrong length', () => {
      expect(Cnpj.create('1122233300018').ok).toBe(false)  // 13 digits
      expect(Cnpj.create('112223330001810').ok).toBe(false) // 15 digits
    })

    it('rejects an empty string', () => {
      expect(Cnpj.create('').ok).toBe(false)
    })
  })
})
