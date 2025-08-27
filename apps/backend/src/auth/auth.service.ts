import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { cacheHitTotal, cacheMissTotal } from '../observability/metrics';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { TokenResponse } from './dto/refresh-token.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private passwordService: PasswordService,
    private refreshTokenService: RefreshTokenService,
    private auditService: AuditService,
  ) {}

  // --- Account lockout/backoff helpers ---
  private failKey(email: string) {
    return `auth:fail:${email.toLowerCase()}`;
  }
  private lockKey(email: string) {
    return `auth:lock:${email.toLowerCase()}`;
  }

  private getThreshold() {
    return Number(process.env.LOCKOUT_THRESHOLD || 5);
  }
  private getLockTtlMs() {
    return Number(process.env.LOCKOUT_TTL_MS || 15 * 60_000); // 15 minutes
  }
  private getFailWindowMs() {
    return Number(process.env.LOCKOUT_FAIL_WINDOW_MS || 10 * 60_000); // 10 minutes
  }

  async isLocked(email: string): Promise<boolean> {
    const key = this.lockKey(email);
    const val = await this.cache.get<any>(key);
    try {
      if (val) cacheHitTotal.inc({ source: 'auth_isLocked' });
      else cacheMissTotal.inc({ source: 'auth_isLocked' });
    } catch {
      // metrics should never break auth flow
    }
    return Boolean(val);
  }

  async onFailedLogin(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const fKey = this.failKey(email);
    const lKey = this.lockKey(email);
    const got = await this.cache.get<number>(fKey);
    try {
      if (typeof got === 'number') cacheHitTotal.inc({ source: 'auth_onFailedLogin' });
      else cacheMissTotal.inc({ source: 'auth_onFailedLogin' });
    } catch {
      // noop
    }
    const current = got || 0;
    const next = current + 1;
    const threshold = this.getThreshold();
    
    // Log failed login attempt
    await this.auditService.logFailedLogin(email, ipAddress, userAgent, 'Invalid credentials');
    
    if (next >= threshold) {
      // Lock account
      await this.cache.set(lKey, true, Math.ceil(this.getLockTtlMs() / 1000));
      // Reset fail counter
      await this.cache.set(fKey, 0, Math.ceil(this.getFailWindowMs() / 1000));
      
      // Log account lockout
      await this.auditService.logAccountLockout(email, ipAddress, userAgent);
    } else {
      // Increment within rolling window
      const ttlSeconds = Math.ceil(this.getFailWindowMs() / 1000);
      await this.cache.set(fKey, next, ttlSeconds);
    }
  }

  async onSuccessfulLogin(email: string): Promise<void> {
    const fKey = this.failKey(email);
    try {
      // Clear failure counter on success
      // cache.del may not be implemented by all stores; fallback to set 0 with short TTL
      if (typeof (this.cache as any).del === 'function') {
        await (this.cache as any).del(fKey);
      } else {
        await this.cache.set(fKey, 0, 60);
      }
    } catch {
      // noop
    }
  }

  async register(registerDto: RegisterDto): Promise<any> {
    // Pre-check to provide a clear 409 without relying solely on DB constraint
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await this.passwordService.hashPassword(registerDto.password);
    try {
      const user = await this.usersService.create({
        email: registerDto.email,
        password: hashedPassword,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; // Exclude password from response
      return result;
    } catch (err: any) {
      // Handle race-condition unique constraint violation (e.g., Postgres 23505)
      const message = typeof err?.message === 'string' ? err.message : '';
      if (
        err?.code === '23505' ||
        message.includes('unique') ||
        message.includes('Unique')
      ) {
        throw new ConflictException('Email already in use');
      }
      throw err;
    }
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await this.passwordService.verifyPassword(pass, user.password))) {
      // Check if password needs migration from bcrypt to Argon2id
      if (this.passwordService.needsRehash(user.password)) {
        const newHash = await this.passwordService.migrateHash(pass, user.password);
        if (newHash) {
          await this.usersService.updatePassword(user.id, newHash);
        }
      }
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; // Exclude password from response
      return result;
    }
    return null;
  }

  async login(user: any, deviceInfo?: string, ipAddress?: string): Promise<TokenResponse> {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    
    // Create refresh token
    const refreshToken = await this.refreshTokenService.createRefreshToken(
      user.id,
      deviceInfo,
      ipAddress,
    );

    // Log successful login
    await this.auditService.logUserLogin(user.id, user.email, ipAddress, deviceInfo);

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      expires_in: 3600, // 1 hour
    };
  }

  async refreshAccessToken(refreshToken: string, deviceInfo?: string, ipAddress?: string): Promise<TokenResponse> {
    const tokenRecord = await this.refreshTokenService.findValidToken(refreshToken);
    
    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate the refresh token
    const newRefreshToken = await this.refreshTokenService.rotateRefreshToken(
      refreshToken,
      deviceInfo,
      ipAddress,
    );

    if (!newRefreshToken) {
      throw new UnauthorizedException('Unable to rotate refresh token');
    }

    // Generate new access token
    const payload = { 
      email: tokenRecord.user.email, 
      sub: tokenRecord.user.id, 
      role: tokenRecord.user.role 
    };
    const accessToken = this.jwtService.sign(payload);

    // Log token refresh
    await this.auditService.logTokenRefresh(tokenRecord.user.id, tokenRecord.user.email, ipAddress, deviceInfo);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken.token,
      expires_in: 3600,
    };
  }

  async logout(refreshToken: string, userId?: string, userEmail?: string, ipAddress?: string, deviceInfo?: string): Promise<void> {
    await this.refreshTokenService.revokeToken(refreshToken);
    
    if (userId && userEmail) {
      await this.auditService.logUserLogout(userId, userEmail, ipAddress, deviceInfo);
    }
  }

  async logoutAllDevices(userId: string, userEmail?: string, ipAddress?: string, deviceInfo?: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
    
    if (userEmail) {
      await this.auditService.logSecurityEvent('logout_all_devices', userId, userEmail, ipAddress, deviceInfo);
    }
  }
}
