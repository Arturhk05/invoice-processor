// decimal.js v10 uses `export =` in its .d.ts (CJS style) with no .d.mts
// counterpart for the ESM path. TypeScript nodenext resolves the ESM import
// to decimal.mjs, falls back to decimal.d.ts, and treats the export = as a
// namespace — causing TS2709/TS2351. This declaration overrides it with a
// proper ESM default export covering the API used in this project.
declare module 'decimal.js' {
  type DecimalValue = string | number | Decimal

  class Decimal {
    constructor(value: DecimalValue)
    isNegative(): boolean
    plus(n: DecimalValue): Decimal
    times(n: DecimalValue): Decimal
    toDecimalPlaces(dp: number, rm?: number): Decimal
    toFixed(dp?: number, rm?: number): string
    equals(n: DecimalValue): boolean
    static readonly ROUND_HALF_UP: number
  }

  export default Decimal
}
