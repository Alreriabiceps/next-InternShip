import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Intern from '@/models/Intern';
import { addCorsHeaders } from '@/lib/cors';
import { getAuthenticatedStudent, unauthorizedResponse } from '@/middleware/studentAuth';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, request.headers.get('origin'));
}

// Get current authenticated student's profile
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authenticated = getAuthenticatedStudent(request);
    if (!authenticated) {
      return unauthorizedResponse(request, 'Authentication required');
    }

    await connectDB();

    // Find intern by the authenticated internId
    const intern = await Intern.findById(authenticated.internId).exec();

    if (!intern) {
      const response = NextResponse.json(
        { error: 'Intern not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, request.headers.get('origin'));
    }

    // Return fresh user data
    const response = NextResponse.json({
      success: true,
      intern: {
        id: intern._id,
        name: intern.name,
        email: intern.email,
        studentId: intern.studentId,
        company: intern.company,
        companyAddress: intern.companyAddress,
        mustChangePassword: intern.mustChangePassword,
        profilePicture: intern.profilePicture || null,
        phone: intern.phone || null,
        createdAt: intern.createdAt,
        updatedAt: intern.updatedAt,
      },
    });

    return addCorsHeaders(response, request.headers.get('origin'));
  } catch (error) {
    console.error('Get current user error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get('origin'));
  }
}
