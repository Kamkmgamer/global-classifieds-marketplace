import { ListingsService } from './listings.service';
import { Repository } from 'typeorm';
import { Listing } from './listing.entity';

// Simple in-memory mocks
const repoMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
});

const cacheMock = () => ({
  get: jest.fn(),
  set: jest.fn(),
});

function makeService(mocks?: {
  repo?: Partial<Repository<Listing>>;
  cache?: any;
}) {
  const repo = (mocks?.repo || (repoMock() as any)) as Repository<Listing>;
  const cache = (mocks?.cache || (cacheMock() as any)) as any;
  // Bypass Nest injection by calling constructor directly
  return new ListingsService(repo, cache);
}

describe('ListingsService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    jest.clearAllMocks();
  });

  it('create() should create and save a listing', async () => {
    const repo = repoMock();
    const cache = cacheMock();
    const svc = makeService({ repo: repo as any, cache });

    const dto = { title: 'Bike', price: 100 } as Partial<Listing>;
    const entity = { id: '1', ...dto } as Listing;
    (repo.create as jest.Mock).mockReturnValue(entity);
    (repo.save as jest.Mock).mockResolvedValue(entity);

    const res = await svc.create(dto);

    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(entity);
    expect(res).toBe(entity);
  });

  it('findAll() returns cached value when present', async () => {
    const repo = repoMock();
    const cache = cacheMock();
    const svc = makeService({ repo: repo as any, cache });

    const cached = { listings: [{ id: 'l1' } as Listing], total: 1 };
    (cache.get as jest.Mock).mockResolvedValue(cached);

    const res = await svc.findAll({ limit: '12', page: '1' });

    expect(cache.get).toHaveBeenCalled();
    expect(repo.findAndCount).not.toHaveBeenCalled();
    expect(res).toEqual(cached);
  });

  it('findAll() queries DB, caches, and returns results when cache miss', async () => {
    const repo = repoMock();
    const cache = cacheMock();
    const svc = makeService({ repo: repo as any, cache });

    (cache.get as jest.Mock).mockResolvedValue(undefined);

    const listings: Listing[] = [
      { id: '1', title: 'Phone', price: 200 } as any,
      { id: '2', title: 'TV', price: 300 } as any,
    ];
    (repo.findAndCount as jest.Mock).mockResolvedValue([listings, listings.length]);

    const res = await svc.findAll({ q: 'Ph', sort: 'price-asc', minPrice: '100' });

    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
        order: { price: 'ASC' },
        skip: 0,
        take: 12,
      }),
    );
    expect(cache.set).toHaveBeenCalledWith(
      expect.stringMatching(/^listings:/),
      { listings, total: listings.length },
      60_000,
    );
    expect(res).toEqual({ listings, total: listings.length });
  });
});
