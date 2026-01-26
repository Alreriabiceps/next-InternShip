import { NextResponse } from 'next/server';

export function addCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  // Allowed origins for web clients
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8081',
    'http://localhost:19006', // Expo web default
    'http://localhost:19000', // Expo default
  ];

  // Add production web origins if configured
  const productionWebOrigin = process.env.PRODUCTION_WEB_ORIGIN;
  if (productionWebOrigin) {
    allowedOrigins.push(productionWebOrigin);
  }

  const requestOrigin = origin;
  
  // Native mobile apps don't send Origin headers, so we need to handle that case.
  // In production, requests without an Origin header are allowed (mobile apps).
  // Requests WITH an Origin header must be from an allowed origin.
  
  if (process.env.NODE_ENV === 'development') {
    // In development, allow all origins for easier testing
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
  } else {
    // In production:
    // - If no origin header (mobile app), allow the request (no CORS header needed)
    // - If origin header exists, it must be in the allowed list
    if (requestOrigin) {
      if (allowedOrigins.includes(requestOrigin)) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      }
      // If origin not in list, don't set the header - browser will block the request
    }
    // No origin header = likely a mobile app or server-to-server request, which is fine
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}

