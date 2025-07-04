import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['learner', 'business', 'admin'],
    default: 'learner'
  },
  age: {
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age cannot exceed 120']
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0], // [longitude, latitude]
      validate: {
        validator: function(arr) {
          return arr.length === 2;
        },
        message: 'Coordinates must contain exactly 2 values: [longitude, latitude]'
      }
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'Kenya'
    }
  },
  
  // Learner-specific fields
  skills: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    verified: { type: Boolean, default: false },
    earnedAt: { type: Date, default: Date.now }
  }],
  
  badges: [{
    badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
    earnedAt: { type: Date, default: Date.now },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }
  }],
  
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  
  gigsCompleted: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 }
  },
  
  // Business-specific fields
  businessName: {
    type: String,
    trim: true
  },
  
  businessType: {
    type: String,
    enum: ['restaurant', 'retail', 'services', 'technology', 'healthcare', 'education', 'agriculture', 'construction', 'other']
  },
  
  businessDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Business description cannot exceed 500 characters']
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  // Learning progress
  enrolledCourses: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    enrolledAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastAccessedAt: { type: Date, default: Date.now }
  }],
  
  // Gig history
  gigHistory: [{
    gigId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' },
    status: { type: String, enum: ['applied', 'accepted', 'completed', 'cancelled'], required: true },
    appliedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    earnings: { type: Number, default: 0 }
  }],
  
  // Preferences
  preferences: {
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: true },
    smsUpdates: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'KES' },
    availabilityRadius: { type: Number, default: 10 } // in kilometers
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date
  },
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Email verification
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  // Achievement tracking
  achievements: [{
    name: String,
    description: String,
    iconUrl: String,
    earnedAt: { type: Date, default: Date.now },
    xpReward: { type: Number, default: 0 }
  }],
  
  // Streak tracking
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivityDate: { type: Date }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });

// Create compound indexes for performance
userSchema.index({ role: 1, 'location.coordinates': '2dsphere' });
userSchema.index({ xp: -1 });
userSchema.index({ 'rating.average': -1 });
userSchema.index({ level: -1 });
userSchema.index({ email: 1 });
userSchema.index({ 'skills.name': 1 });

// Virtual for full profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  let completion = 0;
  const fields = ['name', 'email', 'phone', 'location.address', 'avatar'];
  
  fields.forEach(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (this[parent] && this[parent][child]) completion += 20;
    } else {
      if (this[field]) completion += 20;
    }
  });
  
  return Math.min(completion, 100);
});

// Virtual for next level XP requirement
userSchema.virtual('nextLevelXP').get(function() {
  return this.level * 1000; // 1000 XP per level
});

// Virtual for XP progress to next level
userSchema.virtual('xpProgress').get(function() {
  const currentLevelXP = (this.level - 1) * 1000;
  const nextLevelXP = this.level * 1000;
  const progressXP = this.xp - currentLevelXP;
  const levelRange = nextLevelXP - currentLevelXP;
  return Math.min((progressXP / levelRange) * 100, 100);
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update last login on save
userSchema.pre('save', function(next) {
  if (this.isModified('lastLogin')) {
    this.lastLogin = new Date();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update level based on XP
userSchema.methods.updateLevel = function() {
  const newLevel = Math.floor(this.xp / 1000) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    return true; // Level up occurred
  }
  return false;
};

// Add XP and update level
userSchema.methods.addXP = async function(xpAmount, reason = 'General activity') {
  this.xp += xpAmount;
  const leveledUp = this.updateLevel();
  
  // Update streak if activity is course completion or gig completion
  if (reason.includes('course') || reason.includes('gig')) {
    this.updateStreak();
  }
  
  await this.save();
  return { newXP: this.xp, newLevel: this.level, leveledUp, xpAdded: xpAmount };
};

// Update rating
userSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = Math.round((totalRating / this.rating.count) * 10) / 10; // Round to 1 decimal
  return this.rating.average;
};

// Update streak
userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActivity = this.streak.lastActivityDate;
  
  if (!lastActivity) {
    this.streak.current = 1;
    this.streak.lastActivityDate = today;
  } else {
    const diffTime = Math.abs(today - lastActivity);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      this.streak.current += 1;
      if (this.streak.current > this.streak.longest) {
        this.streak.longest = this.streak.current;
      }
    } else if (diffDays > 1) {
      // Streak broken
      this.streak.current = 1;
    }
    // If diffDays === 0, same day activity, don't change streak
    
    this.streak.lastActivityDate = today;
  }
};

// Add badge
userSchema.methods.addBadge = async function(badgeId, courseId = null) {
  const existingBadge = this.badges.find(b => 
    b.badgeId.toString() === badgeId.toString() && 
    (!courseId || b.courseId?.toString() === courseId.toString())
  );
  
  if (!existingBadge) {
    this.badges.push({ badgeId, courseId });
    await this.save();
    return true;
  }
  return false;
};

// Get nearby users (for networking/collaboration)
userSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: maxDistance // in meters
      }
    },
    isActive: true
  });
};

export default mongoose.model('User', userSchema);