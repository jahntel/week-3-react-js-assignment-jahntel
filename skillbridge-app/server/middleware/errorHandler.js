import mongoose from 'mongoose';

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Main error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError') {
    const message = 'Database connection error';
    error = new AppError(message, 500);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new AppError(message, 400);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = new AppError(message, 429);
  }

  // Payment/billing errors
  if (err.type === 'StripeCardError') {
    const message = 'Payment failed: ' + err.message;
    error = new AppError(message, 400);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        name: err.name,
        code: err.code
      })
    },
    ...(process.env.NODE_ENV === 'development' && {
      originalError: err
    })
  });
};

// Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler for unmatched routes
export const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Validation error helper
export const createValidationError = (field, message) => {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.errors = {
    [field]: { message }
  };
  return error;
};

// Permission error helper
export const createPermissionError = (message = 'Permission denied') => {
  return new AppError(message, 403);
};

// Authentication error helper
export const createAuthError = (message = 'Authentication required') => {
  return new AppError(message, 401);
};

// Resource not found error helper
export const createNotFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404);
};

// Bad request error helper
export const createBadRequestError = (message = 'Bad request') => {
  return new AppError(message, 400);
};

// Server error helper
export const createServerError = (message = 'Internal server error') => {
  return new AppError(message, 500);
};

// Conflict error helper
export const createConflictError = (message = 'Conflict') => {
  return new AppError(message, 409);
};

// Rate limit error helper
export const createRateLimitError = (message = 'Rate limit exceeded') => {
  return new AppError(message, 429);
};

// File upload error helper
export const createFileUploadError = (message = 'File upload failed') => {
  return new AppError(message, 400);
};

// Payment error helper
export const createPaymentError = (message = 'Payment processing failed') => {
  return new AppError(message, 402);
};

// Validation middleware for request body
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => {
      if (field.includes('.')) {
        // Handle nested fields like 'location.coordinates'
        const keys = field.split('.');
        let value = req.body;
        for (const key of keys) {
          value = value?.[key];
        }
        return value === undefined || value === null || value === '';
      }
      return req.body[field] === undefined || req.body[field] === null || req.body[field] === '';
    });

    if (missingFields.length > 0) {
      const error = createValidationError(
        'required_fields',
        `Missing required fields: ${missingFields.join(', ')}`
      );
      return next(error);
    }

    next();
  };
};

// Validation middleware for MongoDB ObjectId
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createValidationError(paramName, `Invalid ${paramName} format`);
      return next(error);
    }

    next();
  };
};

// Validation middleware for email format
export const validateEmail = (fieldName = 'email') => {
  return (req, res, next) => {
    const email = req.body[fieldName];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailRegex.test(email)) {
      const error = createValidationError(fieldName, 'Invalid email format');
      return next(error);
    }

    next();
  };
};

// Validation middleware for password strength
export const validatePassword = (fieldName = 'password') => {
  return (req, res, next) => {
    const password = req.body[fieldName];

    if (password) {
      if (password.length < 6) {
        const error = createValidationError(fieldName, 'Password must be at least 6 characters long');
        return next(error);
      }

      // Optional: Add more password complexity requirements
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /\d/.test(password);

      if (!hasLetter || !hasNumber) {
        const error = createValidationError(
          fieldName, 
          'Password must contain at least one letter and one number'
        );
        return next(error);
      }
    }

    next();
  };
};

// Validation middleware for coordinate format
export const validateCoordinates = (fieldName = 'coordinates') => {
  return (req, res, next) => {
    const coordinates = req.body.location?.[fieldName] || req.body[fieldName];

    if (coordinates) {
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        const error = createValidationError(
          fieldName, 
          'Coordinates must be an array of exactly 2 numbers [longitude, latitude]'
        );
        return next(error);
      }

      const [lng, lat] = coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        const error = createValidationError(fieldName, 'Coordinates must be numbers');
        return next(error);
      }

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        const error = createValidationError(
          fieldName, 
          'Invalid coordinates range. Longitude: -180 to 180, Latitude: -90 to 90'
        );
        return next(error);
      }
    }

    next();
  };
};

// Global unhandled promise rejection handler
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection:', err.message);
  console.log('Promise:', promise);
  // Close server & exit process
  // server.close(() => {
  //   process.exit(1);
  // });
});

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  console.log('Stack:', err.stack);
  process.exit(1);
});