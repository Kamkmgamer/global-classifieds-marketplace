import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ListingsService } from './listings.service';
import { ListingsCacheService } from './cache/listings-cache.service';
import { SearchService } from './search/search.service';
import { listings } from '../db/schema';
import type { Drizzle } from '../db/drizzle.module';
import { eq } from 'drizzle-orm';

jest.mock('../db/drizzle.module');
jest.mock('./cache/listings-cache.service');
jest.mock('./search/search.service');

describe('ListingsService', () => {
  let service: ListingsService;
  let mockCache: jest.Mocked<any>;
  let mockCacheService: jest.Mocked<ListingsCacheService>;
  let mockSearchService: jest.Mocked<SearchService>;
  let mockDb: jest.Mocked<any>;

  beforeEach(async () => {
    mockCache = { get: jest.fn(), set: jest.fn() } as any;
    mockCacheService = { 
      generateListingsKey: jest.fn(),
      get: jest.fn(),
      invalidateListingsCache: jest.fn()
    } as any;
    mockSearchService = { searchListings: jest.fn() } as any;
    mockDb = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue([{ id: 'test-id', title: 'Test', price: 100, image: null, location: null, description: null, createdAt: new Date(), updatedAt: new Date() }])
      }),
      select: jest.fn().mockResolvedValue([{ id: 'test-id', title: 'Test', price: 100, image: null, location: null, description: null, createdAt: new Date(), updatedAt: new Date() }]),
      update: jest.fn().mockReturnValue({ 
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: 'test-id', title: 'Updated', price: 100, image: null, location: null, description: null, createdAt: new Date(), updatedAt: new Date() }])
        })
      }),
      delete: jest.fn().mockReturnValue({ 
        where: jest.fn().mockResolvedValue(void 0)
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: CACHE_MANAGER, useValue: mockCache },
        { provide: 'DRIZZLE', useValue: mockDb },
        { provide: ListingsCacheService, useValue: mockCacheService },
        { provide: SearchService, useValue: mockSearchService },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create and save a listing', async () => {
      const listingData = { title: 'Test', price: 100, image: null, location: null, description: null };
      const result = await service.create(listingData);

      expect(mockDb.insert).toHaveBeenCalledWith(listings);
      expect(mockCacheService.invalidateListingsCache).toHaveBeenCalled();
      expect(result.id).toBe('test-id');
    });
  });

  describe('findAll()', () => {
    it('returns cached value when present', async () => {
      const query = { limit: '12', page: '1' };
      mockCacheService.generateListingsKey.mockReturnValue('key');
      mockCacheService.get.mockResolvedValue({ listings: [], total: 0 });

      const result = await service.findAll(query as any);

      expect(mockCacheService.generateListingsKey).toHaveBeenCalledWith(query);
      expect(mockCacheService.get).toHaveBeenCalled();
      expect(result).toEqual({ listings: [], total: 0 });
    });

    it('queries DB, caches, and returns results when cache miss', async () => {
      const query = { limit: '12', page: '1' };
      mockCacheService.generateListingsKey.mockReturnValue('key');
      mockCacheService.get.mockImplementation(async (key, fn) => await fn());

      const result = await service.findAll(query as any);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result.listings).toHaveLength(1);
    });
  });

  describe('update()', () => {
    it('should update a listing', async () => {
      const id = 'test-id';
      const updateData = { title: 'Updated' };
      const result = await service.update(id, updateData);

      expect(mockDb.update).toHaveBeenCalledWith(listings);
      expect(mockDb.update().set).toHaveBeenCalledWith(updateData);
      expect(mockDb.update().set().where).toHaveBeenCalledWith(eq(listings.id, id));
      expect(result).toEqual({ id: 'test-id', title: 'Updated', price: 100, image: null, location: null, description: null, createdAt: new Date(), updatedAt: new Date() });
    });
  });
});
