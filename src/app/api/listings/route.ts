import { NextRequest, NextResponse } from 'next/server';
import { listingsService } from '@/lib/services/listings.service';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const listingSchema = z.object({
  title: z.string().min(3).max(120),
  price: z.number().min(0).max(1_000_000),
  description: z.string().max(2000).optional(),
  location: z.string().min(2).max(100).optional(),
  image: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = {
      limit: searchParams.get('limit') || undefined,
      page: searchParams.get('page') || undefined,
      q: searchParams.get('q') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      location: searchParams.get('location') || undefined,
      sort: searchParams.get('sort') || undefined,
    };

    const result = await listingsService.findAll(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Listings GET error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = listingSchema.parse(body);

    // Convert undefined to null for optional fields to match Drizzle schema
    const listingData = {
      title: data.title,
      price: data.price,
      image: data.image ?? null,
      location: data.location ?? null,
      description: data.description ?? null,
    };

    const listing = await listingsService.create(listingData);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Listings POST error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
