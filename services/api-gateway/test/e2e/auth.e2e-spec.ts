import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-min-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-long';
    process.env.RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
    process.env.THROTTLE_LIMIT = '1000';
    process.env.THROTTLE_LOGIN_LIMIT = '1000';
    process.env.THROTTLE_REFRESH_LIMIT = '1000';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  describe('POST /auth/login', () => {
    it('returns 200 and tokens on valid credentials', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'admin@invoice-processor.com',
        password: 'admin123456',
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('returns 401 with error shape on wrong password', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'admin@invoice-processor.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        statusCode: 401,
        message: expect.any(String),
        timestamp: expect.any(String),
        path: '/auth/login',
      });
    });

    it('returns 401 on unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'unknown@test.com', password: 'admin123456' });

      expect(res.status).toBe(401);
    });

    it('returns 400 on invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'admin123456' });

      expect(res.status).toBe(400);
    });

    it('returns 400 on missing password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@invoice-processor.com' });

      expect(res.status).toBe(400);
    });

    it('returns 400 on empty body', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'admin@invoice-processor.com',
        password: 'admin123456',
      });

      refreshToken = res.body.refreshToken as string;
    });

    it('returns 200 and new tokens on valid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('returns 401 on invalid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.status).toBe(401);
    });

    it('returns 401 on missing refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({});

      expect(res.status).toBe(401);
    });
  });
});
