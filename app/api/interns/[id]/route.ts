import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Intern from '@/models/Intern';
import DailyLog from '@/models/DailyLog';
import { verifyAuth } from '@/middleware/auth';

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

    const intern = await Intern.findById(id);

    if (!intern) {
      return NextResponse.json(
        { error: 'Intern not found' },
        { status: 404 }
      );
    }

    // Get total logs count
    const logsCount = await DailyLog.countDocuments({ internId: intern._id });

    return NextResponse.json({
      intern: {
        ...intern.toObject(),
        logsCount,
      },
    });
  } catch (error) {
    console.error('Get intern error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const { name, email, studentId, phone, company, companyAddress } = body;

    if (!name || !email || !studentId || !company || !companyAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email or studentId is already taken by another intern
    const existingIntern = await Intern.findOne({
      _id: { $ne: id },
      $or: [
        { email },
        { studentId }
      ]
    });

    if (existingIntern) {
      return NextResponse.json(
        { error: 'Email or Student ID already exists' },
        { status: 400 }
      );
    }

    const intern = await Intern.findByIdAndUpdate(
      id,
      {
        name,
        email,
        studentId,
        phone: phone || undefined,
        company,
        companyAddress,
      },
      { new: true, runValidators: true }
    );

    if (!intern) {
      return NextResponse.json(
        { error: 'Intern not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      intern: intern.toObject(),
    });
  } catch (error: any) {
    console.error('Update intern error:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
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

    const intern = await Intern.findByIdAndDelete(id);

    if (!intern) {
      return NextResponse.json(
        { error: 'Intern not found' },
        { status: 404 }
      );
    }

    // Also delete all logs associated with this intern
    await DailyLog.deleteMany({ internId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete intern error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








