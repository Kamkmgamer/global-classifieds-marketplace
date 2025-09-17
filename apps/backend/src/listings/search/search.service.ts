import { Injectable, Inject } from '@nestjs/common';
import { sql, and, ilike, desc } from 'drizzle-orm';
import { listings } from '../../db/schema';
import type { Drizzle } from '../../db/drizzle.module';
import type { Listing } from '../listings.service';

export interface SearchQuery {
  q?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  sort?: 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'oldest';
}

export interface SearchResult {
  listings: Listing[];
  total: number;
  searchTime: number;
  suggestions?: string[];
}

@Injectable()
export class SearchService {
  constructor(
    @Inject('DRIZZLE') private db: Drizzle,
  ) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    const { q, location, minPrice, maxPrice, limit = 12, offset = 0, sort = 'relevance' } = query;

    // Full-text search using tsvector (assumes search_vector column exists)
    const searchQuery = `%${q}%`;
    const whereConditions = [sql`to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')) @@ to_tsquery('english', ${searchQuery})`];

    if (minPrice) {
      whereConditions.push(sql`price >= ${minPrice}`);
    }
    if (maxPrice) {
      whereConditions.push(sql`price <= ${maxPrice}`);
    }
    if (location) {
      whereConditions.push(ilike(listings.location, `%${location}%`));
    }

    const results = await this.db.select().from(listings)
      .where(and(...whereConditions))
      .orderBy(sql`ts_rank(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')), to_tsquery('english', ${searchQuery})) DESC`)
      .limit(limit)
      .offset(offset);

    const total = await this.db.select({ count: sql`count(*)` }).from(listings).where(and(...whereConditions));

    const searchTime = Date.now() - startTime;

    // Generate search suggestions if no results found
    let suggestions: string[] | undefined;
    if (results.length === 0 && q && q.trim()) {
      suggestions = await this.generateSearchSuggestions(q.trim());
    }

    return {
      listings: results,
      total: Number(total[0]?.count || 0),
      searchTime,
      suggestions,
    };
  }

  async searchSimilar(listingId: string, limit = 5): Promise<Listing[]> {
    const [listing] = await this.db.select().from(listings).where(sql`id = ${listingId}`).limit(1);
    if (!listing) {
      return [];
    }

    // Find similar listings based on title similarity and price range
    const priceRange = listing.price * 0.3; // 30% price variance
    const minPrice = Math.max(0, listing.price - priceRange);
    const maxPrice = listing.price + priceRange;

    const similarListings = await this.db.select().from(listings)
      .where(and(
        sql`id != ${listingId}`,
        sql`price BETWEEN ${minPrice} AND ${maxPrice}`,
        sql`similarity(title, ${listing.title}) > 0.2`,
      ))
      .orderBy(sql`similarity(title, ${listing.title}) DESC`, sql`ABS(price - ${listing.price}) ASC`)
      .limit(limit);

    return similarListings;
  }

  async getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    // Get suggestions based on existing titles and locations
    const titleSuggestions = await this.db.selectDistinct({ title: listings.title }).from(listings)
      .where(sql`similarity(title, ${query}) > 0.3`)
      .orderBy(sql`similarity(title, ${query}) DESC`)
      .limit(limit);

    return titleSuggestions.map(item => item.title).slice(0, limit);
  }

  private async generateSearchSuggestions(query: string): Promise<string[]> {
    // Try to find similar terms using trigram similarity
    const suggestions = await this.getSearchSuggestions(query, 3);
    
    if (suggestions.length === 0) {
      // Fallback to popular search terms or categories
      return this.getPopularSearchTerms();
    }
    
    return suggestions;
  }

  private async getPopularSearchTerms(): Promise<string[]> {
    // Get most common words from titles
    const popularTerms = await this.db.select({ title: listings.title }).from(listings)
      .orderBy(desc(listings.createdAt))
      .limit(100);

    // Extract common words (simplified approach)
    const words = popularTerms
      .flatMap(listing => listing.title.toLowerCase().split(/\s+/))
      .filter(word => word.length > 3)
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(words)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  async getSearchStats(): Promise<{
    totalListings: number;
    avgSearchTime: number;
    popularLocations: string[];
  }> {
    const [total] = await this.db.select({ count: sql`count(*)` }).from(listings);
    
    const popularLocations = await this.db.select({ 
        location: listings.location, 
        count: sql`count(*)`
      }).from(listings)
      .where(sql`location IS NOT NULL`)
      .groupBy(listings.location)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    return {
      totalListings: Number(total.count),
      avgSearchTime: 0, // Would need to track this over time
      popularLocations: popularLocations.map(item => item.location as string),
    };
  }
}
