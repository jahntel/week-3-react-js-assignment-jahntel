import express from 'express';
import User from '../models/User.js';
import { auth, adminOnly, optionalAuth } from '../middleware/auth.js';
import { asyncHandler, validateObjectId, createNotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', [auth, adminOnly], asyncHandler(async (req, res, next) => {
  const users = await User.find({ isActive: true })
    .select('-password')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: users.length,
    data: { users }
  });
}));

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', [
  validateObjectId('id'),
  optionalAuth
], asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password -resetPasswordToken -emailVerificationToken')
    .populate('badges.badgeId', 'name icon color')
    .populate('enrolledCourses.courseId', 'title thumbnail');

  if (!user) {
    return next(createNotFoundError('User'));
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
}));

export default router;