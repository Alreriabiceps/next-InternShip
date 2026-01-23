import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Intern from '@/models/Intern';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { addCorsHeaders } from '@/lib/cors';

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

    // Debug logging
    console.log('Change password request body:', { 
      studentId, 
      studentIdType: typeof studentId,
      studentIdLength: studentId?.length,
      hasCurrentPassword: !!currentPassword, 
      hasNewPassword: !!newPassword,
      newPasswordType: typeof newPassword,
      newPasswordLength: newPassword?.length,
      newPasswordValue: newPassword ? '***' : null,
    });

    // Validate studentId
    const trimmedStudentId = studentId?.toString().trim();
    if (!trimmedStudentId || trimmedStudentId.length === 0) {
      console.log('Validation failed: Student ID is missing or empty');
      const response = NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    // Validate newPassword
    const trimmedNewPassword = newPassword?.toString().trim();
    if (!trimmedNewPassword || trimmedNewPassword.length === 0) {
      console.log('Validation failed: New password is missing or empty');
      const response = NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    if (trimmedNewPassword.length < 6) {
      console.log('Validation failed: New password too short');
      const response = NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    const intern = await Intern.findOne({ studentId: trimmedStudentId });

    if (!intern) {
      console.log('Intern not found for studentId:', studentId);
      const response = NextResponse.json(
        { error: 'Intern not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    console.log('Intern found:', {
      studentId: intern.studentId,
      mustChangePassword: intern.mustChangePassword,
      hasPassword: !!intern.password,
      isFirstLogin: isFirstLogin,
    });

    // If mustChangePassword is true OR isFirstLogin is true, allow change without current password
    // Otherwise, verify current password
    // Handle both boolean and string values for isFirstLogin
    const isFirstLoginBool = isFirstLogin === true || isFirstLogin === 'true' || isFirstLogin === 1 || isFirstLogin === '1';
    const allowWithoutCurrentPassword = intern.mustChangePassword || isFirstLoginBool;
    
    console.log('Password change authorization:', {
      mustChangePassword: intern.mustChangePassword,
      isFirstLogin: isFirstLogin,
      isFirstLoginBool: isFirstLoginBool,
      allowWithoutCurrentPassword: allowWithoutCurrentPassword,
    });
    
    if (!allowWithoutCurrentPassword) {
      console.log('mustChangePassword is false and isFirstLogin is false, checking currentPassword');
      if (!currentPassword) {
        console.log('Current password is required but not provided');
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
    
    console.log('Password changed successfully for studentId:', trimmedStudentId);

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

