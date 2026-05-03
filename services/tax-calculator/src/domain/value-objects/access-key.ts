import { DomainError } from '../errors/domain-error.js';
import { type Result, ok, err } from '../result.js';

export class InvalidAccessKeyError extends DomainError {
  constructor(value: string) {
    super(`Access key must be 44 digits, got: "${value}"`);
  }
}

export class AccessKey {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<AccessKey, InvalidAccessKeyError> {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 44) {
      return err(new InvalidAccessKeyError(value));
    }
    return ok(new AccessKey(digits));
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
