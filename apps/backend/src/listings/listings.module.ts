import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsCacheService } from './cache/listings-cache.service';
import { SearchService } from './search/search.service';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ListingsController],
  providers: [ListingsService, ListingsCacheService, SearchService],
})
export class ListingsModule {}
