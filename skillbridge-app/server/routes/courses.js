import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Badge from '../models/Badge.js';
import { auth, adminOnly, optionalAuth, businessOrAdmin } from '../middleware/auth.js';
import { 
  asyncHandler, 
  validateRequired, 
  validateObjectId,
  createNotFoundError,
  createPermissionError 
} from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get all courses with filtering and pagination
// @route   GET /api/courses
// @access  Public
router.get('/', optionalAuth, asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  // Build query
  let query = { status: 'published', isPublic: true };

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by level
  if (req.query.level) {
    query.level = req.query.level;
  }

  // Filter by skill tag
  if (req.query.skill) {
    query.skillTag = req.query.skill.toLowerCase();
  }

  // Filter by duration
  if (req.query.maxDuration) {
    query.duration = { $lte: parseInt(req.query.maxDuration) };
  }

  // Filter by price
  if (req.query.free === 'true') {
    query.price = 0;
  } else if (req.query.maxPrice) {
    query.price = { $lte: parseInt(req.query.maxPrice) };
  }

  // Text search
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Sort options
  let sortBy = {};
  switch (req.query.sort) {
    case 'popular':
      sortBy = { enrollmentCount: -1, 'rating.average': -1 };
      break;
    case 'rating':
      sortBy = { 'rating.average': -1, 'rating.count': -1 };
      break;
    case 'newest':
      sortBy = { publishedAt: -1 };
      break;
    case 'duration':
      sortBy = { duration: 1 };
      break;
    default:
      if (req.query.search) {
        sortBy = { score: { $meta: 'textScore' } };
      } else {
        sortBy = { featured: -1, enrollmentCount: -1 };
      }
  }

  // Execute query
  const courses = await Course.find(query)
    .sort(sortBy)
    .skip(startIndex)
    .limit(limit)
    .populate('instructor', 'name avatar rating')
    .populate('badgeGranted', 'name icon color')
    .lean();

  // Get total count
  const total = await Course.countDocuments(query);

  // Add enrollment status for authenticated users
  const coursesWithStatus = await Promise.all(
    courses.map(async (course) => {
      let enrollmentStatus = null;
      let progress = null;

      if (req.user) {
        const userProgress = await Progress.findOne({
          userId: req.user._id,
          courseId: course._id
        });

        if (userProgress) {
          enrollmentStatus = 'enrolled';
          progress = {
            percentage: userProgress.progressPercentage,
            status: userProgress.status,
            lastAccessedAt: userProgress.lastAccessedAt
          };
        }
      }

      return {
        ...course,
        enrollmentStatus,
        progress
      };
    })
  );

  res.status(200).json({
    success: true,
    count: courses.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    data: { courses: coursesWithStatus }
  });
}));

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', [
  validateObjectId('id'),
  optionalAuth
], asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id)
    .populate('instructor', 'name avatar rating businessName verified')
    .populate('badgeGranted', 'name icon color description')
    .populate('reviews.userId', 'name avatar');

  if (!course) {
    return next(createNotFoundError('Course'));
  }

  // Check if user can access this course
  if (course.status !== 'published' || !course.isPublic) {
    if (!req.user || (req.user._id.toString() !== course.instructor._id.toString() && req.user.role !== 'admin')) {
      return next(createNotFoundError('Course'));
    }
  }

  let enrollmentStatus = null;
  let userProgress = null;
  let canEnroll = true;

  if (req.user) {
    userProgress = await Progress.findOne({
      userId: req.user._id,
      courseId: course._id
    });

    if (userProgress) {
      enrollmentStatus = 'enrolled';
      canEnroll = false;
    }
  } else {
    canEnroll = false; // Need to be logged in to enroll
  }

  // Hide quiz questions for non-enrolled users
  let courseData = course.toObject();
  if (!userProgress) {
    if (courseData.quiz) {
      courseData.quiz.questions = courseData.quiz.questions.map(q => ({
        ...q,
        options: q.options?.map(opt => ({ text: opt.text })), // Hide correct answers
        correctAnswer: undefined,
        explanation: undefined
      }));
    }
  }

  res.status(200).json({
    success: true,
    data: { 
      course: {
        ...courseData,
        enrollmentStatus,
        progress: userProgress,
        canEnroll
      }
    }
  });
}));

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin/Business)
router.post('/', [
  businessOrAdmin,
  validateRequired(['title', 'description', 'skillTag', 'category', 'level', 'duration'])
], asyncHandler(async (req, res, next) => {
  // Add instructor ID to request body
  req.body.instructor = req.user._id;

  const course = await Course.create(req.body);

  // Populate instructor info
  await course.populate('instructor', 'name avatar rating businessName');

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: { course }
  });
}));

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor or Admin)
router.put('/:id', [
  validateObjectId('id'),
  auth
], asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(createNotFoundError('Course'));
  }

  // Check ownership
  if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(createPermissionError('Not authorized to update this course'));
  }

  // Update last updated timestamp
  req.body.lastUpdated = new Date();

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('instructor', 'name avatar rating businessName');

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    data: { course }
  });
}));

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor or Admin)
router.delete('/:id', [
  validateObjectId('id'),
  auth
], asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(createNotFoundError('Course'));
  }

  // Check ownership
  if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(createPermissionError('Not authorized to delete this course'));
  }

  // Check if course has enrollments
  const enrollmentCount = await Progress.countDocuments({ courseId: course._id });
  if (enrollmentCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete course with existing enrollments'
    });
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully'
  });
}));

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private
router.post('/:id/enroll', [
  validateObjectId('id'),
  auth
], asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(createNotFoundError('Course'));
  }

  if (course.status !== 'published' || !course.isPublic) {
    return res.status(400).json({
      success: false,
      message: 'Course is not available for enrollment'
    });
  }

  // Check if already enrolled
  const existingProgress = await Progress.findOne({
    userId: req.user._id,
    courseId: course._id
  });

  if (existingProgress) {
    return res.status(400).json({
      success: false,
      message: 'Already enrolled in this course'
    });
  }

  // Create progress record
  const progress = await Progress.create({
    userId: req.user._id,
    courseId: course._id
  });

  // Update course enrollment count
  await course.incrementEnrollment();

  // Add to user's enrolled courses
  req.user.enrolledCourses.push({
    courseId: course._id,
    enrolledAt: new Date()
  });
  await req.user.save();

  // Award enrollment XP
  await req.user.addXP(25, `Course enrollment: ${course.title}`);

  res.status(201).json({
    success: true,
    message: 'Enrolled in course successfully! You earned 25 XP.',
    data: { progress }
  });
}));

// @desc    Get course progress
// @route   GET /api/courses/:id/progress
// @access  Private
router.get('/:id/progress', [
  validateObjectId('id'),
  auth
], asyncHandler(async (req, res, next) => {
  const progress = await Progress.findOne({
    userId: req.user._id,
    courseId: req.params.id
  }).populate('courseId', 'title modules quiz');

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Not enrolled in this course'
    });
  }

  res.status(200).json({
    success: true,
    data: { progress }
  });
}));

// @desc    Update module progress
// @route   PUT /api/courses/:id/modules/:moduleId/progress
// @access  Private
router.put('/:id/modules/:moduleId/progress', [
  validateObjectId('id'),
  validateObjectId('moduleId'),
  auth
], asyncHandler(async (req, res, next) => {
  const progress = await Progress.findOne({
    userId: req.user._id,
    courseId: req.params.id
  });

  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Not enrolled in this course'
    });
  }

  const { status, timeSpent = 0, notes, bookmarked = false } = req.body;

  const moduleProgress = await progress.updateModuleProgress(req.params.moduleId, {
    status,
    timeSpent,
    notes,
    bookmarked,
    ...(status === 'completed' && { completedAt: new Date() }),
    ...(status === 'in-progress' && !progress.modulesProgress.find(m => m.moduleId.toString() === req.params.moduleId)?.startedAt && { startedAt: new Date() })
  });

  // Award XP for module completion
  if (status === 'completed') {
    const course = await Course.findById(req.params.id);
    const module = course.modules.id(req.params.moduleId);
    
    if (module) {
      const xpReward = module.xpReward || 50;
      await req.user.addXP(xpReward, `Module completed: ${module.title}`);
    }

    // Check for course completion
    if (progress.progressPercentage === 100) {
      await progress.markCompleted();
      await Course.findByIdAndUpdate(req.params.id, { $inc: { completionCount: 1 } });
      
      // Award course completion XP
      const courseXP = course.xpReward || 500;
      await req.user.addXP(courseXP, `Course completed: ${course.title}`);

      // Award badge if configured
      if (course.badgeGranted) {
        try {
          const badge = await Badge.findById(course.badgeGranted);
          if (badge) {
            await badge.awardToUser(req.user, course._id);
          }
        } catch (error) {
          console.error('Badge award error:', error);
        }
      }
    }
  }

  res.status(200).json({
    success: true,
    message: status === 'completed' ? 'Module completed! XP awarded.' : 'Progress updated',
    data: { 
      moduleProgress,
      overallProgress: progress.progressPercentage
    }
  });
}));

// @desc    Submit quiz attempt
// @route   POST /api/courses/:id/quiz/attempt
// @access  Private
router.post('/:id/quiz/attempt', [
  validateObjectId('id'),
  auth,
  validateRequired(['answers'])
], asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  const progress = await Progress.findOne({
    userId: req.user._id,
    courseId: req.params.id
  });

  if (!course || !progress) {
    return next(createNotFoundError('Course or enrollment'));
  }

  if (!course.quiz || !course.quiz.questions.length) {
    return res.status(400).json({
      success: false,
      message: 'No quiz available for this course'
    });
  }

  const { answers, timeSpent = 0 } = req.body;

  // Check attempt limit
  if (progress.quizAttempts.length >= course.quiz.attemptsAllowed) {
    return res.status(400).json({
      success: false,
      message: 'Maximum quiz attempts reached'
    });
  }

  // Grade the quiz
  let totalPoints = 0;
  let maxPoints = 0;
  const gradedAnswers = [];

  for (let i = 0; i < course.quiz.questions.length; i++) {
    const question = course.quiz.questions[i];
    const userAnswer = answers[i];
    let isCorrect = false;
    let pointsEarned = 0;

    maxPoints += question.points;

    switch (question.type) {
      case 'multiple-choice':
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = userAnswer === correctOption?.text;
        break;
      case 'true-false':
        const correctTF = question.options.find(opt => opt.isCorrect);
        isCorrect = userAnswer === correctTF?.text;
        break;
      case 'fill-blank':
      case 'short-answer':
        isCorrect = userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
        break;
    }

    if (isCorrect) {
      pointsEarned = question.points;
      totalPoints += pointsEarned;
    }

    gradedAnswers.push({
      questionId: question._id,
      answer: userAnswer,
      isCorrect,
      pointsEarned
    });
  }

  const score = Math.round((totalPoints / maxPoints) * 100);
  const passed = score >= (course.quiz.passingScore || 70);

  // Record quiz attempt
  const attempt = await progress.recordQuizAttempt({
    startedAt: new Date(Date.now() - timeSpent * 1000),
    completedAt: new Date(),
    timeSpent,
    answers: gradedAnswers,
    score,
    totalPoints,
    maxPoints,
    passed
  });

  // Award XP for quiz completion
  let xpReward = 0;
  if (passed) {
    xpReward = course.quiz.xpReward || 100;
    await req.user.addXP(xpReward, `Quiz passed: ${course.title}`);
  } else {
    xpReward = Math.floor((course.quiz.xpReward || 100) * 0.3); // 30% XP for failed attempt
    await req.user.addXP(xpReward, `Quiz attempted: ${course.title}`);
  }

  res.status(201).json({
    success: true,
    message: passed ? `Quiz passed! Score: ${score}%. You earned ${xpReward} XP.` : `Quiz failed. Score: ${score}%. You earned ${xpReward} XP for trying.`,
    data: { 
      attempt: {
        ...attempt.toObject(),
        feedback: passed ? 'Great job! You passed the quiz.' : 'Keep studying and try again.'
      },
      xpEarned: xpReward
    }
  });
}));

// @desc    Add course review
// @route   POST /api/courses/:id/review
// @access  Private
router.post('/:id/review', [
  validateObjectId('id'),
  auth,
  validateRequired(['rating'])
], asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  const progress = await Progress.findOne({
    userId: req.user._id,
    courseId: req.params.id
  });

  if (!course || !progress) {
    return next(createNotFoundError('Course or enrollment'));
  }

  // Check if course is completed
  if (progress.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Can only review completed courses'
    });
  }

  const { rating, comment = '' } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  await course.addReview(req.user._id, rating, comment);

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: { 
      rating: course.rating.average,
      reviewCount: course.rating.count
    }
  });
}));

// @desc    Get popular courses
// @route   GET /api/courses/popular
// @access  Public
router.get('/listings/popular', asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const courses = await Course.getPopular(limit);

  res.status(200).json({
    success: true,
    count: courses.length,
    data: { courses }
  });
}));

// @desc    Get featured courses
// @route   GET /api/courses/featured
// @access  Public
router.get('/listings/featured', asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  
  const courses = await Course.getFeatured(limit);

  res.status(200).json({
    success: true,
    count: courses.length,
    data: { courses }
  });
}));

// @desc    Search courses
// @route   GET /api/courses/search
// @access  Public
router.get('/search/query', asyncHandler(async (req, res, next) => {
  const { q: query, category, level, skill } = req.query;
  
  const filters = {};
  if (category) filters.category = category;
  if (level) filters.level = level;
  if (skill) filters.skillTag = skill.toLowerCase();

  const courses = await Course.search(query, filters)
    .limit(50);

  res.status(200).json({
    success: true,
    count: courses.length,
    data: { courses }
  });
}));

// @desc    Get user's enrolled courses
// @route   GET /api/courses/my/enrolled
// @access  Private
router.get('/my/enrolled', auth, asyncHandler(async (req, res, next) => {
  const progressRecords = await Progress.find({ userId: req.user._id })
    .populate('courseId', 'title thumbnail duration instructor category level')
    .populate('courseId.instructor', 'name avatar')
    .sort('-lastAccessedAt');

  const courses = progressRecords.map(progress => ({
    course: progress.courseId,
    progress: {
      percentage: progress.progressPercentage,
      status: progress.status,
      lastAccessedAt: progress.lastAccessedAt,
      timeSpent: progress.totalTimeSpent,
      quizPassed: progress.quizPassed
    }
  }));

  res.status(200).json({
    success: true,
    count: courses.length,
    data: { courses }
  });
}));

// @desc    Get instructor's courses
// @route   GET /api/courses/my/teaching
// @access  Private (Business/Admin)
router.get('/my/teaching', [auth, businessOrAdmin], asyncHandler(async (req, res, next) => {
  const courses = await Course.find({ instructor: req.user._id })
    .populate('badgeGranted', 'name icon')
    .sort('-createdAt');

  // Add analytics for each course
  const coursesWithAnalytics = await Promise.all(
    courses.map(async (course) => {
      const analytics = await Progress.getCourseAnalytics(course._id);
      return {
        ...course.toObject(),
        analytics
      };
    })
  );

  res.status(200).json({
    success: true,
    count: courses.length,
    data: { courses: coursesWithAnalytics }
  });
}));

export default router;