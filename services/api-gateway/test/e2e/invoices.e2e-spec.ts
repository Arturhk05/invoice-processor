import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { NEVER, of, throwError } from 'rxjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

const validDto = {
  accessKey: '35240112345678000195550010000001231000001230',
  issuerCnpj: '12345678000195',
  recipientCnpj: '98765432000100',
  issuedAt: '2024-01-15T10:30:00Z',
  totalAmount: 1500.0,
};

describe('Invoices (e2e)', () => {
  let app: INestApplication<App>;
  let mockPost: jest.Mock;

  beforeAll(async () => {
    mockPost = jest.fn();

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue({ post: mockPost })
      .compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const getAccessToken = async (): Promise<string> => {
    const res = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@invoice-processor.com',
      password: 'admin123456',
    });
    return res.body.accessToken as string;
  };

  describe('POST /invoices', () => {
    describe('authentication', () => {
      it('returns 401 without Authorization header', async () => {
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .send(validDto);

        expect(res.status).toBe(401);
      });

      it('returns 401 with malformed token', async () => {
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', 'Bearer not.a.valid.jwt')
          .send(validDto);

        expect(res.status).toBe(401);
      });

      it('returns 401 with expired/invalid signature token', async () => {
        const fakeToken =
          'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.wrong-signature';

        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${fakeToken}`)
          .send(validDto);

        expect(res.status).toBe(401);
      });
    });

    describe('validation', () => {
      let token: string;

      beforeAll(async () => {
        token = await getAccessToken();
      });

      it('returns 400 when accessKey is missing', async () => {
        const { accessKey: _, ...body } = validDto;
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send(body);

        expect(res.status).toBe(400);
      });

      it('returns 400 when accessKey has wrong length', async () => {
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send({ ...validDto, accessKey: '1234' });

        expect(res.status).toBe(400);
      });

      it('returns 400 when accessKey contains non-digits', async () => {
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send({
            ...validDto,
            accessKey: 'ABCDE12345678000195550010000001231000001230',
          });

        expect(res.status).toBe(400);
      });

      it('returns 400 when issuerCnpj is not 14 digits', async () => {
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send({ ...validDto, issuerCnpj: '1234' });

        expect(res.status).toBe(400);
      });

      it('returns 400 when recipientCnpj is missing', async () => {
        const { recipientCnpj: _, ...body } = validDto;
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send(body);

        expect(res.status).toBe(400);
      });

      it('returns 400 when issuedAt is not a valid ISO date', async () => {
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send({ ...validDto, issuedAt: 'not-a-date' });

        expect(res.status).toBe(400);
      });

      it('returns 400 when totalAmount is zero', async () => {
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send({ ...validDto, totalAmount: 0 });

        expect(res.status).toBe(400);
      });

      it('returns 400 when totalAmount is negative', async () => {
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send({ ...validDto, totalAmount: -100 });

        expect(res.status).toBe(400);
      });

      it('returns 400 on unknown fields (whitelist)', async () => {
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send({ ...validDto, unknownField: 'surprise' });

        expect(res.status).toBe(400);
      });

      it('returns 400 on empty body', async () => {
        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send({});

        expect(res.status).toBe(400);
      });
    });

    describe('proxy behaviour', () => {
      let token: string;

      beforeAll(async () => {
        token = await getAccessToken();
      });

      it('returns 202 and ingestion response on valid payload', async () => {
        const ingestionResponse = { id: 'inv-abc-123', status: 'queued' };
        mockPost.mockReturnValueOnce(
          of({ data: ingestionResponse, status: 202 } as AxiosResponse),
        );

        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send(validDto);

        expect(res.status).toBe(202);
        expect(res.body).toEqual(ingestionResponse);
      });

      it('forwards only whitelisted fields with internal token header to ingestion service', async () => {
        mockPost.mockReturnValueOnce(
          of({ data: {}, status: 202 } as AxiosResponse),
        );

        await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send(validDto);

        expect(mockPost).toHaveBeenCalledWith(
          'http://ingestion:8080/invoices',
          validDto,
          {
            headers: {
              'X-Internal-Token': 'e2e-test-internal-token-abcdef123456',
            },
          },
        );
      });

      it('returns 422 when ingestion rejects with 422', async () => {
        const axiosError = Object.assign(new Error('Unprocessable'), {
          isAxiosError: true,
          response: {
            status: 422,
            data: { message: 'Duplicate access key' },
          },
        });
        mockPost.mockReturnValueOnce(throwError(() => axiosError));

        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send(validDto);

        expect(res.status).toBe(422);
      });

      it('returns 500 when ingestion is unreachable (no response)', async () => {
        const networkError = Object.assign(new Error('ECONNREFUSED'), {
          isAxiosError: true,
          response: undefined,
        });
        mockPost.mockReturnValueOnce(throwError(() => networkError));

        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send(validDto);

        expect(res.status).toBe(500);
      });

      it('returns 408 when ingestion does not respond within timeout', async () => {
        mockPost.mockReturnValueOnce(NEVER);

        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send(validDto);

        expect(res.status).toBe(408);
      }, 1000);

      it('error response follows standard error shape', async () => {
        const axiosError = Object.assign(new Error('Bad Request'), {
          isAxiosError: true,
          response: { status: 400, data: { message: 'bad input' } },
        });
        mockPost.mockReturnValueOnce(throwError(() => axiosError));

        const res = await request(app.getHttpServer())
          .post('/invoices')
          .set('Authorization', `Bearer ${token}`)
          .send(validDto);

        expect(res.body).toMatchObject({
          statusCode: 400,
          timestamp: expect.any(String),
          path: '/invoices',
        });
      });
    });
  });
});
