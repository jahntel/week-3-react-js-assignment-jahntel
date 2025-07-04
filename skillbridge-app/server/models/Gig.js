import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Application message cannot exceed 500 characters']
  },
  proposedRate: {
    type: Number,
    min: 0
  },
  estimatedDuration: {
    type: Number, // in hours
    min: 0.5
  },
  portfolio: [{
    title: String,
    description: String,
    url: String,
    imageUrl: String
  }],
  responseAt: Date,
  responseMessage: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const gigSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Gig title is required'],
    trim: true,
    maxlength: [100, 'Gig title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Gig description is required'],
    trim: true,
    maxlength: [1000, 'Gig description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'cleaning', 'delivery', 'tutoring', 'design', 'writing', 'data-entry',
      'social-media', 'customer-service', 'sales', 'marketing', 'accounting',
      'web-development', 'mobile-app', 'photography', 'videography',
      'translation', 'virtual-assistant', 'research', 'consulting',
      'handyman', 'gardening', 'cooking', 'childcare', 'eldercare',
      'pet-care', 'event-planning', 'music', 'fitness', 'beauty',
      'repair', 'construction', 'agriculture', 'retail', 'hospitality'
    ]
  },
  skillsRequired: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    required: {
      type: Boolean,
      default: true
    }
  }],
  
  // Location and geospatial data
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: function(arr) {
          return arr.length === 2;
        },
        message: 'Coordinates must contain exactly 2 values: [longitude, latitude]'
      }
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    region: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'Kenya'
    },
    postalCode: {
      type: String,
      trim: true
    }
  },
  
  // Client information
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactInfo: {
    phone: String,
    email: String,
    preferredContact: {
      type: String,
      enum: ['phone', 'email', 'app'],
      default: 'app'
    }
  },
  
  // Gig details
  budget: {
    min: {
      type: Number,
      required: [true, 'Minimum budget is required'],
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'KES'
    },
    type: {
      type: String,
      enum: ['fixed', 'hourly', 'negotiable'],
      default: 'fixed'
    }
  },
  
  duration: {
    estimated: {
      type: Number, // in hours
      required: true,
      min: 0.5
    },
    flexible: {
      type: Boolean,
      default: false
    },
    deadline: Date
  },
  
  // Gig status and workflow
  status: {
    type: String,
    enum: ['draft', 'posted', 'in-progress', 'completed', 'cancelled', 'disputed'],
    default: 'posted'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Assignment and completion
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  startedAt: Date,
  completedAt: Date,
  
  // Applications management
  applications: [applicationSchema],
  maxApplications: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
  
  // Requirements and preferences
  requirements: [{
    type: String,
    trim: true
  }],
  
  preferredQualifications: [{
    type: String,
    trim: true
  }],
  
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'expert'],
    default: 'entry'
  },
  
  // Scheduling
  schedule: {
    type: {
      type: String,
      enum: ['asap', 'flexible', 'specific'],
      default: 'flexible'
    },
    startDate: Date,
    endDate: Date,
    timeSlots: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // HH:MM format
      endTime: String
    }],
    timezone: {
      type: String,
      default: 'Africa/Nairobi'
    }
  },
  
  // Visibility and posting settings
  visibility: {
    type: String,
    enum: ['public', 'private', 'invited-only'],
    default: 'public'
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  },
  
  // Feedback and rating
  rating: {
    clientRating: { type: Number, min: 1, max: 5 },
    workerRating: { type: Number, min: 1, max: 5 },
    clientFeedback: String,
    workerFeedback: String
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  
  // Attachments and media
  attachments: [{
    name: String,
    url: String,
    type: { type: String, enum: ['image', 'document', 'video'] },
    size: Number
  }],
  
  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'mobile-money', 'bank-transfer', 'platform'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'disputed', 'refunded'],
      default: 'pending'
    },
    amount: Number,
    paidAt: Date,
    transactionId: String
  },
  
  // Safety and verification
  verificationRequired: {
    type: Boolean,
    default: false
  },
  
  backgroundCheckRequired: {
    type: Boolean,
    default: false
  },
  
  insuranceRequired: {
    type: Boolean,
    default: false
  },
  
  // Additional metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  language: {
    type: String,
    default: 'en'
  },
  
  isRemote: {
    type: Boolean,
    default: false
  },
  
  // Recurring gig settings
  isRecurring: {
    type: Boolean,
    default: false
  },
  
  recurringSchedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly']
    },
    endDate: Date,
    maxOccurrences: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
gigSchema.index({ location: '2dsphere' });

// Create compound indexes for performance
gigSchema.index({ category: 1, status: 1 });
gigSchema.index({ 'skillsRequired.name': 1, status: 1 });
gigSchema.index({ status: 1, expiresAt: 1 });
gigSchema.index({ clientId: 1, status: 1 });
gigSchema.index({ assignedTo: 1, status: 1 });
gigSchema.index({ priority: -1, createdAt: -1 });
gigSchema.index({ featured: -1, createdAt: -1 });
gigSchema.index({ tags: 1 });

// Text search index
gigSchema.index({ 
  title: 'text', 
  description: 'text', 
  'skillsRequired.name': 'text',
  tags: 'text'
});

// Virtual for application count
gigSchema.virtual('applicationCount').get(function() {
  return this.applications ? this.applications.length : 0;
});

// Virtual for time since posted
gigSchema.virtual('timePosted').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

// Virtual for budget display
gigSchema.virtual('budgetDisplay').get(function() {
  if (this.budget.type === 'negotiable') return 'Negotiable';
  if (this.budget.min === this.budget.max) {
    return `${this.budget.currency} ${this.budget.min}`;
  }
  return `${this.budget.currency} ${this.budget.min} - ${this.budget.max || this.budget.min}`;
});

// Virtual for is expired
gigSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for days until deadline
gigSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.duration.deadline) return null;
  const now = new Date();
  const diffTime = this.duration.deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if user can apply
gigSchema.methods.canUserApply = function(userId) {
  // Check if gig is available for applications
  if (this.status !== 'posted') return { canApply: false, reason: 'Gig is not accepting applications' };
  
  // Check if expired
  if (this.isExpired) return { canApply: false, reason: 'Gig has expired' };
  
  // Check if user is the client
  if (this.clientId.toString() === userId.toString()) {
    return { canApply: false, reason: 'Cannot apply to your own gig' };
  }
  
  // Check if already applied
  const hasApplied = this.applications.some(app => app.applicantId.toString() === userId.toString());
  if (hasApplied) return { canApply: false, reason: 'Already applied to this gig' };
  
  // Check if max applications reached
  if (this.applications.length >= this.maxApplications) {
    return { canApply: false, reason: 'Maximum applications reached' };
  }
  
  return { canApply: true };
};

// Method to add application
gigSchema.methods.addApplication = async function(applicantId, applicationData) {
  const canApply = this.canUserApply(applicantId);
  if (!canApply.canApply) {
    throw new Error(canApply.reason);
  }
  
  this.applications.push({
    applicantId,
    ...applicationData
  });
  
  await this.save();
  return this.applications[this.applications.length - 1];
};

// Method to update application status
gigSchema.methods.updateApplicationStatus = async function(applicationId, status, responseMessage = '') {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }
  
  application.status = status;
  application.responseAt = new Date();
  application.responseMessage = responseMessage;
  
  // If accepted, assign the gig and reject other applications
  if (status === 'accepted') {
    this.assignedTo = application.applicantId;
    this.assignedAt = new Date();
    this.status = 'in-progress';
    
    // Reject other pending applications
    this.applications.forEach(app => {
      if (app._id.toString() !== applicationId.toString() && app.status === 'pending') {
        app.status = 'rejected';
        app.responseAt = new Date();
        app.responseMessage = 'Position has been filled';
      }
    });
  }
  
  await this.save();
  return application;
};

// Method to complete gig
gigSchema.methods.completeGig = async function(clientRating = null, clientFeedback = '', workerRating = null, workerFeedback = '') {
  this.status = 'completed';
  this.completedAt = new Date();
  
  if (clientRating) this.rating.clientRating = clientRating;
  if (clientFeedback) this.rating.clientFeedback = clientFeedback;
  if (workerRating) this.rating.workerRating = workerRating;
  if (workerFeedback) this.rating.workerFeedback = workerFeedback;
  
  await this.save();
  return this;
};

// Method to increment views
gigSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save({ validateBeforeSave: false });
  return this.views;
};

// Static method to find nearby gigs
gigSchema.statics.findNearby = function(coordinates, maxDistance = 10000, filters = {}) {
  const query = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: maxDistance // in meters
      }
    },
    status: 'posted',
    expiresAt: { $gt: new Date() },
    ...filters
  };
  
  return this.find(query)
    .populate('clientId', 'name avatar rating businessName')
    .sort({ priority: -1, createdAt: -1 });
};

// Static method to search gigs
gigSchema.statics.searchGigs = function(query, location = null, filters = {}) {
  const searchCriteria = {
    status: 'posted',
    expiresAt: { $gt: new Date() },
    ...filters
  };
  
  if (query) {
    searchCriteria.$text = { $search: query };
  }
  
  let gigQuery = this.find(searchCriteria);
  
  // Add location-based sorting if coordinates provided
  if (location && location.coordinates) {
    gigQuery = gigQuery.near('location', {
      center: location.coordinates,
      maxDistance: location.maxDistance || 50000, // 50km default
      spherical: true
    });
  } else {
    gigQuery = gigQuery.sort(query ? { score: { $meta: 'textScore' } } : { priority: -1, createdAt: -1 });
  }
  
  return gigQuery.populate('clientId', 'name avatar rating businessName');
};

// Static method to get gigs by skills
gigSchema.statics.findBySkills = function(skills, location = null, maxDistance = 10000) {
  const query = {
    'skillsRequired.name': { $in: skills },
    status: 'posted',
    expiresAt: { $gt: new Date() }
  };
  
  let gigQuery = this.find(query);
  
  if (location) {
    gigQuery = gigQuery.near('location', {
      center: location,
      maxDistance: maxDistance,
      spherical: true
    });
  } else {
    gigQuery = gigQuery.sort({ priority: -1, createdAt: -1 });
  }
  
  return gigQuery.populate('clientId', 'name avatar rating businessName');
};

// Middleware to auto-expire gigs
gigSchema.pre('find', function() {
  this.where({ expiresAt: { $gt: new Date() } });
});

gigSchema.pre('findOne', function() {
  this.where({ expiresAt: { $gt: new Date() } });
});

export default mongoose.model('Gig', gigSchema);