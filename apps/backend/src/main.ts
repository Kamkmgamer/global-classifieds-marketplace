import { NestFactory, HttpAdapterHost } from '@nestjs/core'; // Import HttpAdapterHost
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'; // Import AllExceptionsFilter
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'; // Import LoggingInterceptor
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { applyFileBasedSecrets } from './common/config/secrets.util';
import { metricsHandler } from './observability/metrics';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { initTracing, shutdownTracing } from './observability/tracing';

async function bootstrap() {
  // Load secrets from *_FILE env vars (Docker/K8s secrets) before ConfigModule reads env
  applyFileBasedSecrets();
  // Initialize OpenTelemetry tracing early (no-op if OTEL_ENABLED!=true)
  initTracing();
  const app = await NestFactory.create(AppModule);
  // CORS: allow configured origins; default permissive in dev
  const rawOrigins = process.env.CORS_ORIGINS || '';
  const origins = rawOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const { httpAdapter } = app.get(HttpAdapterHost); // Get HttpAdapterHost
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter)); // Apply global filter
  // Metrics interceptor should generally run before logging to capture timings consistently
  app.useGlobalInterceptors(new MetricsInterceptor(), new LoggingInterceptor());
  // API Security Headers
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // Keep default contentSecurityPolicy disabled here; frontend handles CSP
      contentSecurityPolicy: false,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Expose Prometheus metrics endpoint
  const expressInstance = (app.getHttpAdapter() as any).getInstance?.();
  if (expressInstance && typeof expressInstance.get === 'function') {
    expressInstance.get('/metrics', metricsHandler);
  }

  // OpenAPI (Swagger) - enable in non-production by default
  const enableSwagger = (process.env.SWAGGER_ENABLED || '').toLowerCase() === 'true' || process.env.NODE_ENV !== 'production';
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Global Classifieds API')
      .setDescription('API documentation for the Global Classifieds Marketplace')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/docs', app, document, { swaggerOptions: { persistAuthorization: true } });
  }

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);

  // Graceful shutdown: stop tracing
  const shutdown = async () => {
    await shutdownTracing();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
bootstrap();

