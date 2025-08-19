import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cache: Cache,
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
    return Boolean(val);
  }

  async onFailedLogin(email: string): Promise<void> {
    const fKey = this.failKey(email);
    const lKey = this.lockKey(email);
    const current = (await this.cache.get<number>(fKey)) || 0;
    const next = current + 1;
    const threshold = this.getThreshold();
    if (next >= threshold) {
      // Lock account
      await this.cache.set(lKey, true, Math.ceil(this.getLockTtlMs() / 1000));
      // Reset fail counter
      await this.cache.set(fKey, 0, Math.ceil(this.getFailWindowMs() / 1000));
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

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
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
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; // Exclude password from response
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
