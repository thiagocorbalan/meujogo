import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from '../http-exception.filter';

describe('REQ-SEC-06: Global Exception Filter', () => {
  let filter: HttpExceptionFilter;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    filter = new HttpExceptionFilter();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  function createMockHost(): {
    host: ArgumentsHost;
    json: jest.Mock;
    status: jest.Mock;
  } {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const getResponse = jest.fn().mockReturnValue({ status });
    const getRequest = jest
      .fn()
      .mockReturnValue({ url: '/test', method: 'GET' });

    const host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse,
        getRequest,
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn().mockReturnValue('http'),
    } as unknown as ArgumentsHost;

    return { host, json, status };
  }

  it('should return { statusCode, message, timestamp } format for HttpExceptions', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    const { host, json, status } = createMockHost();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: expect.any(String),
        timestamp: expect.any(String),
      }),
    );
  });

  it('should NOT include stack traces when NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production';
    const prodFilter = new HttpExceptionFilter();
    const exception = new Error('Internal server error');
    const { host, json } = createMockHost();

    prodFilter.catch(exception, host);

    const responseBody = json.mock.calls[0][0];
    expect(responseBody).not.toHaveProperty('stack');
  });

  it('should include stack traces when NODE_ENV=development', () => {
    process.env.NODE_ENV = 'development';
    const devFilter = new HttpExceptionFilter();
    const error = new Error('Dev error');
    const { host, json } = createMockHost();

    devFilter.catch(error, host);

    const responseBody = json.mock.calls[0][0];
    expect(responseBody.stack).toBeDefined();
    expect(responseBody.stack).toContain('Error: Dev error');
  });

  it('should pass HttpException through with its own status code (403)', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    const { host, json, status } = createMockHost();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(403);
    const responseBody = json.mock.calls[0][0];
    expect(responseBody.statusCode).toBe(403);
  });

  it('should pass HttpException through with its own status code (404)', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    const { host, json, status } = createMockHost();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(404);
    const responseBody = json.mock.calls[0][0];
    expect(responseBody.statusCode).toBe(404);
  });

  it('should return 500 for unknown/unhandled exceptions', () => {
    process.env.NODE_ENV = 'production';
    const prodFilter = new HttpExceptionFilter();
    const exception = new Error('Something unexpected');
    const { host, json, status } = createMockHost();

    prodFilter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(500);
    const responseBody = json.mock.calls[0][0];
    expect(responseBody.statusCode).toBe(500);
  });

  it('should include timestamp in ISO format', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    const { host, json } = createMockHost();

    filter.catch(exception, host);

    const responseBody = json.mock.calls[0][0];
    expect(responseBody.timestamp).toBeDefined();
    expect(new Date(responseBody.timestamp).toISOString()).toBe(
      responseBody.timestamp,
    );
  });

  it('should return generic message for unknown exceptions in production', () => {
    process.env.NODE_ENV = 'production';
    const prodFilter = new HttpExceptionFilter();
    const exception = new Error('DB connection string leaked!');
    const { host, json } = createMockHost();

    prodFilter.catch(exception, host);

    const responseBody = json.mock.calls[0][0];
    expect(responseBody.message).toBe('Internal server error');
  });

  it('should handle non-Error exceptions gracefully', () => {
    process.env.NODE_ENV = 'production';
    const prodFilter = new HttpExceptionFilter();
    const { host, json, status } = createMockHost();

    prodFilter.catch('string error', host);

    expect(status).toHaveBeenCalledWith(500);
    const responseBody = json.mock.calls[0][0];
    expect(responseBody.statusCode).toBe(500);
  });

  it('should handle HttpException with object response', () => {
    const exception = new HttpException(
      { message: 'Validation failed', errors: ['field required'] },
      HttpStatus.BAD_REQUEST,
    );
    const { host, json, status } = createMockHost();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    const responseBody = json.mock.calls[0][0];
    expect(responseBody.statusCode).toBe(400);
  });
});
