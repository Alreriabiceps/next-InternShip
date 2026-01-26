import { NextRequest, NextResponse } from 'next/server';
import { verifyStudentToken } from '@/lib/auth';
import { addCorsHeaders } from '@/lib/cors';

export interface AuthenticatedStudent {
  internId: string;
  studentId: string;
}

/**
 * Extracts and verifies the student JWT token from the request.
 * Returns the decoded student info if valid, null otherwise.
 */
export function getAuthenticatedStudent(request: NextRequest): AuthenticatedStudent | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  return verifyStudentToken(token);
}

/**
 * Creates an unauthorized response with CORS headers.
 */
export function unauthorizedResponse(request: NextRequest, message: string = 'Unauthorized'): NextResponse {
  const response = NextResponse.json(
    { error: message },
    { status: 401 }
  );
  return addCorsHeaders(response, request.headers.get('origin'));
}

/**
 * Creates a forbidden response with CORS headers.
 */
export function forbiddenResponse(request: NextRequest, message: string = 'Forbidden'): NextResponse {
  const response = NextResponse.json(
    { error: message },
    { status: 403 }
  );
  return addCorsHeaders(response, request.headers.get('origin'));
}

/**
 * Validates that the authenticated student matches the requested resource.
 * Used to ensure students can only access their own data.
 */
export function validateStudentAccess(
  authenticated: AuthenticatedStudent,
  requestedInternId: string
): boolean {
  return authenticated.internId === requestedInternId;
}
