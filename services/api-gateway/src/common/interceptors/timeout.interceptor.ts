import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly config: ConfigService) {}

  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ms = this.config.getOrThrow<number>('proxy.timeoutMs');
    return next.handle().pipe(
      timeout(ms),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  }
}
