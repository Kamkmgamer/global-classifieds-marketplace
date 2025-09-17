import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { Drizzle } from '../db/drizzle.module';

export type User = typeof users.$inferSelect;

@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE') private db: Drizzle,
  ) {}

  async create(userData: { email: string; password: string; role?: string }): Promise<User> {
    const [newUser] = await this.db.insert(users).values({ ...userData, role: userData.role || 'user' }).returning();
    return newUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }
}
