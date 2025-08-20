import { Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Like,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Listing } from './listing.entity';
import { ListingsCacheService } from './cache/listings-cache.service';
import { SearchService } from './search/search.service';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingRepository: Repository<Listing>,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private listingsCacheService: ListingsCacheService,
    private searchService: SearchService,
  ) {}

  async create(listing: Partial<Listing>): Promise<Listing> {
    const newListing = this.listingRepository.create(listing);
    const savedListing = await this.listingRepository.save(newListing);
    
    // Invalidate listings cache when new listing is created
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
        ttl: 5 * 60 * 1000, // 5 minutes total TTL
        staleTtl: 2 * 60 * 1000, // Serve stale for 3 minutes
        warmupThreshold: 30 * 1000, // Background refresh 30s before stale
      },
    );
  }

  private async fetchListingsFromDatabase(query: {
    limit?: string;
    page?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    location?: string;
    sort?: string;
  }): Promise<{ listings: Listing[]; total: number }> {
    const limit = Number.parseInt(query.limit || '12', 10);
    const page = Number.parseInt(query.page || '1', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    let order: { [key: string]: 'ASC' | 'DESC' } = {};

    if (query.q) {
      where.title = Like(`%${query.q}%`);
    }

    if (query.minPrice && query.maxPrice) {
      where.price = Between(
        Number.parseInt(query.minPrice, 10),
        Number.parseInt(query.maxPrice, 10),
      );
    } else if (query.minPrice) {
      where.price = MoreThanOrEqual(Number.parseInt(query.minPrice, 10));
    } else if (query.maxPrice) {
      where.price = LessThanOrEqual(Number.parseInt(query.maxPrice, 10));
    }

    if (query.location && query.location !== 'any-location') {
      where.location = query.location;
    }

    if (query.sort === 'price-asc') {
      order = { price: 'ASC' };
    } else if (query.sort === 'price-desc') {
      order = { price: 'DESC' };
    } else {
      order = { createdAt: 'DESC' };
    }

    const [listings, total] = await this.listingRepository.findAndCount({
      where,
      order,
      skip,
      take: limit,
    });

    return { listings, total };
  }

  async update(id: string, updateData: Partial<Listing>): Promise<Listing | null> {
    await this.listingRepository.update(id, updateData);
    const updatedListing = await this.listingRepository.findOne({ where: { id } });
    
    // Invalidate cache when listing is updated
    await this.listingsCacheService.invalidateListing(id);
    
    return updatedListing;
  }

  async delete(id: string): Promise<void> {
    await this.listingRepository.delete(id);
    
    // Invalidate cache when listing is deleted
    await this.listingsCacheService.invalidateListing(id);
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
      () => this.listingRepository.findOne({ where: { id } }),
      {
        ttl: 10 * 60 * 1000, // 10 minutes for individual listings
        staleTtl: 5 * 60 * 1000,
        warmupThreshold: 60 * 1000,
      },
    );
  }
}
