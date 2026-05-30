import { Injectable, Logger } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

type RequestWithContext = Request & {
  requestId?: string;
  user?: {
    id?: string;
    role?: string;
  };
};

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    response.on('finish', () => {
      this.logRequest(request, response, startedAt);
    });

    next();
  }

  private logRequest(request: RequestWithContext, response: Response, startedAt: number): void {
    const durationMs = Date.now() - startedAt;
    const contentLength = response.getHeader('content-length');
    const payload = {
      type: 'http_request',
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode: response.statusCode,
      durationMs,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
      userId: request.user?.id,
      userRole: request.user?.role,
      contentLength: typeof contentLength === 'number' ? contentLength : contentLength?.toString(),
    };

    const message = JSON.stringify(payload);

    if (response.statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (response.statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }
}
