import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * @deprecated With Clerk, session management is handled by Clerk.
 * This endpoint is kept for backward compatibility but does nothing.
 */
export async function POST() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Clerk handles session management, so this is just a no-op
  return NextResponse.json({ message: 'Logged out from all devices' });
}

