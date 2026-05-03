import { DomainError } from '../errors/domain-error.js'
import { type Result, ok, err } from '../result.js'

export class InvalidTaxRateError extends DomainError {
  constructor(value: number) {
    super(`Tax rate must be between 0 and 1, got: ${value}`)
  }
}

export class TaxRate {
  private constructor(private readonly _value: number) {}

  static create(value: number): Result<TaxRate, InvalidTaxRateError> {
    if (value < 0 || value > 1 || !isFinite(value)) {
      return err(new InvalidTaxRateError(value))
    }
    return ok(new TaxRate(value))
  }

  get value(): number {
    return this._value
  }

  toString(): string {
    return this._value.toString()
  }
}
