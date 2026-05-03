import Decimal from 'decimal.js'
import { DomainError } from '../errors/domain-error.js'
import { type Result, ok, err } from '../result.js'

export class InvalidMoneyError extends DomainError {
  constructor(value: string) {
    super(`Money value must be non-negative, got: ${value}`)
  }
}

export class Money {
  private constructor(private readonly _value: Decimal) {}

  static create(value: string | number): Result<Money, InvalidMoneyError> {
    try {
      const decimal = new Decimal(value)
      if (decimal.isNegative()) {
        return err(new InvalidMoneyError(String(value)))
      }
      return ok(new Money(decimal))
    } catch {
      return err(new InvalidMoneyError(String(value)))
    }
  }

  static fromString(value: string): Money {
    return new Money(new Decimal(value))
  }

  add(other: Money): Money {
    return new Money(this._value.plus(other._value))
  }

  multiply(factor: number): Money {
    return new Money(this._value.times(factor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP))
  }

  equals(other: Money): boolean {
    return this._value.equals(other._value)
  }

  toString(): string {
    return this._value.toFixed(2)
  }
}
