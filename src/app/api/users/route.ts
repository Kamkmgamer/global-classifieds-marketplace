import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Simple list for now, maybe add pagination later
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users);

  return NextResponse.json({ users: allUsers });
}
