import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  create(@Body() createListingDto: any) {
    return this.listingsService.create(createListingDto);
  }

  @Get()
  findAll(
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Query('q') q: string,
    @Query('minPrice') minPrice: string,
    @Query('maxPrice') maxPrice: string,
    @Query('location') location: string,
    @Query('sort') sort: string,
  ) {
    return this.listingsService.findAll({ limit, page, q, minPrice, maxPrice, location, sort });
  }
}