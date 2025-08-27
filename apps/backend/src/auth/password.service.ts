import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly argon2Options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  };

  /**
   * Hash password using Argon2id (recommended for new passwords)
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, this.argon2Options);
  }

  /**
   * Verify password against hash, supporting both Argon2 and bcrypt
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      // Check if it's an Argon2 hash (starts with $argon2)
      if (hash.startsWith('$argon2')) {
        return await argon2.verify(hash, password);
      }
      
      // Fallback to bcrypt for existing passwords
      if (hash.startsWith('$2b$') || hash.startsWith('$2a$') || hash.startsWith('$2y$')) {
        return await bcrypt.compare(password, hash);
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if password needs rehashing (bcrypt -> Argon2id migration)
   */
  needsRehash(hash: string): boolean {
    return !hash.startsWith('$argon2');
  }

  /**
   * Migrate bcrypt hash to Argon2id on successful login
   */
  async migrateHash(password: string, oldHash: string): Promise<string | null> {
    if (this.needsRehash(oldHash) && await this.verifyPassword(password, oldHash)) {
      return this.hashPassword(password);
    }
    return null;
  }
}
