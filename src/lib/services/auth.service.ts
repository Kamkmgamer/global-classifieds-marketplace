import { usersService } from './users.service';
import { passwordService } from './password.service';
import { refreshTokenService } from './refresh-token.service';
import { auditService } from './audit.service';
import { getCache } from '@/lib/cache';
import { signJWT } from '@/lib/auth';

export interface RegisterDto {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export class AuthService {
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
    const cache = await getCache();
    const key = this.lockKey(email);
    const val = await cache.get<any>(key);
    return Boolean(val);
  }

  async onFailedLogin(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const cache = await getCache();
    const fKey = this.failKey(email);
    const lKey = this.lockKey(email);
    const got = await cache.get<number>(fKey);
    const current = got || 0;
    const next = current + 1;
    const threshold = this.getThreshold();
    
    // Log failed login attempt
    await auditService.logFailedLogin(email, ipAddress, userAgent, 'Invalid credentials');
    
    if (next >= threshold) {
      // Lock account
      await cache.set(lKey, true, Math.ceil(this.getLockTtlMs() / 1000));
      // Reset fail counter
      await cache.set(fKey, 0, Math.ceil(this.getFailWindowMs() / 1000));
      
      // Log account lockout
      await auditService.logAccountLockout(email, ipAddress, userAgent);
    } else {
      // Increment within rolling window
      const ttlSeconds = Math.ceil(this.getFailWindowMs() / 1000);
      await cache.set(fKey, next, ttlSeconds);
    }
  }

  async onSuccessfulLogin(email: string): Promise<void> {
    const cache = await getCache();
    const fKey = this.failKey(email);
    try {
      // Clear failure counter on success
      await cache.del(fKey);
    } catch {
      // noop
    }
  }

  async register(registerDto: RegisterDto): Promise<any> {
    // Pre-check to provide a clear 409 without relying solely on DB constraint
    const existing = await usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await passwordService.hashPassword(registerDto.password);
    try {
      const user = await usersService.create({
        email: registerDto.email,
        password: hashedPassword,
      });
      const { password: _password, ...result } = user; // Exclude password from response
      return result;
    } catch (err: any) {
      // Handle race-condition unique constraint violation (e.g., Postgres 23505)
      const message = typeof err?.message === 'string' ? err.message : '';
      if (
        err?.code === '23505' ||
        message.includes('unique') ||
        message.includes('Unique')
      ) {
        throw new Error('Email already in use');
      }
      throw err;
    }
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await usersService.findByEmail(email);
    if (user && (await passwordService.verifyPassword(pass, user.password))) {
      // Check if password needs migration from bcrypt to Argon2id
      if (passwordService.needsRehash(user.password)) {
        const newHash = await passwordService.migrateHash(pass, user.password);
        if (newHash) {
          await usersService.updatePassword(user.id, newHash);
        }
      }
      
      const { password: _password, ...result } = user; // Exclude password from response
      return result;
    }
    return null;
  }

  async login(user: any, deviceInfo?: string, ipAddress?: string): Promise<TokenResponse> {
    const payload = { email: user.email, sub: user.id, role: user.role || 'user' };
    const accessToken = await signJWT(payload);
    
    // Create refresh token
    const refreshToken = await refreshTokenService.createRefreshToken(
      user.id,
      deviceInfo,
      ipAddress,
    );

    // Log successful login
    await auditService.logUserLogin(user.id, user.email, ipAddress, deviceInfo);

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      expires_in: 3600, // 1 hour
    };
  }

  async refreshAccessToken(refreshToken: string, deviceInfo?: string, ipAddress?: string): Promise<TokenResponse> {
    const tokenRecord = await refreshTokenService.findValidToken(refreshToken);
    
    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    // Rotate the refresh token
    const newRefreshToken = await refreshTokenService.rotateRefreshToken(
      refreshToken,
      deviceInfo,
      ipAddress,
    );

    if (!newRefreshToken) {
      throw new Error('Unable to rotate refresh token');
    }

    // Fetch user details
    const user = await usersService.findById(tokenRecord.userId);
    if (!user) {
      throw new Error('User not found for the given token');
    }

    // Generate new access token
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role || 'user'
    };
    const accessToken = await signJWT(payload);

    // Log token refresh
    await auditService.logTokenRefresh(user.id, user.email, ipAddress, deviceInfo);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken.token,
      expires_in: 3600,
    };
  }

  async logout(refreshToken: string, userId?: string, userEmail?: string, ipAddress?: string, deviceInfo?: string): Promise<void> {
    await refreshTokenService.revokeToken(refreshToken);
    
    if (userId && userEmail) {
      await auditService.logUserLogout(userId, userEmail, ipAddress, deviceInfo);
    }
  }

  async logoutAllDevices(userId: string, userEmail?: string, ipAddress?: string, deviceInfo?: string): Promise<void> {
    await refreshTokenService.revokeAllUserTokens(userId);
    
    if (userEmail) {
      await auditService.logSecurityEvent('logout_all_devices', userId, userEmail, ipAddress, deviceInfo);
    }
  }
}

export const authService = new AuthService();

