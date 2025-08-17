import { NestFactory, HttpAdapterHost } from '@nestjs/core'; // Import HttpAdapterHost
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'; // Import AllExceptionsFilter
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'; // Import LoggingInterceptor
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
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
  app.useGlobalInterceptors(new LoggingInterceptor()); // Apply global interceptor
  // API Security Headers
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
}
bootstrap();
