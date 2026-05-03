import { DomainError } from '../errors/domain-error.js';
import { type Result, ok, err } from '../result.js';

export class InvalidCnpjError extends DomainError {
  constructor(value: string) {
    super(`Invalid CNPJ: ${value}`);
  }
}

export class Cnpj {
  private constructor(private readonly _value: string) {}

  static create(value: string): Result<Cnpj, InvalidCnpjError> {
    const digits = value.replace(/\D/g, '');
    if (!Cnpj.isValid(digits)) {
      return err(new InvalidCnpjError(value));
    }
    return ok(new Cnpj(digits));
  }

  private static isValid(digits: string): boolean {
    if (digits.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(digits)) return false;

    return (
      Cnpj.calcDigit(digits, 12) === parseInt(digits[12]!, 10) &&
      Cnpj.calcDigit(digits, 13) === parseInt(digits[13]!, 10)
    );
  }

  private static calcDigit(digits: string, length: number): number {
    let sum = 0;
    let weight = length === 12 ? 5 : 6;
    for (let i = 0; i < length; i++) {
      sum += parseInt(digits[i]!, 10) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
