import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyLog from '@/models/DailyLog';
import { verifyAuth } from '@/middleware/auth';
import cloudinary from '@/lib/cloudinary';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const log = await DailyLog.findById(id).populate('internId', 'name email studentId profilePicture');

    if (!log) {
      return NextResponse.json(
        { error: 'Log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ log });
  } catch (error) {
    console.error('Get log error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Delete functionality is disabled - logs cannot be deleted
  return NextResponse.json(
    { error: 'Log deletion is not allowed' },
    { status: 403 }
  );
}








