import { ilike, and, gte, lte, between, desc, asc, sql, eq } from 'drizzle-orm';
import { listings } from '@/db/schema';
import { db } from '@/lib/db';

export type Listing = typeof listings.$inferSelect;

export class ListingsService {
  async create(listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>): Promise<Listing> {
    const [savedListing] = await db.insert(listings).values(listingData).returning();
    return savedListing;
  }

  async findAll(query: {
    limit?: string;
    page?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    location?: string;
    sort?: string;
  }): Promise<{ listings: Listing[]; total: number }> {
    return this.fetchListingsFromDatabase(query);
  }

  private async fetchListingsFromDatabase(query: any): Promise<{ listings: Listing[]; total: number }> {
    const limit = Number.parseInt(query.limit || '12', 10);
    const page = Number.parseInt(query.page || '1', 10);
    const offset = (page - 1) * limit;

    let whereConditions: any[] = [];
    let orderBy: any[] = [desc(listings.createdAt)];

    if (query.q) {
      whereConditions.push(ilike(listings.title, `%${query.q}%`));
    }

    if (query.minPrice && query.maxPrice) {
      whereConditions.push(between(listings.price, Number.parseInt(query.minPrice, 10), Number.parseInt(query.maxPrice, 10)));
    } else if (query.minPrice) {
      whereConditions.push(gte(listings.price, Number.parseInt(query.minPrice, 10)));
    } else if (query.maxPrice) {
      whereConditions.push(lte(listings.price, Number.parseInt(query.maxPrice, 10)));
    }

    if (query.location && query.location !== 'any-location') {
      whereConditions.push(ilike(listings.location, `%${query.location}%`));
    }

    if (query.sort === 'price-asc') {
      orderBy = [asc(listings.price)];
    } else if (query.sort === 'price-desc') {
      orderBy = [desc(listings.price)];
    }

    const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const listingsResult = await db.select().from(listings).where(where).orderBy(...orderBy).limit(limit).offset(offset);
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(listings).where(where);

    return { listings: listingsResult, total: Number(totalResult[0]?.count || 0) };
  }

  async update(id: string, updateData: Partial<Listing>): Promise<Listing | null> {
    const [updated] = await db.update(listings).set(updateData).where(eq(listings.id, id)).returning();
    return updated || null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(listings).where(eq(listings.id, id));
  }

  async findById(id: string): Promise<Listing | null> {
    const results = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    return results[0] || null;
  }
}

export const listingsService = new ListingsService();

