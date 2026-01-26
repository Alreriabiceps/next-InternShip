import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Intern from '@/models/Intern';
import DailyLog from '@/models/DailyLog';
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

    const totalInterns = await Intern.countDocuments();
    const totalLogs = await DailyLog.countDocuments();

    // Get logs from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = await DailyLog.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get today's logs (UTC date range to match how log dates are stored)
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const todayLogs = await DailyLog.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
    });

    // Get logs with both AM and PM
    const completeLogs = await DailyLog.countDocuments({
      $and: [
        { amLog: { $exists: true } },
        { pmLog: { $exists: true } },
      ],
    });

    // Daily log trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrends = await DailyLog.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
          complete: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$amLog', null] },
                    { $ne: ['$pmLog', null] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Weekly activity (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    twelveWeeksAgo.setHours(0, 0, 0, 0);

    const weeklyActivity = await DailyLog.aggregate([
      {
        $match: {
          date: { $gte: twelveWeeksAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            week: { $week: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      { $limit: 12 }
    ]);

    // Monthly activity (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyActivity = await DailyLog.aggregate([
      {
        $match: {
          date: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Company-wise breakdown
    const companyBreakdown = await DailyLog.aggregate([
      {
        $lookup: {
          from: 'interns',
          localField: 'internId',
          foreignField: '_id',
          as: 'intern'
        }
      },
      { $unwind: '$intern' },
      {
        $group: {
          _id: '$intern.company',
          count: { $sum: 1 },
          interns: { $addToSet: '$internId' }
        }
      },
      {
        $project: {
          company: '$_id',
          logCount: '$count',
          internCount: { $size: '$interns' }
        }
      },
      { $sort: { logCount: -1 } }
    ]);

    // Intern activity over time (top 10 most active interns)
    const internActivity = await DailyLog.aggregate([
      {
        $group: {
          _id: '$internId',
          logCount: { $sum: 1 },
          lastActivity: { $max: '$date' }
        }
      },
      { $sort: { logCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'interns',
          localField: '_id',
          foreignField: '_id',
          as: 'intern'
        }
      },
      { $unwind: '$intern' },
      {
        $project: {
          internId: '$_id',
          internName: '$intern.name',
          logCount: 1,
          lastActivity: 1
        }
      }
    ]);

    // Completion rates
    const totalWithAM = await DailyLog.countDocuments({ amLog: { $exists: true } });
    const totalWithPM = await DailyLog.countDocuments({ pmLog: { $exists: true } });
    const completionRate = totalLogs > 0 ? ((completeLogs / totalLogs) * 100).toFixed(1) : '0';

    // Attendance heatmap data (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const heatmapData = await DailyLog.aggregate([
      {
        $match: {
          date: { $gte: ninetyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      stats: {
        totalInterns,
        totalLogs,
        recentLogs,
        todayLogs,
        completeLogs,
        completionRate: parseFloat(completionRate),
        dailyTrends: dailyTrends.map(d => ({
          date: d._id,
          count: d.count,
          complete: d.complete
        })),
        weeklyActivity: weeklyActivity.map(w => ({
          week: `Week ${w._id.week}, ${w._id.year}`,
          count: w.count
        })),
        monthlyActivity: monthlyActivity.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          count: m.count
        })),
        companyBreakdown: companyBreakdown.map(c => ({
          company: c.company || 'Unknown',
          logCount: c.logCount,
          internCount: c.internCount
        })),
        internActivity: internActivity.map(i => ({
          internId: i.internId.toString(),
          internName: i.internName,
          logCount: i.logCount,
          lastActivity: i.lastActivity
        })),
        heatmapData: heatmapData.map(h => ({
          date: h._id,
          count: h.count
        }))
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








