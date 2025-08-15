import { Injectable, CacheKey, CacheTTL } from '@nestjs/common'; // Added CacheKey, CacheTTL
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Listing } from './listing.entity';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingRepository: Repository<Listing>,
  ) {}

  async create(listing: Partial<Listing>): Promise<Listing> {
    const newListing = this.listingRepository.create(listing);
    return this.listingRepository.save(newListing);
  }

  @CacheKey('listings_cache') // Define a base cache key
  @CacheTTL(60) // Cache for 60 seconds
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

    return { listings, total };
  }
}