import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  private redact(obj: unknown): unknown {
    try {
      if (!obj || typeof obj !== 'object') return obj;
      // All keys are lowercase to match against k.toLowerCase()
      const SENSITIVE_KEYS = [
        'password',
        'confirmpassword',
        'token',
        'accesstoken',
        'refreshtoken',
        'authorization',
        'cookie',
        'cookies',
        'secret',
      ];
      const clone: any = Array.isArray(obj) ? [] : {};
      for (const [k, v] of Object.entries(obj as any)) {
        if (SENSITIVE_KEYS.includes(k.toLowerCase())) {
          clone[k] = '[REDACTED]';
        } else if (v && typeof v === 'object') {
          clone[k] = this.redact(v);
        } else {
          clone[k] = v;
        }
      }
      return clone;
    } catch {
      return undefined;
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, query } = req;
    const requestId: string | undefined = (req).requestId || req.headers['x-request-id'];
    const now = Date.now();
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      this.logger.log(
        `[${requestId || 'no-id'}] Incoming Request - ${method} ${url}`,
      );
    } else {
      this.logger.log(
        `[${requestId || 'no-id'}] Incoming Request - Method: ${method}, URL: ${url}, Body: ${JSON.stringify(this.redact(body))}, Query: ${JSON.stringify(this.redact(query))}`,
      );
    }

    return next.handle().pipe(
      tap(
        (data) => {
          const status = context.switchToHttp().getResponse().statusCode;
          if (isProd) {
            this.logger.log(
              `[${requestId || 'no-id'}] Outgoing Response - ${method} ${url} - ${status} - ${Date.now() - now}ms`,
            );
          } else {
            this.logger.log(
              `[${requestId || 'no-id'}] Outgoing Response - Method: ${method}, URL: ${url}, Status: ${status}, Duration: ${Date.now() - now}ms, Response: ${JSON.stringify(this.redact(data))}`,
            );
          }
        },
        (err) => {
          const status = err?.status || 'N/A';
          this.logger.error(
            `[${requestId || 'no-id'}] Error Response - ${method} ${url} - ${status} - ${Date.now() - now}ms`,
          );
        },
      ),
    );
  }
}
