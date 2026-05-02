import { ExecutionContext, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallHandler } from '@nestjs/common';
import { Observable, TimeoutError, of, throwError } from 'rxjs';
import { TimeoutInterceptor } from '../../../../src/common/interceptors/timeout.interceptor';

const makeConfig = (ms = 5000): jest.Mocked<ConfigService> =>
  ({
    getOrThrow: jest.fn().mockReturnValue(ms),
  }) as unknown as jest.Mocked<ConfigService>;

const makeHandler = (source: Observable<unknown>): CallHandler => ({
  handle: () => source,
});

const ctx = {} as ExecutionContext;

describe('TimeoutInterceptor', () => {
  it('passes through value from handler', (done) => {
    const interceptor = new TimeoutInterceptor(makeConfig(5000));
    const handler = makeHandler(of({ ok: true }));

    interceptor.intercept(ctx, handler).subscribe({
      next: (val) => expect(val).toEqual({ ok: true }),
      complete: done,
    });
  });

  it('converts TimeoutError to RequestTimeoutException', (done) => {
    const interceptor = new TimeoutInterceptor(makeConfig(5000));
    const handler = makeHandler(throwError(() => new TimeoutError()));

    interceptor.intercept(ctx, handler).subscribe({
      error: (err: unknown) => {
        expect(err).toBeInstanceOf(RequestTimeoutException);
        done();
      },
    });
  });

  it('re-throws non-timeout errors unchanged', (done) => {
    const interceptor = new TimeoutInterceptor(makeConfig(5000));
    const cause = new Error('unexpected');
    const handler = makeHandler(throwError(() => cause));

    interceptor.intercept(ctx, handler).subscribe({
      error: (err: unknown) => {
        expect(err).toBe(cause);
        done();
      },
    });
  });

  it('reads timeout value from config', () => {
    const config = makeConfig(3000);
    const interceptor = new TimeoutInterceptor(config);
    const handler = makeHandler(of(null));

    interceptor.intercept(ctx, handler).subscribe();

    expect(config.getOrThrow).toHaveBeenCalledWith('proxy.timeoutMs');
  });
});
