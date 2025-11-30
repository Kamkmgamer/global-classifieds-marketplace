import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * @deprecated With Clerk, logout is handled client-side via signOut().
 * This endpoint is kept for backward compatibility but does nothing.
 */
export async function POST() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Clerk handles logout client-side, so this is just a no-op
  return NextResponse.json({ message: 'Logged out successfully' });
}

