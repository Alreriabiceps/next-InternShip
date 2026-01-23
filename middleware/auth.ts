import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check cookies
  const token = request.cookies.get('auth-token')?.value;
  return token || null;
}

export function verifyAuth(request: NextRequest): { userId: string; username: string } | null {
  const token = getAuthToken(request);
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}




