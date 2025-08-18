import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager'; // Added CacheModule
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigModule and ConfigService
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ListingsModule } from './listings/listings.module';
import { Listing } from './listings/listing.entity'; // Import Listing entity
import { UsersModule } from './users/users.module'; // Import UsersModule
import { User } from './users/user.entity'; // Import User entity
import { AuthModule } from './auth/auth.module'; // Import AuthModule
import * as redisStore from 'cache-manager-redis-store'; // Import redisStore
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { HealthController } from './health.controller';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
        PORT: Joi.number().port().default(5000),
        // Database
        DATABASE_HOST: Joi.string().default('db'),
        DATABASE_PORT: Joi.number().port().default(5432),
        POSTGRES_USER: Joi.string().default('user'),
        POSTGRES_PASSWORD: Joi.string().default('password'),
        POSTGRES_DB: Joi.string().default('classifieds_db'),
        // Redis
        REDIS_HOST: Joi.string().default('redis'),
        REDIS_PORT: Joi.number().port().default(6379),
        // TypeORM
        TYPEORM_SYNCHRONIZE: Joi.string().valid('true', 'false').default('false'),
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
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'db'), // Default to 'db' for Docker Compose
        port: configService.get<number>('DATABASE_PORT', 5432), // Default to 5432
        username: configService.get<string>('POSTGRES_USER', 'user'),
        password: configService.get<string>('POSTGRES_PASSWORD', 'password'),
        database: configService.get<string>('POSTGRES_DB', 'classifieds_db'),
        entities: [Listing, User], // Add User entity
        // IMPORTANT: Never use synchronize in production. Enable only in development via env.
        // Defaults: false everywhere; in non-production you MUST explicitly set TYPEORM_SYNCHRONIZE=true to enable.
        synchronize:
          (configService.get<string>('NODE_ENV') !== 'production') &&
          (configService.get<string>('TYPEORM_SYNCHRONIZE', 'false').toLowerCase() === 'true'),
        logging: false, // Disable logging SQL queries
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      // Configure CacheModule with Redis
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST', 'redis'), // Default to 'redis' for Docker Compose
        port: configService.get<number>('REDIS_PORT', 6379),
        ttl: 300, // seconds
      }),
      inject: [ConfigService],
      isGlobal: true, // Make CacheModule available globally
    }),
    ListingsModule,
    UsersModule, // Add UsersModule
    AuthModule, // Add AuthModule
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

