import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (status >= 500) {
      Sentry.captureException(exception);
    }

    this.logger.error(
      `${request.method} ${request.url} ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    const responseBody: Record<string, any> = {
      statusCode: status,
      message:
        typeof message === 'object' && message !== null
          ? (message as any).message || message
          : message,
      timestamp: new Date().toISOString(),
    };

    if (
      process.env.NODE_ENV === 'development' &&
      exception instanceof Error
    ) {
      responseBody.stack = exception.stack;
    }

    response.status(status).json(responseBody);
  }
}
