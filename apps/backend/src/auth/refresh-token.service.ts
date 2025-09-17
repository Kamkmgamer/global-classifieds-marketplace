import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, lt, and } from 'drizzle-orm';
import { refreshTokens } from '../db/schema';
import type { Drizzle } from '../db/drizzle.module';
import { randomBytes } from 'crypto';

export type RefreshToken = typeof refreshTokens.$inferSelect;

@Injectable()
export class RefreshTokenService {
  constructor(
    @Inject('DRIZZLE') private db: Drizzle,
  ) {}

  async createRefreshToken(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<RefreshToken> {
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [refreshToken] = await this.db.insert(refreshTokens).values({
      token,
      userId,
      expiresAt,
      deviceInfo,
      ipAddress,
    }).returning();

    return refreshToken;
  }

  async findValidToken(token: string): Promise<RefreshToken | null> {
    const now = new Date();
    const [rt] = await this.db.select().from(refreshTokens)
      .where(and(eq(refreshTokens.token, token), eq(refreshTokens.revoked, false), lt(refreshTokens.expiresAt, now)))
      .limit(1);
    return rt || null;
  }

  async rotateRefreshToken(oldToken: string, deviceInfo?: string, ipAddress?: string): Promise<RefreshToken | null> {
    const now = new Date();
    const [existingToken] = await this.db.select().from(refreshTokens)
      .where(and(eq(refreshTokens.token, oldToken), eq(refreshTokens.revoked, false)))
      .limit(1);

    if (!existingToken || existingToken.expiresAt < now) {
      return null;
    }

    const newToken = await this.createRefreshToken(existingToken.userId, deviceInfo, ipAddress);

    await this.db.update(refreshTokens).set({ 
      revoked: true, 
      replacedBy: newToken.token 
    }).where(eq(refreshTokens.token, oldToken));

    return newToken;
  }

  async revokeToken(token: string): Promise<void> {
    await this.db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.token, token));
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.db.update(refreshTokens).set({ revoked: true }).where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.revoked, false)));
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now));
  }

  private generateSecureToken(): string {
    return randomBytes(64).toString('hex');
  }
}
