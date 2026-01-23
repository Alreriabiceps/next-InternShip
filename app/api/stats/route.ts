import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Intern from '@/models/Intern';
import DailyLog from '@/models/DailyLog';
import { verifyAuth } from '@/middleware/auth';

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

    const totalInterns = await Intern.countDocuments();
    const totalLogs = await DailyLog.countDocuments();

    // Get logs from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = await DailyLog.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get today's logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = await DailyLog.countDocuments({
      date: { $gte: today },
    });

    // Get logs with both AM and PM
    const completeLogs = await DailyLog.countDocuments({
      $and: [
        { amLog: { $exists: true } },
        { pmLog: { $exists: true } },
      ],
    });

    return NextResponse.json({
      stats: {
        totalInterns,
        totalLogs,
        recentLogs,
        todayLogs,
        completeLogs,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








