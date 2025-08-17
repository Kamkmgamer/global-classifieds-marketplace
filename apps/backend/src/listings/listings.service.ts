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

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingRepository: Repository<Listing>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async create(listing: Partial<Listing>): Promise<Listing> {
    const newListing = this.listingRepository.create(listing);
    return this.listingRepository.save(newListing);
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
    const limit = Number.parseInt(query.limit || '12', 10);
    const page = Number.parseInt(query.page || '1', 10);
    const skip = (page - 1) * limit;

    // Build a normalized cache key from query params
    const normalized = {
      limit,
      page,
      q: query.q || '',
      minPrice: query.minPrice || '',
      maxPrice: query.maxPrice || '',
      location: query.location || '',
      sort: query.sort || '',
    } as const;
    const cacheKey = `listings:${JSON.stringify(normalized)}`;

    // Attempt cache read
    const cached = await this.cache.get<{ listings: Listing[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    let order: { [key: string]: 'ASC' | 'DESC' } = {};

    if (query.q) {
      where.title = Like(`%${query.q}%`);
      // Could also add OR conditions for location, description etc.
      // For simplicity, only title is searched for now.
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
      order = { createdAt: 'DESC' }; // Default sort by newest
    }

    const [listings, total] = await this.listingRepository.findAndCount({
      where,
      order,
      skip,
      take: limit,
    });

    const result = { listings, total };
    // Cache write with TTL ~60s
    await this.cache.set(cacheKey, result, 60_000);
    return result;
  }
}
