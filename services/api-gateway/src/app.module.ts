import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration.js';
import { envValidationSchema } from './config/env.validation.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProxyModule } from './modules/proxy/proxy.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: false,
        quietReqLogger: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.getOrThrow<number>('throttle.ttl') * 1000,
          limit: config.getOrThrow<number>('throttle.limit'),
        },
        {
          name: 'login',
          ttl: config.getOrThrow<number>('throttle.ttl') * 1000,
          limit: config.getOrThrow<number>('throttle.loginLimit'),
        },
        {
          name: 'refresh',
          ttl: config.getOrThrow<number>('throttle.ttl') * 1000,
          limit: config.getOrThrow<number>('throttle.refreshLimit'),
        },
      ],
    }),
    AuthModule,
    ProxyModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
