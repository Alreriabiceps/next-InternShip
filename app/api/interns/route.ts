import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Intern from '@/models/Intern';
import DailyLog from '@/models/DailyLog';
import { verifyAuth } from '@/middleware/auth';
import { hashPassword } from '@/lib/auth';

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
    const search = searchParams.get('search') || '';
    const company = searchParams.get('company') || '';
    const activityStatus = searchParams.get('activityStatus') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created-newest';
    const quickFilter = searchParams.get('quickFilter') || 'all';

    let query: any = {};

    // Search filter (name, email, studentId)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    // Company filter
    if (company) {
      query.company = company;
    }

    // Quick filters
    if (quickFilter === 'recently-added') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.createdAt = { $gte: sevenDaysAgo };
    }

    // Get all interns first to check activity
    let interns = await Intern.find(query);

    // Activity status filtering (requires checking logs)
    if (activityStatus !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      const internIds = interns.map(i => i._id);
      
      if (activityStatus === 'with-logs') {
        const internsWithLogs = await DailyLog.distinct('internId', { internId: { $in: internIds } });
        interns = interns.filter(i => internsWithLogs.some(id => id.toString() === i._id.toString()));
      } else if (activityStatus === 'without-logs') {
        const internsWithLogs = await DailyLog.distinct('internId', { internId: { $in: internIds } });
        interns = interns.filter(i => !internsWithLogs.some(id => id.toString() === i._id.toString()));
      } else if (activityStatus === 'active') {
        const activeInterns = await DailyLog.distinct('internId', {
          internId: { $in: internIds },
          date: { $gte: thirtyDaysAgo }
        });
        interns = interns.filter(i => activeInterns.some(id => id.toString() === i._id.toString()));
      } else if (activityStatus === 'inactive') {
        const activeInterns = await DailyLog.distinct('internId', {
          internId: { $in: internIds },
          date: { $gte: thirtyDaysAgo }
        });
        interns = interns.filter(i => !activeInterns.some(id => id.toString() === i._id.toString()));
      }
    }

    // Quick filter for recently active
    if (quickFilter === 'recently-active') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const internIds = interns.map(i => i._id);
      const recentlyActiveInterns = await DailyLog.distinct('internId', {
        internId: { $in: internIds },
        date: { $gte: sevenDaysAgo }
      });
      interns = interns.filter(i => recentlyActiveInterns.some(id => id.toString() === i._id.toString()));
    }

    // Sort options
    if (sortBy === 'name-asc') {
      interns.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      interns.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'created-newest') {
      interns.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'created-oldest') {
      interns.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
    } else if (sortBy === 'most-active') {
      // Get log counts for each intern
      const internIds = interns.map(i => i._id);
      const logCounts = await DailyLog.aggregate([
        { $match: { internId: { $in: internIds } } },
        { $group: { _id: '$internId', count: { $sum: 1 } } }
      ]);
      const countMap = new Map(logCounts.map((item: any) => [item._id.toString(), item.count]));
      interns.sort((a, b) => {
        const countA = countMap.get(a._id.toString()) || 0;
        const countB = countMap.get(b._id.toString()) || 0;
        return countB - countA;
      });
    }

    // Convert to plain objects for JSON serialization
    const internsData = interns.map(intern => ({
      _id: intern._id.toString(),
      name: intern.name,
      email: intern.email,
      studentId: intern.studentId,
      phone: intern.phone,
      company: intern.company,
      companyAddress: intern.companyAddress,
      createdAt: intern.createdAt ? intern.createdAt.toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ interns: internsData });
  } catch (error) {
    console.error('Get interns error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { name, email, studentId, phone, company, companyAddress } = await request.json();

    if (!name || !email || !studentId || !company || !companyAddress) {
      return NextResponse.json(
        { error: 'Name, email, student ID, company, and company address are required' },
        { status: 400 }
      );
    }

    // Hash default password
    const defaultPassword = 'qwerty';
    const hashedPassword = await hashPassword(defaultPassword);

    const intern = new Intern({
      name,
      email: email.toLowerCase(),
      studentId,
      password: hashedPassword,
      phone,
      company,
      companyAddress,
      mustChangePassword: true, // Require password change on first login
    });

    await intern.save();

    return NextResponse.json(
      { success: true, intern },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create intern error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email or Student ID already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


