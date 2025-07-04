import mongoose from 'mongoose';

const moduleProgressSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'skipped'],
    default: 'not-started'
  },
  startedAt: Date,
  completedAt: Date,
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  watchTime: {
    type: Number, // in seconds, for video content
    default: 0
  },
  lastPosition: {
    type: Number, // for video/audio content
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  bookmarked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const quizAttemptSchema = new mongoose.Schema({
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    answer: mongoose.Schema.Types.Mixed, // Can be string, number, array
    isCorrect: Boolean,
    timeSpent: Number, // seconds spent on this question
    pointsEarned: {
      type: Number,
      default: 0
    }
  }],
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  maxPoints: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  // Overall progress
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Timing information
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  
  // Detailed progress tracking
  modulesProgress: [moduleProgressSchema],
  
  // Quiz performance
  quizAttempts: [quizAttemptSchema],
  bestQuizScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  quizPassed: {
    type: Boolean,
    default: false
  },
  
  // Time tracking
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  sessionsCount: {
    type: Number,
    default: 0
  },
  averageSessionTime: {
    type: Number, // in seconds
    default: 0
  },
  
  // Learning patterns
  preferredLearningTimes: [{
    dayOfWeek: {
      type: Number, // 0-6 (Sunday-Saturday)
      min: 0,
      max: 6
    },
    hour: {
      type: Number, // 0-23
      min: 0,
      max: 23
    },
    duration: Number // minutes spent during this time
  }],
  
  // Engagement metrics
  bookmarksCount: {
    type: Number,
    default: 0
  },
  notesCount: {
    type: Number,
    default: 0
  },
  
  // Performance analytics
  strugglingAreas: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    reason: String, // 'time_spent', 'multiple_attempts', 'low_quiz_score'
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  
  strongAreas: [{
    moduleId: mongoose.Schema.Types.ObjectId,
    reason: String, // 'quick_completion', 'high_quiz_score', 'first_attempt_success'
  }],
  
  // Recommendations and insights
  recommendations: [{
    type: {
      type: String,
      enum: ['review_module', 'take_break', 'practice_more', 'move_forward', 'seek_help']
    },
    moduleId: mongoose.Schema.Types.ObjectId,
    message: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    dismissed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Learning goals and milestones
  personalGoals: [{
    type: {
      type: String,
      enum: ['completion_date', 'daily_time', 'weekly_modules', 'quiz_score']
    },
    target: mongoose.Schema.Types.Mixed,
    current: mongoose.Schema.Types.Mixed,
    achieved: {
      type: Boolean,
      default: false
    },
    setAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Certificate and completion
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: Date,
  certificateId: String,
  
  // Feedback and rating
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  userFeedback: {
    type: String,
    trim: true
  },
  feedbackAt: Date,
  
  // Device and context
  deviceTypes: [{
    type: String,
    enum: ['desktop', 'mobile', 'tablet']
  }],
  locations: [{
    country: String,
    city: String,
    timezone: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound indexes
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
progressSchema.index({ userId: 1, status: 1 });
progressSchema.index({ courseId: 1, status: 1 });
progressSchema.index({ lastAccessedAt: -1 });
progressSchema.index({ progressPercentage: -1 });
progressSchema.index({ completedAt: -1 });

// Virtual for days since enrollment
progressSchema.virtual('daysSinceEnrollment').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.enrolledAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for completion speed (modules per day)
progressSchema.virtual('completionSpeed').get(function() {
  if (this.daysSinceEnrollment === 0) return 0;
  const completedModules = this.modulesProgress.filter(m => m.status === 'completed').length;
  return (completedModules / this.daysSinceEnrollment).toFixed(2);
});

// Virtual for quiz attempts count
progressSchema.virtual('quizAttemptsCount').get(function() {
  return this.quizAttempts ? this.quizAttempts.length : 0;
});

// Virtual for estimated completion date
progressSchema.virtual('estimatedCompletionDate').get(function() {
  if (this.progressPercentage === 0 || this.completionSpeed === 0) return null;
  
  const remainingProgress = 100 - this.progressPercentage;
  const daysToComplete = remainingProgress / (this.completionSpeed * 100);
  
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + Math.ceil(daysToComplete));
  
  return completionDate;
});

// Virtual for learning streak
progressSchema.virtual('learningStreak').get(function() {
  // This would need to be calculated based on daily activity
  // For now, return a placeholder
  return 0;
});

// Method to update module progress
progressSchema.methods.updateModuleProgress = async function(moduleId, updates) {
  let moduleProgress = this.modulesProgress.find(m => m.moduleId.toString() === moduleId.toString());
  
  if (!moduleProgress) {
    moduleProgress = { moduleId, ...updates };
    this.modulesProgress.push(moduleProgress);
  } else {
    Object.assign(moduleProgress, updates);
  }
  
  // Update last accessed time
  this.lastAccessedAt = new Date();
  
  // Recalculate overall progress
  await this.calculateOverallProgress();
  
  await this.save();
  return moduleProgress;
};

// Method to record quiz attempt
progressSchema.methods.recordQuizAttempt = async function(quizData) {
  const attemptNumber = this.quizAttempts.length + 1;
  
  const attempt = {
    attemptNumber,
    ...quizData
  };
  
  this.quizAttempts.push(attempt);
  
  // Update best score
  if (attempt.score > this.bestQuizScore) {
    this.bestQuizScore = attempt.score;
  }
  
  // Check if passed (assuming 70% is passing)
  const passingScore = 70; // This should come from course settings
  this.quizPassed = attempt.score >= passingScore;
  
  // Update last accessed time
  this.lastAccessedAt = new Date();
  
  await this.save();
  return attempt;
};

// Method to calculate overall progress
progressSchema.methods.calculateOverallProgress = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.courseId);
  
  if (!course || !course.modules) return;
  
  const totalModules = course.modules.length;
  const completedModules = this.modulesProgress.filter(m => m.status === 'completed').length;
  
  let progressPercentage = 0;
  
  if (totalModules > 0) {
    progressPercentage = (completedModules / totalModules) * 100;
    
    // If there's a quiz, it counts for 20% of the total progress
    if (course.quiz) {
      const moduleProgress = (completedModules / totalModules) * 80;
      const quizProgress = this.quizPassed ? 20 : 0;
      progressPercentage = moduleProgress + quizProgress;
    }
  }
  
  this.progressPercentage = Math.round(progressPercentage);
  
  // Update status based on progress
  if (this.progressPercentage === 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (this.progressPercentage > 0) {
    this.status = 'in-progress';
    if (!this.startedAt) {
      this.startedAt = new Date();
    }
  }
  
  return this.progressPercentage;
};

// Method to add learning session
progressSchema.methods.addLearningSession = async function(duration, deviceType = 'desktop') {
  this.totalTimeSpent += duration;
  this.sessionsCount += 1;
  this.averageSessionTime = Math.round(this.totalTimeSpent / this.sessionsCount);
  this.lastAccessedAt = new Date();
  
  // Track device type
  if (!this.deviceTypes.includes(deviceType)) {
    this.deviceTypes.push(deviceType);
  }
  
  // Track learning time patterns
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  
  let timePattern = this.preferredLearningTimes.find(t => 
    t.dayOfWeek === dayOfWeek && t.hour === hour
  );
  
  if (timePattern) {
    timePattern.duration += Math.round(duration / 60); // convert to minutes
  } else {
    this.preferredLearningTimes.push({
      dayOfWeek,
      hour,
      duration: Math.round(duration / 60)
    });
  }
  
  await this.save();
};

// Method to generate insights and recommendations
progressSchema.methods.generateInsights = async function() {
  const insights = {
    strugglingAreas: [],
    strongAreas: [],
    recommendations: []
  };
  
  // Analyze module progress for struggling areas
  for (const moduleProgress of this.modulesProgress) {
    if (moduleProgress.timeSpent > 3600 && moduleProgress.status !== 'completed') { // More than 1 hour
      insights.strugglingAreas.push({
        moduleId: moduleProgress.moduleId,
        reason: 'time_spent',
        severity: 'medium'
      });
    }
  }
  
  // Analyze quiz performance
  if (this.quizAttempts.length > 2 && !this.quizPassed) {
    insights.recommendations.push({
      type: 'review_module',
      message: 'Consider reviewing the course materials before retaking the quiz',
      priority: 'high'
    });
  }
  
  // Check for quick completions (strong areas)
  for (const moduleProgress of this.modulesProgress) {
    if (moduleProgress.status === 'completed' && moduleProgress.timeSpent < 300) { // Less than 5 minutes
      insights.strongAreas.push({
        moduleId: moduleProgress.moduleId,
        reason: 'quick_completion'
      });
    }
  }
  
  // Add recommendations to progress record
  this.recommendations.push(...insights.recommendations);
  this.strugglingAreas = insights.strugglingAreas;
  this.strongAreas = insights.strongAreas;
  
  await this.save();
  return insights;
};

// Static method to get user's overall learning analytics
progressSchema.statics.getUserAnalytics = async function(userId, timeframe = '30d') {
  const timeframeMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };
  
  const daysBack = timeframeMap[timeframe] || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  const analytics = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        lastAccessedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        completedCourses: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalTimeSpent: { $sum: '$totalTimeSpent' },
        averageProgress: { $avg: '$progressPercentage' },
        totalSessions: { $sum: '$sessionsCount' },
        averageQuizScore: { $avg: '$bestQuizScore' }
      }
    }
  ]);
  
  return analytics[0] || {};
};

// Static method to get course analytics
progressSchema.statics.getCourseAnalytics = async function(courseId) {
  const analytics = await this.aggregate([
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId)
      }
    },
    {
      $group: {
        _id: null,
        totalEnrollments: { $sum: 1 },
        completions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageProgress: { $avg: '$progressPercentage' },
        averageTimeSpent: { $avg: '$totalTimeSpent' },
        averageQuizScore: { $avg: '$bestQuizScore' },
        completionRate: {
          $multiply: [
            { $divide: [
              { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
              { $sum: 1 }
            ]},
            100
          ]
        }
      }
    }
  ]);
  
  return analytics[0] || {};
};

// Method to mark course as completed
progressSchema.methods.markCompleted = async function() {
  this.status = 'completed';
  this.progressPercentage = 100;
  this.completedAt = new Date();
  
  await this.save();
  return this;
};

export default mongoose.model('Progress', progressSchema);