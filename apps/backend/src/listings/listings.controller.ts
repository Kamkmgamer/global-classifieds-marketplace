import { Controller, Get, Post, Body, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common'; // Added UseGuards
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto'; // Import CreateListingDto
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Import JwtAuthGuard
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // Apply JwtAuthGuard and RolesGuard
  @Roles('admin') // Only admin can create listings (for demonstration)
  @UsePipes(new ValidationPipe({ transform: true })) // Apply ValidationPipe
  create(@Body() createListingDto: CreateListingDto) { // Use CreateListingDto
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