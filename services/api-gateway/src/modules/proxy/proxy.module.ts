import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TimeoutInterceptor } from '../../common/interceptors/timeout.interceptor.js';
import { InvoicesController } from './invoices/invoices.controller.js';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        timeout: config.getOrThrow<number>('proxy.timeoutMs'),
      }),
    }),
  ],
  controllers: [InvoicesController],
  providers: [TimeoutInterceptor],
})
export class ProxyModule {}
