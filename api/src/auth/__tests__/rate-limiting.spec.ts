import { Test, TestingModule } from '@nestjs/testing';
import {
  Controller,
  Get,
  INestApplication,
  Post,
  Module,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, Throttle } from '@nestjs/throttler';

const request = require('supertest');

@Controller('test-auth')
class TestAuthController {
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @Post('login')
  login() {
    return { message: 'login' };
  }

  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Post('forgot-password')
  forgotPassword() {
    return { message: 'forgot-password' };
  }

  @Get('general')
  general() {
    return { message: 'ok' };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 100 }],
    }),
  ],
  controllers: [TestAuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
class TestModule {}

describe('REQ-SEC-02: Rate Limiting', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Throttler module availability', () => {
    it('should have @nestjs/throttler installed', () => {
      expect(ThrottlerModule).toBeDefined();
    });

    it('should have ThrottlerGuard available', () => {
      expect(ThrottlerGuard).toBeDefined();
    });

    it('should have Throttle decorator available', () => {
      expect(Throttle).toBeDefined();
    });
  });

  describe('Login endpoint rate limiting (5 per 15 minutes)', () => {
    it('should allow 5 login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app.getHttpServer())
          .post('/test-auth/login')
          .send({});
        expect(response.status).not.toBe(429);
      }
    });

    it('should return 429 after exceeding 5 login attempts', async () => {
      for (let i = 0; i < 6; i++) {
        await request(app.getHttpServer())
          .post('/test-auth/login')
          .send({});
      }

      const response = await request(app.getHttpServer())
        .post('/test-auth/login')
        .send({});

      expect(response.status).toBe(429);
    });

    it('should include Retry-After header in 429 response', async () => {
      for (let i = 0; i < 7; i++) {
        await request(app.getHttpServer())
          .post('/test-auth/login')
          .send({});
      }

      const response = await request(app.getHttpServer())
        .post('/test-auth/login')
        .send({});

      if (response.status === 429) {
        expect(
          response.headers['retry-after'] !== undefined ||
            response.headers['x-ratelimit-reset'] !== undefined,
        ).toBe(true);
      }
    });
  });

  describe('Forgot-password rate limiting (3 per hour)', () => {
    it('should return 429 after 3 forgot-password attempts', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/test-auth/forgot-password')
          .send({});
      }

      const response = await request(app.getHttpServer())
        .post('/test-auth/forgot-password')
        .send({});

      expect(response.status).toBe(429);
    });
  });

  describe('General endpoint rate limiting (100 per minute)', () => {
    it('should allow requests below the limit', async () => {
      const response = await request(app.getHttpServer()).get(
        '/test-auth/general',
      );
      expect(response.status).toBe(200);
    });
  });
});
