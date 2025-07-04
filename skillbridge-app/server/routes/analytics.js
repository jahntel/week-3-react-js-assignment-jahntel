import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Gig from '../models/Gig.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get platform analytics
// @route   GET /api/analytics/platform
// @access  Private/Admin
router.get('/platform', adminOnly, asyncHandler(async (req, res, next) => {
  const timeframe = req.query.timeframe || '30d';
  
  // Get date range
  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days[timeframe] || 30));

  const analytics = await Promise.all([
    // User analytics
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]),
    
    // Course enrollment analytics
    Progress.aggregate([
      { $match: { enrolledAt: { $gte: startDate } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt" } },
        enrollments: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]),
    
    // Popular courses
    Course.aggregate([
      { $match: { status: 'published' } },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 10 },
      { $project: { title: 1, enrollmentCount: 1, category: 1 } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      userGrowth: analytics[0],
      enrollmentTrends: analytics[1],
      popularCourses: analytics[2]
    }
  });
}));

// @desc    Get user dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
router.get('/dashboard', auth, asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  
  const [userProgress, recentActivity, achievements] = await Promise.all([
    Progress.getUserAnalytics(userId, '30d'),
    Progress.find({ userId })
      .populate('courseId', 'title thumbnail')
      .sort('-lastAccessedAt')
      .limit(5),
    User.findById(userId).select('badges achievements streak xp level')
  ]);

  res.status(200).json({
    success: true,
    data: {
      progress: userProgress,
      recentActivity,
      achievements
    }
  });
}));

export default router;