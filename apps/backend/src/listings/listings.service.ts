import { Injectable } from '@nestjs/common';

@Injectable()
export class ListingsService {
  private listings = [
    {
      id: '1',
      title: 'Vintage Road Bike',
      price: 500,
      image: '/placeholder-1.svg',
      location: 'Berlin',
    },
    {
      id: '2',
      title: 'Antique Wooden Chair',
      price: 120,
      image: '/placeholder-2.svg',
      location: 'NYC',
    },
    {
      id: '3',
      title: 'Designer Handbag',
      price: 800,
      image: '/placeholder-3.svg',
      location: 'London',
    },
    {
      id: '4',
      title: 'Rare Comic Book Collection',
      price: 1500,
      image: '/placeholder-1.svg',
      location: 'SF',
    },
    {
      id: '5',
      title: 'Handmade Ceramic Vase',
      price: 75,
      image: '/placeholder-2.svg',
      location: 'Tokyo',
    },
    {
      id: '6',
      title: 'Classic Vinyl Player',
      price: 300,
      image: '/placeholder-3.svg',
      location: 'Berlin',
    },
    {
      id: '7',
      title: 'Limited Edition Sneakers',
      price: 250,
      image: '/placeholder-1.svg',
      location: 'NYC',
    },
    {
      id: '8',
      title: 'Vintage Camera',
      price: 400,
      image: '/placeholder-2.svg',
      location: 'London',
    },
    {
      id: '9',
      title: 'Custom Gaming PC',
      price: 2000,
      image: '/placeholder-3.svg',
      location: 'SF',
    },
  ];

  create(listing: any) {
    const newListing = {
      id: (this.listings.length + 1).toString(),
      ...listing,
    };
    this.listings.push(newListing);
    return newListing;
  }

  findAll(query: {
    limit?: string;
    page?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    location?: string;
    sort?: string;
  }) {
    const limit = Number.parseInt(query.limit || '12', 10);
    const page = Number.parseInt(query.page || '1', 10);
    const offset = (page - 1) * limit;

    let filteredListings = this.listings;

    if (query.q) {
      const searchTerm = query.q.toLowerCase();
      filteredListings = filteredListings.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchTerm) ||
          listing.location.toLowerCase().includes(searchTerm),
      );
    }

    if (query.minPrice) {
      const minPrice = Number.parseInt(query.minPrice, 10);
      filteredListings = filteredListings.filter(
        (listing) => listing.price >= minPrice,
      );
    }

    if (query.maxPrice) {
      const maxPrice = Number.parseInt(query.maxPrice, 10);
      filteredListings = filteredListings.filter(
        (listing) => listing.price <= maxPrice,
      );
    }

    if (query.location) {
      filteredListings = filteredListings.filter(
        (listing) =>
          listing.location.toLowerCase() === query.location.toLowerCase(),
      );
    }

    if (query.sort === 'price-asc') {
      filteredListings.sort((a, b) => a.price - b.price);
    } else if (query.sort === 'price-desc') {
      filteredListings.sort((a, b) => b.price - a.price);
    }

    const paginatedListings = filteredListings.slice(offset, offset + limit);

    return {
      listings: paginatedListings,
      total: filteredListings.length,
    };
  }
}