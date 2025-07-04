import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [100, 'Module title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Module description cannot exceed 500 characters']
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Module duration is required'],
    min: [1, 'Module duration must be at least 1 minute']
  },
  content: {
    type: {
      type: String,
      enum: ['video', 'article', 'interactive', 'quiz'],
      required: true
    },
    url: {
      type: String,
      trim: true
    },
    text: {
      type: String,
      trim: true
    },
    resources: [{
      name: String,
      url: String,
      type: { type: String, enum: ['pdf', 'link', 'image', 'video'] }
    }]
  },
  xpReward: {
    type: Number,
    default: 50,
    min: 0
  },
  isOptional: {
    type: Boolean,
    default: false
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
}, { timestamps: true });

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [{
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'fill-blank', 'short-answer'],
      default: 'multiple-choice'
    },
    options: [{
      text: { type: String, required: true },
      isCorrect: { type: Boolean, default: false }
    }],
    correctAnswer: String, // For fill-blank and short-answer
    points: {
      type: Number,
      default: 10,
      min: 1
    },
    explanation: {
      type: String,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  }],
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30
  },
  attemptsAllowed: {
    type: Number,
    default: 3,
    min: 1
  },
  randomizeQuestions: {
    type: Boolean,
    default: true
  },
  xpReward: {
    type: Number,
    default: 100,
    min: 0
  }
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    maxlength: [1000, 'Course description cannot exceed 1000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  skillTag: {
    type: String,
    required: [true, 'Skill tag is required'],
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'technology', 'business', 'design', 'marketing', 'finance', 
      'health', 'language', 'personal-development', 'agriculture',
      'construction', 'hospitality', 'manufacturing', 'retail'
    ]
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['beginner', 'intermediate', 'advanced']
  },
  duration: {
    type: Number, // total duration in minutes
    required: [true, 'Course duration is required'],
    min: [10, 'Course duration must be at least 10 minutes']
  },
  thumbnail: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true
  },
  trailer: {
    type: String, // video URL
    trim: true
  },
  
  // Content structure
  modules: [moduleSchema],
  quiz: quizSchema,
  
  // Course metadata
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES'
  },
  
  // Rewards and achievements
  badgeGranted: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  },
  xpReward: {
    type: Number,
    default: 500,
    min: 0
  },
  certificateTemplate: {
    type: String,
    trim: true
  },
  
  // Course status and visibility
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'under-review'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Analytics and engagement
  enrollmentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  completionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 }
  },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Learning objectives and outcomes
  learningObjectives: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  targetAudience: [{
    type: String,
    trim: true
  }],
  
  // Tags and searchability
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  language: {
    type: String,
    default: 'en'
  },
  subtitles: [{
    language: String,
    url: String
  }],
  
  // Accessibility and format
  accessibility: {
    hasTranscripts: { type: Boolean, default: false },
    hasSubtitles: { type: Boolean, default: false },
    isScreenReaderFriendly: { type: Boolean, default: false }
  },
  
  // Course progression settings
  progressionType: {
    type: String,
    enum: ['linear', 'flexible'],
    default: 'linear'
  },
  allowSkipping: {
    type: Boolean,
    default: false
  },
  
  // Engagement features
  hasDiscussion: {
    type: Boolean,
    default: true
  },
  allowDownloads: {
    type: Boolean,
    default: false
  },
  
  // Publishing information
  publishedAt: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for performance
courseSchema.index({ skillTag: 1, level: 1 });
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ 'rating.average': -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ featured: -1, publishedAt: -1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for completion rate
courseSchema.virtual('completionRate').get(function() {
  if (this.enrollmentCount === 0) return 0;
  return Math.round((this.completionCount / this.enrollmentCount) * 100);
});

// Virtual for estimated reading time
courseSchema.virtual('estimatedTime').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for total quiz points
courseSchema.virtual('totalQuizPoints').get(function() {
  if (!this.quiz || !this.quiz.questions) return 0;
  return this.quiz.questions.reduce((total, q) => total + (q.points || 0), 0);
});

// Calculate total XP reward including modules and quiz
courseSchema.virtual('totalXPReward').get(function() {
  let total = this.xpReward || 0;
  
  // Add module XP
  if (this.modules) {
    total += this.modules.reduce((sum, module) => sum + (module.xpReward || 0), 0);
  }
  
  // Add quiz XP
  if (this.quiz && this.quiz.xpReward) {
    total += this.quiz.xpReward;
  }
  
  return total;
});

// Update rating when a new review is added
courseSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = Math.round((totalRating / this.rating.count) * 10) / 10;
  return this.rating.average;
};

// Add review
courseSchema.methods.addReview = async function(userId, rating, comment = '') {
  // Check if user already reviewed
  const existingReview = this.reviews.find(r => r.userId.toString() === userId.toString());
  
  if (existingReview) {
    // Update existing review
    const oldRating = existingReview.rating;
    existingReview.rating = rating;
    existingReview.comment = comment;
    
    // Recalculate average rating
    const totalRating = (this.rating.average * this.rating.count) - oldRating + rating;
    this.rating.average = Math.round((totalRating / this.rating.count) * 10) / 10;
  } else {
    // Add new review
    this.reviews.push({ userId, rating, comment });
    this.updateRating(rating);
  }
  
  await this.save();
  return this.rating.average;
};

// Get popular courses
courseSchema.statics.getPopular = function(limit = 10) {
  return this.find({ status: 'published', isPublic: true })
    .sort({ enrollmentCount: -1, 'rating.average': -1 })
    .limit(limit)
    .populate('instructor', 'name avatar')
    .populate('badgeGranted');
};

// Get featured courses
courseSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ status: 'published', isPublic: true, featured: true })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate('instructor', 'name avatar')
    .populate('badgeGranted');
};

// Search courses
courseSchema.statics.search = function(query, filters = {}) {
  const searchCriteria = {
    status: 'published',
    isPublic: true,
    ...filters
  };
  
  if (query) {
    searchCriteria.$text = { $search: query };
  }
  
  return this.find(searchCriteria)
    .sort(query ? { score: { $meta: 'textScore' } } : { publishedAt: -1 })
    .populate('instructor', 'name avatar')
    .populate('badgeGranted');
};

// Increment enrollment
courseSchema.methods.incrementEnrollment = async function() {
  this.enrollmentCount += 1;
  await this.save();
  return this.enrollmentCount;
};

// Increment completion
courseSchema.methods.incrementCompletion = async function() {
  this.completionCount += 1;
  await this.save();
  return this.completionCount;
};

export default mongoose.model('Course', courseSchema);