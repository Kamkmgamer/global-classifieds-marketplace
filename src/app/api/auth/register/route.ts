import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  return forwarded?.split(',')[0].trim() || realIp || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = registerSchema.parse(body);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';

    const user = await authService.register({ email, password });
    
    // Auto-login after registration
    const tokens = await authService.login(user, userAgent, ipAddress);

    return NextResponse.json(tokens, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    
    if (message === 'Email already in use') {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }
    
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
