import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { usersService } from '@/lib/services/users.service';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await usersService.findById(userId);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Exclude password from response
  const { password, ...userWithoutPassword } = user;

  return NextResponse.json({ user: userWithoutPassword });
}
