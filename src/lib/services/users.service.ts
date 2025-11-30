import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { db } from '@/lib/db';

export type User = typeof users.$inferSelect;

export class UsersService {
  async create(userData: { email: string; password: string; role?: string }): Promise<User> {
    const [newUser] = await db.insert(users).values({ ...userData, role: userData.role || 'user' }).returning();
    return newUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }
}

export const usersService = new UsersService();

