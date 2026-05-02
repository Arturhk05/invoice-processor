import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(LoggingInterceptor.name)
    private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = req;
    const requestId = crypto.randomUUID();
    const start = Date.now();

    res.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap(() =>
        this.log(
          requestId,
          method,
          url,
          res.statusCode,
          start,
          ip,
          req.user?.id,
        ),
      ),
      catchError((err: unknown) => {
        const status = this.getStatus(err);
        this.log(requestId, method, url, status, start, ip, req.user?.id);
        return throwError(() => err);
      }),
    );
  }

  private log(
    requestId: string,
    method: string,
    path: string,
    statusCode: number,
    start: number,
    ip: string | undefined,
    userId?: string,
  ) {
    const ms = Date.now() - start;
    const duration = ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
    const level =
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    this.logger[level]({
      requestId,
      method,
      path,
      statusCode,
      duration,
      userId,
      ip,
    });
  }

  private getStatus(err: unknown): number {
    if (err !== null && typeof err === 'object' && 'status' in err) {
      return (err as { status: number }).status;
    }
    return 500;
  }
}
