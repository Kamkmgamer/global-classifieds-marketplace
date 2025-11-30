import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  return forwarded?.split(',')[0].trim() || realIp || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';

    // Check if account is locked
    if (await authService.isLocked(email)) {
      return NextResponse.json(
        { error: 'Account is temporarily locked. Please try again later.' },
        { status: 423 }
      );
    }

    // Validate user
    const user = await authService.validateUser(email, password);
    if (!user) {
      await authService.onFailedLogin(email, ipAddress, userAgent);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Successful login
    await authService.onSuccessfulLogin(email);
    const tokens = await authService.login(user, userAgent, ipAddress);

    return NextResponse.json(tokens);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
