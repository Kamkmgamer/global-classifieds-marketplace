import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async createRefreshToken(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<RefreshToken> {
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      deviceInfo,
      ipAddress,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  async findValidToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where: {
        token,
        revoked: false,
        expiresAt: LessThan(new Date()),
      },
      relations: ['user'],
    });
  }

  async rotateRefreshToken(oldToken: string, deviceInfo?: string, ipAddress?: string): Promise<RefreshToken | null> {
    const existingToken = await this.refreshTokenRepository.findOne({
      where: { token: oldToken, revoked: false },
      relations: ['user'],
    });

    if (!existingToken || existingToken.expiresAt < new Date()) {
      return null;
    }

    // Create new token
    const newToken = await this.createRefreshToken(
      existingToken.userId,
      deviceInfo,
      ipAddress,
    );

    // Revoke old token and link to new one
    existingToken.revoked = true;
    existingToken.replacedBy = newToken.token;
    await this.refreshTokenRepository.save(existingToken);

    return newToken;
  }

  async revokeToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token },
      { revoked: true },
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private generateSecureToken(): string {
    return randomBytes(64).toString('hex');
  }
}
