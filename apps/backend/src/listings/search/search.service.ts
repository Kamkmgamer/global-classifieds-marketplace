import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../listing.entity';

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
    @InjectRepository(Listing)
    private listingRepository: Repository<Listing>,
  ) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    const { q, location, minPrice, maxPrice, limit = 12, offset = 0, sort = 'relevance' } = query;

    let sqlQuery = this.listingRepository.createQueryBuilder('listing');
    const whereConditions: string[] = [];
    const parameters: Record<string, any> = {};

    // Full-text search with ranking
    if (q && q.trim()) {
      const searchTerm = q.trim();
      
      // Use full-text search with ranking
      sqlQuery = sqlQuery.addSelect(
        `ts_rank(listing.search_vector, plainto_tsquery('english', :searchTerm))`,
        'search_rank'
      );
      
      whereConditions.push(`listing.search_vector @@ plainto_tsquery('english', :searchTerm)`);
      parameters.searchTerm = searchTerm;
    }

    // Location filter with trigram similarity for fuzzy matching
    if (location && location !== 'any-location') {
      if (location.length > 2) {
        // Use trigram similarity for fuzzy location matching
        whereConditions.push(`(listing.location = :exactLocation OR similarity(listing.location, :location) > 0.3)`);
        parameters.exactLocation = location;
        parameters.location = location;
      } else {
        whereConditions.push(`listing.location = :location`);
        parameters.location = location;
      }
    }

    // Price range filters
    if (minPrice !== undefined) {
      whereConditions.push(`listing.price >= :minPrice`);
      parameters.minPrice = minPrice;
    }

    if (maxPrice !== undefined) {
      whereConditions.push(`listing.price <= :maxPrice`);
      parameters.maxPrice = maxPrice;
    }

    // Apply WHERE conditions
    if (whereConditions.length > 0) {
      sqlQuery = sqlQuery.where(whereConditions.join(' AND '), parameters);
    }

    // Apply sorting
    switch (sort) {
      case 'relevance':
        if (q && q.trim()) {
          sqlQuery = sqlQuery.orderBy('search_rank', 'DESC');
        } else {
          sqlQuery = sqlQuery.orderBy('listing.createdAt', 'DESC');
        }
        break;
      case 'price-asc':
        sqlQuery = sqlQuery.orderBy('listing.price', 'ASC');
        break;
      case 'price-desc':
        sqlQuery = sqlQuery.orderBy('listing.price', 'DESC');
        break;
      case 'newest':
        sqlQuery = sqlQuery.orderBy('listing.createdAt', 'DESC');
        break;
      case 'oldest':
        sqlQuery = sqlQuery.orderBy('listing.createdAt', 'ASC');
        break;
    }

    // Add secondary sort for consistency
    if (sort !== 'newest' && sort !== 'oldest') {
      sqlQuery = sqlQuery.addOrderBy('listing.createdAt', 'DESC');
    }

    // Get total count
    const totalQuery = sqlQuery.clone();
    const total = await totalQuery.getCount();

    // Apply pagination
    const listings = await sqlQuery
      .skip(offset)
      .take(limit)
      .getMany();

    const searchTime = Date.now() - startTime;

    // Generate search suggestions if no results found
    let suggestions: string[] | undefined;
    if (listings.length === 0 && q && q.trim()) {
      suggestions = await this.generateSearchSuggestions(q.trim());
    }

    return {
      listings,
      total,
      searchTime,
      suggestions,
    };
  }

  async searchSimilar(listingId: string, limit = 5): Promise<Listing[]> {
    const listing = await this.listingRepository.findOne({ where: { id: listingId } });
    if (!listing) {
      return [];
    }

    // Find similar listings based on title similarity and price range
    const priceRange = listing.price * 0.3; // 30% price variance
    const minPrice = Math.max(0, listing.price - priceRange);
    const maxPrice = listing.price + priceRange;

    return this.listingRepository
      .createQueryBuilder('listing')
      .where('listing.id != :id', { id: listingId })
      .andWhere('listing.price BETWEEN :minPrice AND :maxPrice', { minPrice, maxPrice })
      .andWhere(`similarity(listing.title, :title) > 0.2`, { title: listing.title })
      .orderBy(`similarity(listing.title, :title)`, 'DESC')
      .addOrderBy('ABS(listing.price - :price)', 'ASC')
      .setParameter('title', listing.title)
      .setParameter('price', listing.price)
      .limit(limit)
      .getMany();
  }

  async getSearchSuggestions(query: string, limit = 5): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    // Get suggestions based on existing titles and locations
    const titleSuggestions = await this.listingRepository
      .createQueryBuilder('listing')
      .select('DISTINCT listing.title', 'title')
      .where(`similarity(listing.title, :query) > 0.3`, { query })
      .orderBy(`similarity(listing.title, :query)`, 'DESC')
      .limit(limit)
      .getRawMany();

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
    const popularTerms = await this.listingRepository
      .createQueryBuilder('listing')
      .select('listing.title')
      .orderBy('listing.createdAt', 'DESC')
      .limit(100)
      .getMany();

    // Extract common words (simplified approach)
    const words = popularTerms
      .flatMap(listing => listing.title.toLowerCase().split(/\s+/))
      .filter(word => word.length > 3)
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(words)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  async getSearchStats(): Promise<{
    totalListings: number;
    avgSearchTime: number;
    popularLocations: string[];
  }> {
    const totalListings = await this.listingRepository.count();
    
    const popularLocations = await this.listingRepository
      .createQueryBuilder('listing')
      .select('listing.location', 'location')
      .addSelect('COUNT(*)', 'count')
      .where('listing.location IS NOT NULL')
      .groupBy('listing.location')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalListings,
      avgSearchTime: 0, // Would need to track this over time
      popularLocations: popularLocations.map(item => item.location),
    };
  }
}
