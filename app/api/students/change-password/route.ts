import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Intern from '@/models/Intern';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { addCorsHeaders } from '@/lib/cors';
import { getAuthenticatedStudent, forbiddenResponse } from '@/middleware/studentAuth';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { studentId, currentPassword, newPassword, isFirstLogin } = body;

    // Validate studentId
    const trimmedStudentId = studentId?.toString().trim();
    if (!trimmedStudentId || trimmedStudentId.length === 0) {
      const response = NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    // Validate newPassword
    const trimmedNewPassword = newPassword?.toString().trim();
    if (!trimmedNewPassword || trimmedNewPassword.length === 0) {
      const response = NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    if (trimmedNewPassword.length < 6) {
      const response = NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    const intern = await Intern.findOne({ studentId: trimmedStudentId });

    if (!intern) {
      const response = NextResponse.json(
        { error: 'Intern not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    // Handle both boolean and string values for isFirstLogin
    const isFirstLoginBool = isFirstLogin === true || isFirstLogin === 'true' || isFirstLogin === 1 || isFirstLogin === '1';
    const allowWithoutCurrentPassword = intern.mustChangePassword || isFirstLoginBool;
    
    // If not first login, verify authentication token if provided
    // This adds an extra layer of security for regular password changes
    const authenticated = getAuthenticatedStudent(request);
    if (!allowWithoutCurrentPassword && authenticated) {
      // User is logged in - verify they are changing their own password
      if (authenticated.studentId !== trimmedStudentId) {
        return forbiddenResponse(request, 'You can only change your own password');
      }
    }
    
    // If mustChangePassword is true OR isFirstLogin is true, allow change without current password
    // Otherwise, verify current password
    if (!allowWithoutCurrentPassword) {
      if (!currentPassword) {
        const response = NextResponse.json(
          { error: 'Current password is required' },
          { status: 400 }
        );
        return addCorsHeaders(response, request.headers.get('origin'));
      }

      const isValidPassword = await verifyPassword(currentPassword, intern.password);
      if (!isValidPassword) {
        const response = NextResponse.json(
          { error: 'Invalid current password' },
          { status: 401 }
        );
        return addCorsHeaders(response, request.headers.get('origin'));
      }
    }

    // Hash new password and update
    intern.password = await hashPassword(trimmedNewPassword);
    intern.mustChangePassword = false; // Password changed, no longer required
    await intern.save();

    const response = NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
    
    return addCorsHeaders(response, request.headers.get('origin'));
  } catch (error) {
    console.error('Change password error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get('origin'));
  }
}

