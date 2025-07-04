import express from 'express';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler, validateObjectId, createNotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get quiz for course
// @route   GET /api/quizzes/course/:courseId
// @access  Private
router.get('/course/:courseId', [
  validateObjectId('courseId'),
  auth
], asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  const progress = await Progress.findOne({
    userId: req.user._id,
    courseId: req.params.courseId
  });

  if (!course || !progress) {
    return next(createNotFoundError('Course or enrollment'));
  }

  if (!course.quiz) {
    return res.status(404).json({
      success: false,
      message: 'No quiz available for this course'
    });
  }

  res.status(200).json({
    success: true,
    data: { 
      quiz: course.quiz,
      attempts: progress.quizAttempts.length,
      maxAttempts: course.quiz.attemptsAllowed,
      bestScore: progress.bestQuizScore
    }
  });
}));

export default router;