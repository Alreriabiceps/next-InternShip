import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Intern from '@/models/Intern';
import { verifyPassword, generateStudentToken } from '@/lib/auth';
import { addCorsHeaders } from '@/lib/cors';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { studentId, password } = await request.json();

    if (!studentId || !password) {
      const response = NextResponse.json(
        { error: 'Student ID and password are required' },
        { status: 400 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    const intern = await Intern.findOne({ studentId });

    if (!intern) {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    // Check if intern has a password set (for existing interns created before password field was added)
    if (!intern.password) {
      const errorResponse = NextResponse.json(
        { error: 'Account not properly configured. Please contact administrator.' },
        { status: 401 }
      );
      return addCorsHeaders(errorResponse, request.headers.get('origin'));
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, intern.password);

    if (!isValidPassword) {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    // Force a fresh query to get the latest profile picture
    // This bypasses any Mongoose document caching
    const freshIntern = await Intern.findById(intern._id.toString()).exec();
    const profilePicValue = freshIntern?.profilePicture || null;

    // Generate JWT token for authenticated requests
    const token = generateStudentToken(intern._id.toString(), intern.studentId);

    // Return intern info with mustChangePassword and profilePicture flags
    const response = NextResponse.json({
      success: true,
      token,
      intern: {
        id: intern._id,
        name: intern.name,
        email: intern.email,
        studentId: intern.studentId,
        company: intern.company,
        companyAddress: intern.companyAddress,
        mustChangePassword: intern.mustChangePassword,
        profilePicture: profilePicValue,
        needsSetup: intern.mustChangePassword || !profilePicValue,
      },
    });
    
    return addCorsHeaders(response, request.headers.get('origin'));
  } catch (error) {
    console.error('Student login error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get('origin'));
  }
}

