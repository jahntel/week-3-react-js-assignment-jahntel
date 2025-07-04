import express from 'express';
import Progress from '../models/Progress.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get user's learning analytics
// @route   GET /api/progress/analytics
// @access  Private
router.get('/analytics', auth, asyncHandler(async (req, res, next) => {
  const timeframe = req.query.timeframe || '30d';
  const analytics = await Progress.getUserAnalytics(req.user._id, timeframe);

  res.status(200).json({
    success: true,
    data: { analytics }
  });
}));

// @desc    Get user's recent activity
// @route   GET /api/progress/recent
// @access  Private
router.get('/recent', auth, asyncHandler(async (req, res, next) => {
  const recentProgress = await Progress.find({
    userId: req.user._id
  })
  .populate('courseId', 'title thumbnail')
  .sort('-lastAccessedAt')
  .limit(10);

  res.status(200).json({
    success: true,
    count: recentProgress.length,
    data: { progress: recentProgress }
  });
}));

export default router;