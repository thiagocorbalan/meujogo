import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';

const request = require('supertest');

@Controller()
class TestController {
  @Get()
  getHello() {
    return 'ok';
  }
}

describe('REQ-SEC-03: CORS Whitelist', () => {
  let app: INestApplication;
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    process.env.FRONTEND_URL = 'http://localhost:4000';
    process.env.NODE_ENV = 'development';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();

    const allowedOrigins: string[] = [];
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('http://localhost:4000');
    }

    app.enableCors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      credentials: true,
      maxAge: 3600,
    });

    await app.init();
  }, 30000);

  afterAll(async () => {
    process.env.FRONTEND_URL = originalFrontendUrl;
    process.env.NODE_ENV = originalNodeEnv;
    if (app) {
      await app.close();
    }
  });

  describe('Allowed origins', () => {
    it('should return CORS headers for allowed origin (FRONTEND_URL)', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Origin', 'http://localhost:4000');

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:4000',
      );
    });

    it('should allow credentials in CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Origin', 'http://localhost:4000');

      expect(response.headers['access-control-allow-credentials']).toBe(
        'true',
      );
    });
  });

  describe('Disallowed origins', () => {
    it('should not return Access-Control-Allow-Origin for evil origin', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Origin', 'http://evil-site.com');

      expect(
        response.headers['access-control-allow-origin'],
      ).not.toBe('http://evil-site.com');
    });

    it('should not return Access-Control-Allow-Origin for random port', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Origin', 'http://localhost:9999');

      expect(
        response.headers['access-control-allow-origin'],
      ).not.toBe('http://localhost:9999');
    });
  });

  describe('OPTIONS preflight', () => {
    it('should return 204 for preflight from allowed origin', async () => {
      const response = await request(app.getHttpServer())
        .options('/')
        .set('Origin', 'http://localhost:4000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:4000',
      );
    });

    it('should include allowed methods in preflight response', async () => {
      const response = await request(app.getHttpServer())
        .options('/')
        .set('Origin', 'http://localhost:4000')
        .set('Access-Control-Request-Method', 'POST');

      const allowedMethods =
        response.headers['access-control-allow-methods'] || '';
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PUT');
      expect(allowedMethods).toContain('DELETE');
    });

    it('should include allowed headers in preflight response', async () => {
      const response = await request(app.getHttpServer())
        .options('/')
        .set('Origin', 'http://localhost:4000')
        .set('Access-Control-Request-Method', 'POST')
        .set(
          'Access-Control-Request-Headers',
          'Content-Type,Authorization,X-CSRF-Token',
        );

      const allowedHeaders =
        response.headers['access-control-allow-headers'] || '';
      expect(allowedHeaders.toLowerCase()).toContain('content-type');
      expect(allowedHeaders.toLowerCase()).toContain('authorization');
      expect(allowedHeaders.toLowerCase()).toContain('x-csrf-token');
    });
  });
});
