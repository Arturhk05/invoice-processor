import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { InvoicesController } from '../../../../src/modules/proxy/invoices/invoices.controller';
import { CreateInvoiceDto } from '../../../../src/modules/proxy/invoices/dto/create-invoice.dto';

const dto: CreateInvoiceDto = {
  accessKey: '35240112345678000195550010000001231000001230',
  issuerCnpj: '12345678000195',
  recipientCnpj: '98765432000100',
  issuedAt: '2024-01-15T10:30:00Z',
  totalAmount: 1500.0,
};

const makeHttp = (
  data: unknown = { id: 'abc-123' },
  status = 202,
): jest.Mocked<Pick<HttpService, 'post'>> => ({
  post: jest.fn().mockReturnValue(of({ data, status } as AxiosResponse)),
});

const makeConfig = (
  url = 'http://ingestion:8080',
  token = 'test-internal-token',
): jest.Mocked<ConfigService> =>
  ({
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      if (key === 'ingestion.url') return url;
      if (key === 'ingestion.internalToken') return token;
      throw new Error(`unexpected config key: ${key}`);
    }),
  }) as unknown as jest.Mocked<ConfigService>;

const makeController = (
  http = makeHttp(),
  config = makeConfig(),
): InvoicesController =>
  new InvoicesController(http as unknown as HttpService, config);

describe('InvoicesController', () => {
  describe('submit', () => {
    it('forwards dto to ingestion service with internal token header', async () => {
      const http = makeHttp({ id: 'abc-123' });
      const config = makeConfig('http://ingestion:8080', 'my-secret');
      const controller = makeController(http, config);

      const result = await controller.submit(dto);

      expect(http.post).toHaveBeenCalledWith(
        'http://ingestion:8080/invoices',
        dto,
        { headers: { 'X-Internal-Token': 'my-secret' } },
      );
      expect(result).toEqual({ id: 'abc-123' });
    });

    it('reads ingestion url and internal token from config on construction', () => {
      const config = makeConfig('http://custom-host:9090', 'token-abc');
      const http = makeHttp();
      makeController(http, config);

      expect(config.getOrThrow).toHaveBeenCalledWith('ingestion.url');
      expect(config.getOrThrow).toHaveBeenCalledWith('ingestion.internalToken');
    });

    it('propagates http status from ingestion 4xx response', async () => {
      const axiosError = Object.assign(new Error('Unprocessable'), {
        isAxiosError: true,
        response: {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          data: { message: 'Invalid access key' },
        },
      });
      const http = {
        post: jest.fn().mockReturnValue(throwError(() => axiosError)),
      };
      const controller = makeController(http);

      await expect(controller.submit(dto)).rejects.toThrow(
        new HttpException(
          { message: 'Invalid access key' },
          HttpStatus.UNPROCESSABLE_ENTITY,
        ),
      );
    });

    it('propagates http status from ingestion 5xx response', async () => {
      const axiosError = Object.assign(new Error('Bad gateway'), {
        isAxiosError: true,
        response: {
          status: HttpStatus.BAD_GATEWAY,
          data: 'Bad gateway',
        },
      });
      const http = {
        post: jest.fn().mockReturnValue(throwError(() => axiosError)),
      };
      const controller = makeController(http);

      await expect(controller.submit(dto)).rejects.toThrow(HttpException);
    });

    it('re-throws non-axios errors', async () => {
      const networkError = new Error('ECONNREFUSED');
      const http = {
        post: jest.fn().mockReturnValue(throwError(() => networkError)),
      };
      const controller = makeController(http);

      await expect(controller.submit(dto)).rejects.toThrow('ECONNREFUSED');
    });

    it('re-throws axios errors without a response', async () => {
      const axiosError = Object.assign(new Error('Network Error'), {
        isAxiosError: true,
        response: undefined,
      });
      const http = {
        post: jest.fn().mockReturnValue(throwError(() => axiosError)),
      };
      const controller = makeController(http);

      await expect(controller.submit(dto)).rejects.toThrow('Network Error');
    });
  });
});
