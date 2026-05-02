import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Observable, tap } from 'rxjs';
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
      tap(() => {
        this.logger.info({
          requestId,
          method,
          path: url,
          statusCode: res.statusCode,
          duration: `${Date.now() - start}ms`,
          userId: req.user?.id,
          ip,
        });
      }),
    );
  }
}
