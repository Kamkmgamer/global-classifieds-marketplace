import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, query } = req;
    const now = Date.now();

    this.logger.log(`Incoming Request - Method: ${method}, URL: ${url}, Body: ${JSON.stringify(body)}, Query: ${JSON.stringify(query)}`);

    return next.handle().pipe(
      tap(
        (data) => {
          this.logger.log(
            `Outgoing Response - Method: ${method}, URL: ${url}, Status: ${context.switchToHttp().getResponse().statusCode}, Duration: ${Date.now() - now}ms, Response: ${JSON.stringify(data)}`,
          );
        },
        (err) => {
          this.logger.error(
            `Error Response - Method: ${method}, URL: ${url}, Status: ${err.status || 'N/A'}, Duration: ${Date.now() - now}ms, Error: ${err.message}`,
          );
        },
      ),
    );
  }
}