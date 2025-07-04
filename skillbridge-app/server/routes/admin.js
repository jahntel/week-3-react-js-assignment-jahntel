import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Gig from '../models/Gig.js';
import Badge from '../models/Badge.js';
import { adminOnly } from '../middleware/auth.js';
import { asyncHandler, validateRequired } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', adminOnly, asyncHandler(async (req, res, next) => {
  const [
    totalUsers,
    totalCourses,
    totalGigs,
    totalBadges,
    activeUsers,
    publishedCourses,
    activeGigs
  ] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Gig.countDocuments(),
    Badge.countDocuments(),
    User.countDocuments({ isActive: true }),
    Course.countDocuments({ status: 'published' }),
    Gig.countDocuments({ status: 'posted' })
  ]);

  const stats = {
    users: { total: totalUsers, active: activeUsers },
    courses: { total: totalCourses, published: publishedCourses },
    gigs: { total: totalGigs, active: activeGigs },
    badges: { total: totalBadges }
  };

  res.status(200).json({
    success: true,
    data: { stats }
  });
}));

// @desc    Create badge
// @route   POST /api/admin/badges
// @access  Private/Admin
router.post('/badges', [
  adminOnly,
  validateRequired(['name', 'description', 'icon', 'category'])
], asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  
  const badge = await Badge.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Badge created successfully',
    data: { badge }
  });
}));

// @desc    Get all users for admin
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', adminOnly, asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .sort('-createdAt')
    .skip(startIndex)
    .limit(limit);

  const total = await User.countDocuments();

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    data: { users }
  });
}));

export default router;