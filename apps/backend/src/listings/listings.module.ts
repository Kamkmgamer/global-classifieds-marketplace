import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { Listing } from './listing.entity';
import { ListingsCacheService } from './cache/listings-cache.service';
import { SearchService } from './search/search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Listing])], 
  controllers: [ListingsController],
  providers: [ListingsService, ListingsCacheService, SearchService],
})
export class ListingsModule {}
