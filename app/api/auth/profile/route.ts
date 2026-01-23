import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { verifyAuth } from '@/middleware/auth';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const auth = verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { username, name, currentPassword, newPassword } = await request.json();

    const trimmedUsername = username?.trim() || '';

    if (!trimmedUsername || !name?.trim()) {
      return NextResponse.json(
        { error: 'Username and name are required' },
        { status: 400 }
      );
    }

    const admin = await Admin.findById(auth.userId);

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Check if username is being changed and if new username already exists
    if (trimmedUsername !== admin.username) {
      const existingAdmin = await Admin.findOne({ username: trimmedUsername });
      if (existingAdmin && existingAdmin._id.toString() !== auth.userId) {
        return NextResponse.json(
          { error: 'Username already in use' },
          { status: 400 }
        );
      }
    }

    // If password change is requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      const isValidPassword = await verifyPassword(currentPassword, admin.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }

      admin.password = await hashPassword(newPassword);
    }

    // Update admin details
    admin.username = trimmedUsername;
    admin.name = name.trim();

    await admin.save();

    return NextResponse.json({
      success: true,
      user: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    
    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Username already in use' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

