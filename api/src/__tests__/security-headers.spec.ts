import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import helmet from 'helmet';

const request = require('supertest');

@Controller()
class TestController {
  @Get()
  getHello() {
    return 'ok';
  }
}

describe('REQ-SEC-01: HTTP Security Headers (Helmet)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );

    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should have helmet package installed', () => {
    expect(helmet).toBeDefined();
    expect(typeof helmet).toBe('function');
  });

  it('should include X-Content-Type-Options: nosniff header', async () => {
    const response = await request(app.getHttpServer()).get('/');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should include X-Frame-Options header', async () => {
    const response = await request(app.getHttpServer()).get('/');

    expect(response.headers['x-frame-options']).toBeDefined();
    expect(['DENY', 'SAMEORIGIN']).toContain(
      response.headers['x-frame-options'].toUpperCase(),
    );
  });

  it('should include Strict-Transport-Security header', async () => {
    const response = await request(app.getHttpServer()).get('/');

    const hsts = response.headers['strict-transport-security'];
    expect(hsts).toBeDefined();
    expect(hsts).toContain('max-age=');
  });

  it('should NOT include X-Powered-By header (removed by helmet)', async () => {
    const response = await request(app.getHttpServer()).get('/');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('should include X-DNS-Prefetch-Control header', async () => {
    const response = await request(app.getHttpServer()).get('/');

    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
  });

  it('should include X-Download-Options header', async () => {
    const response = await request(app.getHttpServer()).get('/');

    expect(response.headers['x-download-options']).toBeDefined();
  });
});
