import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ErrorResponse = {
  statusCode: number;
  message: string | string[];
  error: string;
  requestId?: string;
  path: string;
  timestamp: string;
};

type RequestWithId = Request & {
  requestId?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithId>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      this.logUnexpectedError(exception, request);
    }

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const payload = this.createPayload(statusCode, exceptionResponse, request);

    response.status(statusCode).json(payload);
  }

  private createPayload(
    statusCode: number,
    exceptionResponse: string | object | undefined,
    request: RequestWithId,
  ): ErrorResponse {
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseBody = exceptionResponse as Partial<ErrorResponse>;

      return {
        statusCode,
        message: responseBody.message ?? 'Unexpected error',
        error: responseBody.error ?? HttpStatus[statusCode] ?? 'Error',
        requestId: request.requestId,
        path: request.url,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      statusCode,
      message: typeof exceptionResponse === 'string' ? exceptionResponse : 'Unexpected error',
      error: HttpStatus[statusCode] ?? 'Error',
      requestId: request.requestId,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
  }

  private logUnexpectedError(exception: unknown, request: RequestWithId): void {
    const message = [
      request.method,
      request.url,
      request.requestId ? `requestId=${request.requestId}` : undefined,
    ]
      .filter(Boolean)
      .join(' ');

    if (exception instanceof Error) {
      this.logger.error(message, exception.stack);
      return;
    }

    this.logger.error(message, JSON.stringify(exception));
  }
}
