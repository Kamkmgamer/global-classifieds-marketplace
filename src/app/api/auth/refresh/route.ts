import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { z } from 'zod';

const refreshSchema = z.object({
  refreshToken: z.string(),
  deviceInfo: z.string().optional(),
});

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  return forwarded?.split(',')[0].trim() || realIp || '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken, deviceInfo } = refreshSchema.parse(body);
    const ipAddress = getClientIp(req);
    const userAgent = deviceInfo || req.headers.get('user-agent') || 'Unknown Device';

    const tokens = await authService.refreshAccessToken(refreshToken, userAgent, ipAddress);

    return NextResponse.json(tokens);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Invalid refresh token';
    
    if (message.includes('Invalid') || message.includes('not found') || message.includes('Unable')) {
      return NextResponse.json(
        { error: message },
        { status: 401 }
      );
    }
    
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

