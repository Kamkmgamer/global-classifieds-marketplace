import { NestFactory, HttpAdapterHost } from '@nestjs/core'; // Import HttpAdapterHost
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'; // Import AllExceptionsFilter
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'; // Import LoggingInterceptor

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // Allow all origins in development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  }); // Enable CORS

  const { httpAdapter } = app.get(HttpAdapterHost); // Get HttpAdapterHost
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter)); // Apply global filter
  app.useGlobalInterceptors(new LoggingInterceptor()); // Apply global interceptor

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();