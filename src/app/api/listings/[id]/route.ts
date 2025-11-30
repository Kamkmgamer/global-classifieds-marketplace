import { NextRequest, NextResponse } from 'next/server';
import { listingsService } from '@/lib/services/listings.service';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const listingUpdateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  price: z.number().min(0).max(1_000_000).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().min(2).max(100).optional(),
  image: z.string().url().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await listingsService.findById(id);
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Listing GET error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data = listingUpdateSchema.parse(body);

    const updatedListing = await listingsService.update(id, data);

    if (!updatedListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ listing: updatedListing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Listing PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await listingsService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Listing DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
