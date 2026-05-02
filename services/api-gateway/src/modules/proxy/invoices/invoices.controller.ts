import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { TimeoutInterceptor } from '../../../common/interceptors/timeout.interceptor.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  private readonly ingestionUrl: string;
  private readonly internalToken: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.ingestionUrl = this.config.getOrThrow<string>('ingestion.url');
    this.internalToken = this.config.getOrThrow<string>(
      'ingestion.internalToken',
    );
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: {} })
  @UseInterceptors(TimeoutInterceptor)
  @ApiOperation({ summary: 'Submit an invoice for processing' })
  @ApiBody({ type: CreateInvoiceDto })
  @ApiResponse({ status: 202, description: 'Invoice accepted for processing' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'Invoice with this accessKey already exists',
  })
  @ApiResponse({ status: 408, description: 'Ingestion Service timeout' })
  @ApiResponse({
    status: 422,
    description: 'Ingestion Service rejected the payload',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async submit(@Body() dto: CreateInvoiceDto): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.ingestionUrl}/invoices`, dto, {
          headers: { 'X-Internal-Token': this.internalToken },
        }),
      );
      return response.data;
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        throw new HttpException(
          err.response.data as string,
          err.response.status,
        );
      }
      throw err;
    }
  }
}
