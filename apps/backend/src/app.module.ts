import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
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
        // Defaults: true in non-production, false in production, can be overridden with TYPEORM_SYNCHRONIZE.
        synchronize:
          (configService.get<string>('NODE_ENV') !== 'production') &&
          (configService.get<string>('TYPEORM_SYNCHRONIZE', 'true').toLowerCase() === 'true'),
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
