import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { AuditModule } from '../audit/audit.module';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [
    DrizzleModule,
    UsersModule,
    PassportModule,
    AuditModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret && nodeEnv !== 'test') {
          throw new Error('JWT_SECRET must be set and be at least 16 characters in non-test environments');
        }
        return {
          secret: secret || 'test-secret-fallback',
          signOptions: { expiresIn: '60m' },
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [AuthService, PasswordService, RefreshTokenService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
