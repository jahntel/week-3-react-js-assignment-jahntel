import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { 
  asyncHandler, 
  validateRequired, 
  validateEmail, 
  validatePassword 
} from '../middleware/errorHandler.js';

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          xp: user.xp,
          level: user.level,
          verified: user.verified,
          emailVerified: user.emailVerified,
          profileCompletion: user.profileCompletion
        }
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  validateRequired(['name', 'email', 'password']),
  validateEmail(),
  validatePassword()
], asyncHandler(async (req, res, next) => {
  const { name, email, password, role = 'learner', ...otherData } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    ...otherData
  });

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email
  // await sendVerificationEmail(user.email, verificationToken);

  sendTokenResponse(user, 201, res, 'User registered successfully. Please check your email for verification.');
}));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  validateRequired(['email', 'password']),
  validateEmail()
], asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for user and include password
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account has been deactivated. Please contact support.'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, 'Login successful');
}));

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
router.get('/logout', asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
}));

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', auth, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('badges.badgeId', 'name icon color')
    .populate('enrolledCourses.courseId', 'title thumbnail duration');

  res.status(200).json({
    success: true,
    data: { user }
  });
}));

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
router.put('/updatedetails', auth, asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    age: req.body.age,
    location: req.body.location,
    businessName: req.body.businessName,
    businessType: req.body.businessType,
    businessDescription: req.body.businessDescription,
    preferences: req.body.preferences
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword', [
  auth,
  validateRequired(['currentPassword', 'newPassword']),
  validatePassword('newPassword')
], asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
}));

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', [
  validateRequired(['email']),
  validateEmail()
], asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No user found with that email'
    });
  }

  // Get reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

  // TODO: Send email with reset URL
  // await sendPasswordResetEmail(user.email, resetUrl);

  res.status(200).json({
    success: true,
    message: 'Password reset email sent',
    resetToken // Remove this in production
  });
}));

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', [
  validateRequired(['password']),
  validatePassword()
], asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful');
}));

// @desc    Verify email
// @route   GET /api/auth/verify/:token
// @access  Public
router.get('/verify/:token', asyncHandler(async (req, res, next) => {
  // Get hashed token
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({ emailVerificationToken });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification token'
    });
  }

  // Verify email
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  // Award XP for email verification
  await user.addXP(50, 'Email verification');

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! You earned 50 XP.',
    data: { user }
  });
}));

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
router.post('/resend-verification', auth, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.emailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  await user.save({ validateBeforeSave: false });

  // TODO: Send verification email
  // await sendVerificationEmail(user.email, verificationToken);

  res.status(200).json({
    success: true,
    message: 'Verification email sent'
  });
}));

// @desc    Delete account
// @route   DELETE /api/auth/deleteaccount
// @access  Private
router.delete('/deleteaccount', [
  auth,
  validateRequired(['password'])
], asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check password
  if (!(await user.comparePassword(req.body.password))) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect password'
    });
  }

  // Soft delete - deactivate account
  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

// @desc    Social login callback
// @route   POST /api/auth/social
// @access  Public
router.post('/social', asyncHandler(async (req, res, next) => {
  const { provider, providerData } = req.body;

  // Validate provider data based on provider type
  if (!provider || !providerData || !providerData.email) {
    return res.status(400).json({
      success: false,
      message: 'Invalid social login data'
    });
  }

  let user = await User.findOne({ email: providerData.email });

  if (user) {
    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
  } else {
    // Create new user
    user = await User.create({
      name: providerData.name || providerData.displayName,
      email: providerData.email,
      avatar: providerData.picture || providerData.photos?.[0]?.value,
      emailVerified: true, // Social logins are pre-verified
      password: crypto.randomBytes(32).toString('hex') // Random password
    });

    // Award welcome XP
    await user.addXP(100, 'Welcome to SkillBridge!');
  }

  sendTokenResponse(user, 200, res, 'Social login successful');
}));

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', optionalAuth, asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken && !req.user) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required'
    });
  }

  let user;
  if (req.user) {
    user = req.user;
  } else {
    // Verify refresh token logic here
    // For now, just generate new token for existing user
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }

  sendTokenResponse(user, 200, res, 'Token refreshed successfully');
}));

export default router;