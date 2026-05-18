import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';

type RequestWithId = Request & {
  requestId?: string;
};

type ApiResponse<TData> = {
  data: TData;
  meta: {
    requestId?: string;
    timestamp: string;
  };
};

@Injectable()
export class ResponseInterceptor<TData> implements NestInterceptor<TData, ApiResponse<TData>> {
  intercept(context: ExecutionContext, next: CallHandler<TData>): Observable<ApiResponse<TData>> {
    const request = context.switchToHttp().getRequest<RequestWithId>();

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          requestId: request.requestId,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
