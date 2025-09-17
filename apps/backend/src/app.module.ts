import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ListingsModule } from './listings/listings.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import * as redisStore from 'cache-manager-redis-store';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { HealthController } from './health.controller';
import { DrizzleModule } from './db/drizzle.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
        PORT: Joi.number().port().default(5000),
        // Database - Keep but remove TYPEORM_SYNCHRONIZE
        DATABASE_URL: Joi.string().uri().optional(),
        DATABASE_HOST: Joi.string().default('db'),
        DATABASE_PORT: Joi.number().port().default(5432),
        POSTGRES_USER: Joi.string().default('user'),
        POSTGRES_PASSWORD: Joi.string().default('password'),
        POSTGRES_DB: Joi.string().default('classifieds_db'),
        // Redis
        REDIS_URL: Joi.string().uri().optional(),
        REDIS_HOST: Joi.string().default('redis'),
        REDIS_PORT: Joi.number().port().default(6379),
        // Swagger
        SWAGGER_ENABLED: Joi.string().valid('true', 'false').optional(),
        // CORS
        CORS_ORIGINS: Joi.string().allow('').optional(),
        // Auth
        JWT_SECRET: Joi.string()
          .min(16)
          .when('NODE_ENV', { is: 'test', then: Joi.optional(), otherwise: Joi.required() }),
        // Rate Limit
        RATE_LIMIT_MAX: Joi.number().min(1).optional(),
        RATE_LIMIT_WINDOW_MS: Joi.number().min(1000).optional(),
        // Auth lockout/backoff
        LOCKOUT_THRESHOLD: Joi.number().min(1).optional(),
        LOCKOUT_TTL_MS: Joi.number().min(1000).optional(),
        LOCKOUT_FAIL_WINDOW_MS: Joi.number().min(1000).optional(),
        // OpenTelemetry
        OTEL_ENABLED: Joi.string().valid('true', 'false').optional(),
        OTEL_SERVICE_NAME: Joi.string().optional(),
        OTEL_SERVICE_NAMESPACE: Joi.string().optional(),
        OTEL_EXPORTER_OTLP_ENDPOINT: Joi.string().uri().optional(),
        OTEL_EXPORTER_OTLP_HEADERS: Joi.string().optional(),
      }),
    }),
    CacheModule.registerAsync({
      // Configure CacheModule with Redis
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'redis'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: configService.get('REDIS_TTL', 600), /* 10 minutes default */
        isGlobal: true,
      }),
      inject: [ConfigService],
    }),
    DrizzleModule,
    AuthModule,
    UsersModule,
    ListingsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}

