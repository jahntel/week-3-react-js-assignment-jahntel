import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid - user not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account has been deactivated' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expired' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Admin only middleware
export const adminOnly = authorize('admin');

// Business or admin middleware
export const businessOrAdmin = authorize('business', 'admin');

// Learner, business, or admin middleware (basically any authenticated user)
export const authenticatedUser = authorize('learner', 'business', 'admin');

// Check if user owns resource or is admin
export const ownerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return next();
      }

      const ownerId = typeof getOwnerId === 'function' 
        ? await getOwnerId(req) 
        : req.params[getOwnerId] || req.body[getOwnerId];

      if (req.user._id.toString() !== ownerId.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only access your own resources.' 
        });
      }

      next();
    } catch (error) {
      console.error('Owner check error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error checking resource ownership' 
      });
    }
  };
};

// Check if user has required skill level
export const requireSkillLevel = (skillName, minLevel = 'beginner') => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }

    const userSkill = req.user.skills.find(
      skill => skill.name.toLowerCase() === skillName.toLowerCase()
    );

    if (!userSkill) {
      return res.status(403).json({ 
        success: false, 
        message: `Required skill '${skillName}' not found` 
      });
    }

    const levelOrder = ['beginner', 'intermediate', 'advanced'];
    const userLevelIndex = levelOrder.indexOf(userSkill.level);
    const requiredLevelIndex = levelOrder.indexOf(minLevel);

    if (userLevelIndex < requiredLevelIndex) {
      return res.status(403).json({ 
        success: false, 
        message: `Minimum skill level '${minLevel}' required for '${skillName}'` 
      });
    }

    next();
  };
};

// Check if user has required XP level
export const requireXP = (minXP) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.xp < minXP) {
      return res.status(403).json({ 
        success: false, 
        message: `Minimum ${minXP} XP required. You have ${req.user.xp} XP.` 
      });
    }

    next();
  };
};

// Check if user has required level
export const requireLevel = (minLevel) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.level < minLevel) {
      return res.status(403).json({ 
        success: false, 
        message: `Level ${minLevel} required. You are level ${req.user.level}.` 
      });
    }

    next();
  };
};

// Check if user has verified account
export const requireVerification = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({ 
      success: false, 
      message: 'Email verification required to access this resource' 
    });
  }

  next();
};

// Rate limiting per user
export const userRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => time > windowStart);
    requests.set(userId, recentRequests);

    if (recentRequests.length >= max) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many requests. Please try again later.' 
      });
    }

    recentRequests.push(now);
    next();
  };
};

// Middleware to update last login
export const updateLastLogin = async (req, res, next) => {
  if (req.user) {
    try {
      await User.findByIdAndUpdate(req.user._id, { 
        lastLogin: new Date() 
      }, { 
        timestamps: false // Don't update updatedAt
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't fail the request if this fails
    }
  }
  next();
};