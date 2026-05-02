import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app.getHttpServer()).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'ok',
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      });
    });

    it('does not require authentication', async () => {
      const res = await request(app.getHttpServer()).get('/health');
      expect(res.status).toBe(200);
    });

    it('is not rate limited', async () => {
      const requests = Array.from({ length: 20 }, () =>
        request(app.getHttpServer()).get('/health'),
      );
      const responses = await Promise.all(requests);
      responses.forEach((res) => expect(res.status).toBe(200));
    });
  });
});
