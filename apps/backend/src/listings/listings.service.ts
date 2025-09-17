import { Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { ilike, and, gte, lte, between, desc, asc, sql, eq } from 'drizzle-orm';
import { listings } from '../db/schema';
import type { Drizzle } from '../db/drizzle.module';
import { ListingsCacheService } from './cache/listings-cache.service';
import { SearchService } from './search/search.service';

export type Listing = typeof listings.$inferSelect;

@Injectable()
export class ListingsService {
  constructor(
    @Inject('DRIZZLE') private db: Drizzle,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private listingsCacheService: ListingsCacheService,
    private searchService: SearchService,
  ) {}

  async create(listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>): Promise<Listing> {
    const [savedListing] = await this.db.insert(listings).values(listingData).returning();
    
    // Invalidate listings cache
    await this.listingsCacheService.invalidateListingsCache();
    
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
    const cacheKey = this.listingsCacheService.generateListingsKey(query);
    
    return this.listingsCacheService.get(
      cacheKey,
      () => this.fetchListingsFromDatabase(query),
      {
        ttl: 5 * 60 * 1000,
        staleTtl: 2 * 60 * 1000,
        warmupThreshold: 30 * 1000,
      },
    );
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

    const listingsResult = await this.db.select().from(listings).where(where).orderBy(...orderBy).limit(limit).offset(offset);
    const totalResult = await this.db.select({ count: sql`count(*)` }).from(listings).where(where);

    return { listings: listingsResult, total: Number(totalResult[0]?.count || 0) };
  }

  async update(id: string, updateData: Partial<Listing>): Promise<Listing | null> {
    const [updated] = await this.db.update(listings).set(updateData).where(eq(listings.id, id)).returning();
    return updated || null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(listings).where(eq(listings.id, id));
    await this.listingsCacheService.invalidateListingsCache();
  }

  async search(query: {
    q?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    limit?: string;
    page?: string;
    sort?: string;
  }): Promise<{ listings: Listing[]; total: number; searchTime: number; suggestions?: string[] }> {
    const searchQuery = {
      q: query.q,
      location: query.location,
      minPrice: query.minPrice ? parseInt(query.minPrice, 10) : undefined,
      maxPrice: query.maxPrice ? parseInt(query.maxPrice, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : 12,
      offset: query.page ? (parseInt(query.page, 10) - 1) * (parseInt(query.limit || '12', 10)) : 0,
      sort: query.sort as any,
    };

    const cacheKey = this.listingsCacheService.generateListingsKey({
      ...query,
      searchType: 'advanced',
    });

    return this.listingsCacheService.get(
      cacheKey,
      () => this.searchService.search(searchQuery),
      {
        ttl: 3 * 60 * 1000, // 3 minutes for search results
        staleTtl: 1 * 60 * 1000, // Serve stale for 2 minutes
        warmupThreshold: 30 * 1000,
      },
    );
  }

  async getSimilarListings(listingId: string, limit = 5): Promise<Listing[]> {
    const cacheKey = `similar:${listingId}:${limit}`;
    
    return this.listingsCacheService.get(
      cacheKey,
      () => this.searchService.searchSimilar(listingId, limit),
      {
        ttl: 15 * 60 * 1000, // 15 minutes for similar listings
        staleTtl: 10 * 60 * 1000,
        warmupThreshold: 2 * 60 * 1000,
      },
    );
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    return this.searchService.getSearchSuggestions(query);
  }

  async findById(id: string): Promise<Listing | null> {
    const cacheKey = `listing:${id}`;
    
    return this.listingsCacheService.get(
      cacheKey,
      async () => {
        const results = await this.db.select().from(listings).where(eq(listings.id, id)).limit(1);
        return results[0] || null;
      },
      {
        ttl: 10 * 60 * 1000, // 10 minutes for individual listings
        staleTtl: 5 * 60 * 1000,
        warmupThreshold: 60 * 1000,
      },
    );
  }
}
