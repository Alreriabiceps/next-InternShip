import { NextResponse } from 'next/server';

export function addCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8081',
    'http://localhost:19006', // Expo web default
    'http://localhost:19000', // Expo default
  ];

  const requestOrigin = origin;
  
  // In development, allow the requesting origin if it's in the list, otherwise allow all
  if (process.env.NODE_ENV === 'development') {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
  } else {
    // In production, only allow specific origins
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    }
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}

