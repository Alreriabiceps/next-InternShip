import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyLog from '@/models/DailyLog';
import Intern from '@/models/Intern';
import { verifyAuth } from '@/middleware/auth';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const internId = searchParams.get('internId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status') || 'all';
    const companyId = searchParams.get('companyId');
    const sortBy = searchParams.get('sortBy') || 'newest';

    let query: any = {};

    // Handle company filter first (if specified)
    if (companyId) {
      // Find all interns with this company name
      const internsWithCompany = await Intern.find({ company: companyId }).select('_id');
      const companyInternIds = internsWithCompany.map(i => i._id);
      
      if (companyInternIds.length === 0) {
        // No interns with this company, return empty
        return NextResponse.json({ logs: [] });
      }

      // If internId is also specified, intersect both
      if (internId) {
        const internIdObj = new mongoose.Types.ObjectId(internId);
        if (companyInternIds.some(id => id.toString() === internIdObj.toString())) {
          query.internId = internId;
        } else {
          // Intern doesn't belong to this company, return empty
          return NextResponse.json({ logs: [] });
        }
      } else {
        query.internId = { $in: companyInternIds };
      }
    } else if (internId) {
      // Only internId filter
      query.internId = internId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        // Parse date string (YYYY-MM-DD) and set to start of day in UTC
        // new Date('YYYY-MM-DD') interprets as UTC midnight, which is what we want
        const [year, month, day] = startDate.split('-').map(Number);
        const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        query.date.$gte = start;
      }
      if (endDate) {
        // Parse date string and set to end of day in UTC (23:59:59.999)
        const [year, month, day] = endDate.split('-').map(Number);
        const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        query.date.$lte = end;
      }
    }

    // Status filtering
    if (status !== 'all') {
      if (status === 'complete') {
        query.$and = [
          { amLog: { $exists: true, $ne: null } },
          { pmLog: { $exists: true, $ne: null } }
        ];
      } else if (status === 'incomplete') {
        query.$or = [
          { amLog: { $exists: false } },
          { amLog: null },
          { pmLog: { $exists: false } },
          { pmLog: null }
        ];
      } else if (status === 'am-only') {
        query.$and = [
          { amLog: { $exists: true, $ne: null } },
          { $or: [
            { pmLog: { $exists: false } },
            { pmLog: null }
          ]}
        ];
      } else if (status === 'pm-only') {
        query.$and = [
          { pmLog: { $exists: true, $ne: null } },
          { $or: [
            { amLog: { $exists: false } },
            { amLog: null }
          ]}
        ];
      }
    }

    // Determine sort order
    let sortOptions: any = {};
    if (sortBy === 'newest') {
      sortOptions = { date: -1, createdAt: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { date: 1, createdAt: 1 };
    } else if (sortBy === 'intern-name') {
      sortOptions = { 'internId.name': 1, date: -1 };
    }

    const logs = await DailyLog.find(query)
      .populate('internId', 'name email studentId company profilePicture')
      .sort(sortOptions)
      .limit(500);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








