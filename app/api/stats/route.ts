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

    // Company breakdown: ALL companies from Interns (then add log counts)
    const companiesFromInterns = await Intern.aggregate([
      { $group: { _id: '$company', internCount: { $sum: 1 } } },
      { $sort: { internCount: -1 } }
    ]);

    // Log counts per company (from DailyLog + Intern lookup)
    const logCountByCompany = await DailyLog.aggregate([
      {
        $lookup: {
          from: 'interns',
          localField: 'internId',
          foreignField: '_id',
          as: 'intern',
          pipeline: [{ $project: { company: 1 } }]
        }
      },
      { $unwind: '$intern' },
      { $group: { _id: '$intern.company', logCount: { $sum: 1 } } }
    ]);

    const logCountMap = new Map(
      logCountByCompany.map((r: { _id: string; logCount: number }) => [String(r._id), r.logCount])
    );

    const companyBreakdown = companiesFromInterns.map((c: { _id: string; internCount: number }) => ({
      company: c._id || 'Unassigned',
      internCount: c.internCount,
      logCount: logCountMap.get(String(c._id)) ?? 0,
    }));

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
    const completionRate = totalLogs > 0 ? ((completeLogs / totalLogs) * 100).toFixed(1) : '0';

    // Late submissions - count logs where amLog or pmLog has submittedLate: true
    const lateSubmissionsToday = await DailyLog.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      $or: [
        { 'amLog.submittedLate': true },
        { 'pmLog.submittedLate': true }
      ]
    });

    const lateSubmissionsWeek = await DailyLog.countDocuments({
      date: { $gte: sevenDaysAgo },
      $or: [
        { 'amLog.submittedLate': true },
        { 'pmLog.submittedLate': true }
      ]
    });

    // Today's attendance breakdown - who logged today vs who hasn't
    const internsLoggedToday = await DailyLog.distinct('internId', {
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const internsLoggedTodayCount = internsLoggedToday.length;
    const internsNotLoggedToday = totalInterns - internsLoggedTodayCount;

    // Get list of interns who haven't logged today (for display)
    const allInterns = await Intern.find({}, { _id: 1, name: 1, company: 1 }).lean();
    const loggedInternIds = new Set(internsLoggedToday.map((id: mongoose.Types.ObjectId) => id.toString()));
    const missingToday = allInterns
      .filter(intern => !loggedInternIds.has(intern._id.toString()))
      .map(intern => ({ id: intern._id.toString(), name: intern.name, company: intern.company }))
      .slice(0, 10); // Limit to 10

    // On-time vs late ratio (last 30 days)
    const onTimeLogs = await DailyLog.countDocuments({
      date: { $gte: thirtyDaysAgo },
      $and: [
        { 'amLog.submittedLate': { $ne: true } },
        { 'pmLog.submittedLate': { $ne: true } }
      ],
      $or: [
        { amLog: { $exists: true } },
        { pmLog: { $exists: true } }
      ]
    });

    const lateLogs = await DailyLog.countDocuments({
      date: { $gte: thirtyDaysAgo },
      $or: [
        { 'amLog.submittedLate': true },
        { 'pmLog.submittedLate': true }
      ]
    });

    // Average hours worked (from complete logs in last 30 days)
    const completeLogsWithHours = await DailyLog.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo },
          amLog: { $exists: true },
          pmLog: { $exists: true }
        }
      },
      {
        $project: {
          hours: {
            $divide: [
              { $subtract: ['$pmLog.timestamp', '$amLog.timestamp'] },
              3600000 // Convert ms to hours
            ]
          }
        }
      },
      {
        $match: {
          hours: { $gt: 0, $lt: 24 } // Filter out invalid hours
        }
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: '$hours' },
          totalHours: { $sum: '$hours' }
        }
      }
    ]);

    const avgHoursPerDay = completeLogsWithHours.length > 0 
      ? parseFloat(completeLogsWithHours[0].avgHours.toFixed(1)) 
      : 0;
    const totalHoursLogged = completeLogsWithHours.length > 0 
      ? parseFloat(completeLogsWithHours[0].totalHours.toFixed(1)) 
      : 0;

    // Completion rate trend (last 7 days)
    const completionTrend = await DailyLog.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: 1 },
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
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          rate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$complete', '$total'] }, 100] },
              0
            ]
          }
        }
      }
    ]);

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
        // Core metrics
        totalInterns,
        totalLogs,
        todayLogs,
        completeLogs,
        completionRate: parseFloat(completionRate),
        
        // Today's attendance
        internsLoggedToday: internsLoggedTodayCount,
        internsNotLoggedToday,
        missingToday,
        
        // Late submissions
        lateSubmissionsToday,
        lateSubmissionsWeek,
        onTimeLogs,
        lateLogs,
        
        // Hours
        avgHoursPerDay,
        totalHoursLogged,
        
        // Trends
        dailyTrends: dailyTrends.map(d => ({
          date: d._id,
          count: d.count,
          complete: d.complete
        })),
        completionTrend: completionTrend.map(c => ({
          date: c.date,
          rate: parseFloat(c.rate.toFixed(1))
        })),
        
        // Breakdowns
        companyBreakdown: companyBreakdown.map(c => ({
          company: c.company || 'Unknown',
          logCount: c.logCount,
          internCount: c.internCount
        })),
        
        // Activity
        internActivity: internActivity.map(i => ({
          internId: i.internId.toString(),
          internName: i.internName,
          logCount: i.logCount,
          lastActivity: i.lastActivity
        })),
        
        // Heatmap
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








