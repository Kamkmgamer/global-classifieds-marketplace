import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { httpErrorsTotal, httpRequestDuration, httpRequestsTotal } from '../../observability/metrics';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const method: string = (req?.method || 'GET').toUpperCase();
    // Prefer route path template if available, fallback to originalUrl
    const route: string = (req?.route?.path || req?.originalUrl || req?.url || 'unknown');

    const endTimer = httpRequestDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const status = String(res?.statusCode || 200);
          endTimer({ status });
          httpRequestsTotal.inc({ method, route, status });
        },
        error: (err) => {
          const status = String(err?.status || res?.statusCode || 500);
          endTimer({ status });
          httpErrorsTotal.inc({ method, route, status });
        },
      }),
    );
  }
}
