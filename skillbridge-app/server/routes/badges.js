import express from 'express';
import Badge from '../models/Badge.js';
import { auth, adminOnly, optionalAuth } from '../middleware/auth.js';
import { asyncHandler, validateObjectId, createNotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get all badges
// @route   GET /api/badges
// @access  Public
router.get('/', asyncHandler(async (req, res, next) => {
  const badges = await Badge.find({ isActive: true, isVisible: true })
    .populate('relatedCourse', 'title thumbnail')
    .sort('-earnedCount');

  res.status(200).json({
    success: true,
    count: badges.length,
    data: { badges }
  });
}));

// @desc    Get badge by ID
// @route   GET /api/badges/:id
// @access  Public
router.get('/:id', [
  validateObjectId('id')
], asyncHandler(async (req, res, next) => {
  const badge = await Badge.findById(req.params.id)
    .populate('relatedCourse', 'title thumbnail')
    .populate('prerequisites', 'name icon');

  if (!badge) {
    return next(createNotFoundError('Badge'));
  }

  await badge.incrementViews();

  res.status(200).json({
    success: true,
    data: { badge }
  });
}));

// @desc    Get user's recommended badges
// @route   GET /api/badges/recommended
// @access  Private
router.get('/user/recommended', auth, asyncHandler(async (req, res, next) => {
  const recommendations = await Badge.getRecommendedForUser(req.user, 10);

  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: { badges: recommendations }
  });
}));

export default router;