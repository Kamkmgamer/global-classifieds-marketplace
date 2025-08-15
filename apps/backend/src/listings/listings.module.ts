import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { Listing } from './listing.entity'; // Import Listing entity

@Module({
  imports: [TypeOrmModule.forFeature([Listing])], // Register Listing entity with TypeORM
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}