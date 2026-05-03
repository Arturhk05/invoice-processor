export type Result<T, E> = OkResult<T> | ErrResult<E>;

type OkResult<T> = { readonly ok: true; readonly value: T };
type ErrResult<E> = { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): OkResult<T> => ({ ok: true, value });
export const err = <E>(error: E): ErrResult<E> => ({ ok: false, error });
