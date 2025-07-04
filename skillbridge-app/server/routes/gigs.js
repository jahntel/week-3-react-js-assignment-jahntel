import express from 'express';
import Gig from '../models/Gig.js';
import User from '../models/User.js';
import { auth, businessOrAdmin, authenticatedUser, optionalAuth } from '../middleware/auth.js';
import { 
  asyncHandler, 
  validateRequired, 
  validateObjectId, 
  validateCoordinates,
  createNotFoundError,
  createPermissionError 
} from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get all gigs with filtering and pagination
// @route   GET /api/gigs
// @access  Public
router.get('/', optionalAuth, asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  // Build query
  let query = { status: 'posted', expiresAt: { $gt: new Date() } };

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by skills
  if (req.query.skills) {
    const skills = req.query.skills.split(',');
    query['skillsRequired.name'] = { $in: skills };
  }

  // Filter by budget range
  if (req.query.minBudget || req.query.maxBudget) {
    query['budget.min'] = {};
    if (req.query.minBudget) query['budget.min'].$gte = parseInt(req.query.minBudget);
    if (req.query.maxBudget) query['budget.max'].$lte = parseInt(req.query.maxBudget);
  }

  // Filter by experience level
  if (req.query.experienceLevel) {
    query.experienceLevel = req.query.experienceLevel;
  }

  // Filter by remote work
  if (req.query.remote !== undefined) {
    query.isRemote = req.query.remote === 'true';
  }

  // Text search
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Location-based search
  let gigQuery = Gig.find(query);

  if (req.query.lat && req.query.lng) {
    const latitude = parseFloat(req.query.lat);
    const longitude = parseFloat(req.query.lng);
    const maxDistance = parseInt(req.query.radius, 10) || 10000; // Default 10km

    gigQuery = Gig.findNearby([longitude, latitude], maxDistance, query);
  } else if (req.query.search) {
    gigQuery = gigQuery.sort({ score: { $meta: 'textScore' } });
  } else {
    gigQuery = gigQuery.sort({ priority: -1, featured: -1, createdAt: -1 });
  }

  // Execute query with pagination
  const gigs = await gigQuery
    .skip(startIndex)
    .limit(limit)
    .populate('clientId', 'name avatar rating businessName verified')
    .lean();

  // Get total count
  const total = await Gig.countDocuments(query);

  // Calculate if user can apply to each gig
  const gigsWithApplicationStatus = gigs.map(gig => ({
    ...gig,
    canApply: req.user ? gig.canUserApply?.(req.user._id) : { canApply: false, reason: 'Authentication required' },
    distance: req.query.lat && req.query.lng && gig.location ? 
      calculateDistance(
        parseFloat(req.query.lat), 
        parseFloat(req.query.lng), 
        gig.location.coordinates[1], 
        gig.location.coordinates[0]
      ) : null
  }));

  res.status(200).json({
    success: true,
    count: gigs.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    data: { gigs: gigsWithApplicationStatus }
  });
}));

// @desc    Get single gig
// @route   GET /api/gigs/:id
// @access  Public
router.get('/:id', [
  validateObjectId('id'),
  optionalAuth
], asyncHandler(async (req, res, next) => {
  let gig = await Gig.findById(req.params.id)
    .populate('clientId', 'name avatar rating businessName verified location')
    .populate('applications.applicantId', 'name avatar rating skills xp level');

  if (!gig) {
    return next(createNotFoundError('Gig'));
  }

  // Increment view count
  await gig.incrementViews();

  // Check if user can apply
  const canApply = req.user ? gig.canUserApply(req.user._id) : { canApply: false, reason: 'Authentication required' };

  // Hide sensitive application data for non-owners
  if (!req.user || (req.user._id.toString() !== gig.clientId._id.toString() && req.user.role !== 'admin')) {
    gig = gig.toObject();
    gig.applications = gig.applications.map(app => ({
      _id: app._id,
      applicantId: {
        _id: app.applicantId._id,
        name: app.applicantId.name,
        avatar: app.applicantId.avatar,
        rating: app.applicantId.rating,
        skills: app.applicantId.skills,
        xp: app.applicantId.xp,
        level: app.applicantId.level
      },
      status: app.status,
      appliedAt: app.appliedAt,
      portfolio: app.portfolio
    }));
  }

  res.status(200).json({
    success: true,
    data: { 
      gig: {
        ...gig,
        canApply
      }
    }
  });
}));

// @desc    Create new gig
// @route   POST /api/gigs
// @access  Private (Business/Admin)
router.post('/', [
  businessOrAdmin,
  validateRequired(['title', 'description', 'category', 'skillsRequired', 'location.coordinates', 'location.address', 'budget.min', 'duration.estimated']),
  validateCoordinates('location.coordinates')
], asyncHandler(async (req, res, next) => {
  // Add client ID to request body
  req.body.clientId = req.user._id;

  const gig = await Gig.create(req.body);

  // Populate client info
  await gig.populate('clientId', 'name avatar rating businessName');

  // Emit real-time event for new gig
  const io = req.app.get('io');
  io.emit('new_gig', {
    gig: gig.toObject(),
    location: gig.location
  });

  res.status(201).json({
    success: true,
    message: 'Gig created successfully',
    data: { gig }
  });
}));

// @desc    Update gig
// @route   PUT /api/gigs/:id
// @access  Private (Owner or Admin)
router.put('/:id', [
  validateObjectId('id'),
  auth
], asyncHandler(async (req, res, next) => {
  let gig = await Gig.findById(req.params.id);

  if (!gig) {
    return next(createNotFoundError('Gig'));
  }

  // Check ownership
  if (gig.clientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(createPermissionError('Not authorized to update this gig'));
  }

  // Prevent updating certain fields if gig has applications
  if (gig.applications.length > 0) {
    const restrictedFields = ['skillsRequired', 'budget', 'category'];
    restrictedFields.forEach(field => {
      if (req.body[field]) {
        delete req.body[field];
      }
    });
  }

  gig = await Gig.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('clientId', 'name avatar rating businessName');

  res.status(200).json({
    success: true,
    message: 'Gig updated successfully',
    data: { gig }
  });
}));

// @desc    Delete gig
// @route   DELETE /api/gigs/:id
// @access  Private (Owner or Admin)
router.delete('/:id', [
  validateObjectId('id'),
  auth
], asyncHandler(async (req, res, next) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    return next(createNotFoundError('Gig'));
  }

  // Check ownership
  if (gig.clientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(createPermissionError('Not authorized to delete this gig'));
  }

  // Can't delete gig with active applications
  if (gig.applications.some(app => app.status === 'accepted')) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete gig with accepted applications'
    });
  }

  await gig.deleteOne();

  // Notify applicants about gig deletion
  const io = req.app.get('io');
  gig.applications.forEach(app => {
    io.to(`user_${app.applicantId}`).emit('gig_deleted', {
      gigId: gig._id,
      gigTitle: gig.title
    });
  });

  res.status(200).json({
    success: true,
    message: 'Gig deleted successfully'
  });
}));

// @desc    Apply to gig
// @route   POST /api/gigs/:id/apply
// @access  Private (Learners)
router.post('/:id/apply', [
  validateObjectId('id'),
  authenticatedUser,
  validateRequired(['message'])
], asyncHandler(async (req, res, next) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    return next(createNotFoundError('Gig'));
  }

  const applicationData = {
    message: req.body.message,
    proposedRate: req.body.proposedRate,
    estimatedDuration: req.body.estimatedDuration,
    portfolio: req.body.portfolio || []
  };

  try {
    const application = await gig.addApplication(req.user._id, applicationData);

    // Notify client
    const io = req.app.get('io');
    io.to(`user_${gig.clientId}`).emit('new_application', {
      gigId: gig._id,
      gigTitle: gig.title,
      applicant: {
        id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar
      },
      applicationId: application._id
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

// @desc    Update application status
// @route   PUT /api/gigs/:id/applications/:applicationId
// @access  Private (Gig Owner)
router.put('/:id/applications/:applicationId', [
  validateObjectId('id'),
  validateObjectId('applicationId'),
  auth,
  validateRequired(['status'])
], asyncHandler(async (req, res, next) => {
  const gig = await Gig.findById(req.params.id)
    .populate('applications.applicantId', 'name avatar rating');

  if (!gig) {
    return next(createNotFoundError('Gig'));
  }

  // Check ownership
  if (gig.clientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(createPermissionError('Not authorized to update applications'));
  }

  const { status, responseMessage = '' } = req.body;

  try {
    const application = await gig.updateApplicationStatus(
      req.params.applicationId, 
      status, 
      responseMessage
    );

    // Notify applicant
    const io = req.app.get('io');
    io.to(`user_${application.applicantId}`).emit('application_status_update', {
      gigId: gig._id,
      gigTitle: gig.title,
      applicationId: application._id,
      status,
      responseMessage
    });

    // If accepted, award XP to worker
    if (status === 'accepted') {
      const worker = await User.findById(application.applicantId);
      await worker.addXP(150, `Gig accepted: ${gig.title}`);
    }

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: { application }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

// @desc    Complete gig
// @route   PUT /api/gigs/:id/complete
// @access  Private (Gig Owner)
router.put('/:id/complete', [
  validateObjectId('id'),
  auth
], asyncHandler(async (req, res, next) => {
  const gig = await Gig.findById(req.params.id)
    .populate('assignedTo', 'name rating');

  if (!gig) {
    return next(createNotFoundError('Gig'));
  }

  // Check ownership
  if (gig.clientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(createPermissionError('Not authorized to complete this gig'));
  }

  if (gig.status !== 'in-progress') {
    return res.status(400).json({
      success: false,
      message: 'Gig must be in progress to complete'
    });
  }

  const { clientRating, clientFeedback = '', workerRating, workerFeedback = '' } = req.body;

  await gig.completeGig(clientRating, clientFeedback, workerRating, workerFeedback);

  // Update worker stats and award XP
  if (gig.assignedTo) {
    const worker = await User.findById(gig.assignedTo._id);
    worker.gigsCompleted += 1;
    
    if (clientRating) {
      worker.updateRating(clientRating);
    }

    // Award completion XP based on gig value
    const xpReward = Math.max(200, Math.floor(gig.budget.min * 0.1));
    await worker.addXP(xpReward, `Gig completed: ${gig.title}`);
    await worker.save();

    // Notify worker
    const io = req.app.get('io');
    io.to(`user_${worker._id}`).emit('gig_completed', {
      gigId: gig._id,
      gigTitle: gig.title,
      rating: clientRating,
      feedback: clientFeedback,
      xpEarned: xpReward
    });
  }

  res.status(200).json({
    success: true,
    message: 'Gig completed successfully',
    data: { gig }
  });
}));

// @desc    Get nearby gigs
// @route   GET /api/gigs/nearby
// @access  Public
router.get('/location/nearby', [
  validateRequired(['lat', 'lng'])
], asyncHandler(async (req, res, next) => {
  const { lat, lng, radius = 10000 } = req.query;
  const coordinates = [parseFloat(lng), parseFloat(lat)];

  const gigs = await Gig.findNearby(coordinates, parseInt(radius))
    .limit(20);

  // Add distance to each gig
  const gigsWithDistance = gigs.map(gig => ({
    ...gig.toObject(),
    distance: calculateDistance(
      parseFloat(lat), 
      parseFloat(lng), 
      gig.location.coordinates[1], 
      gig.location.coordinates[0]
    )
  }));

  res.status(200).json({
    success: true,
    count: gigs.length,
    data: { gigs: gigsWithDistance }
  });
}));

// @desc    Get gigs by skills
// @route   GET /api/gigs/skills/:skillName
// @access  Public
router.get('/skills/:skillName', asyncHandler(async (req, res, next) => {
  const { skillName } = req.params;
  const { lat, lng, radius = 50000 } = req.query;

  let location = null;
  if (lat && lng) {
    location = [parseFloat(lng), parseFloat(lat)];
  }

  const gigs = await Gig.findBySkills([skillName], location, parseInt(radius))
    .limit(50);

  res.status(200).json({
    success: true,
    count: gigs.length,
    data: { gigs }
  });
}));

// @desc    Get user's applied gigs
// @route   GET /api/gigs/my/applications
// @access  Private
router.get('/my/applications', auth, asyncHandler(async (req, res, next) => {
  const gigs = await Gig.find({
    'applications.applicantId': req.user._id
  })
  .populate('clientId', 'name avatar rating businessName')
  .sort('-createdAt');

  // Filter to only show user's applications
  const userApplications = gigs.map(gig => {
    const userApp = gig.applications.find(app => 
      app.applicantId.toString() === req.user._id.toString()
    );
    
    return {
      ...gig.toObject(),
      userApplication: userApp,
      applications: undefined // Remove other applications
    };
  });

  res.status(200).json({
    success: true,
    count: userApplications.length,
    data: { gigs: userApplications }
  });
}));

// @desc    Get user's posted gigs
// @route   GET /api/gigs/my/posted
// @access  Private (Business/Admin)
router.get('/my/posted', [auth, businessOrAdmin], asyncHandler(async (req, res, next) => {
  const gigs = await Gig.find({ clientId: req.user._id })
    .populate('applications.applicantId', 'name avatar rating skills xp level')
    .populate('assignedTo', 'name avatar rating')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: gigs.length,
    data: { gigs }
  });
}));

// @desc    Get featured gigs
// @route   GET /api/gigs/featured
// @access  Public
router.get('/listings/featured', asyncHandler(async (req, res, next) => {
  const gigs = await Gig.find({
    status: 'posted',
    featured: true,
    expiresAt: { $gt: new Date() }
  })
  .populate('clientId', 'name avatar rating businessName verified')
  .sort({ priority: -1, createdAt: -1 })
  .limit(10);

  res.status(200).json({
    success: true,
    count: gigs.length,
    data: { gigs }
  });
}));

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

export default router;