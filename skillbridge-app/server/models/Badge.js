import mongoose from 'mongoose';

const criteriaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['course_completion', 'skill_level', 'gig_completion', 'rating_threshold', 'xp_threshold', 'streak', 'custom'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can be number, string, or object
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, { _id: false });

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    trim: true,
    maxlength: [50, 'Badge name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Badge description is required'],
    trim: true,
    maxlength: [200, 'Badge description cannot exceed 200 characters']
  },
  
  // Visual representation
  icon: {
    type: String,
    required: [true, 'Badge icon is required'],
    trim: true
  },
  color: {
    primary: {
      type: String,
      default: '#3B82F6' // Blue
    },
    secondary: {
      type: String,
      default: '#1E40AF' // Darker blue
    },
    accent: {
      type: String,
      default: '#FCD34D' // Gold
    }
  },
  shape: {
    type: String,
    enum: ['circle', 'shield', 'star', 'hexagon', 'diamond', 'square'],
    default: 'circle'
  },
  
  // Badge metadata
  category: {
    type: String,
    required: [true, 'Badge category is required'],
    enum: [
      'skill', 'achievement', 'milestone', 'completion', 'excellence',
      'participation', 'leadership', 'community', 'special', 'seasonal'
    ]
  },
  skillTag: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Badge properties
  type: {
    type: String,
    enum: ['automatic', 'manual', 'application-based'],
    default: 'automatic'
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  level: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },
  
  // Earning criteria
  criteria: [criteriaSchema],
  
  // Requirements and restrictions
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  
  // Rewards
  xpReward: {
    type: Number,
    default: 100,
    min: 0
  },
  privileges: [{
    type: String,
    enum: ['early_access', 'special_gigs', 'course_discount', 'priority_support', 'mentor_access']
  }],
  
  // Visibility and availability
  isActive: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  availableFrom: {
    type: Date,
    default: Date.now
  },
  availableUntil: {
    type: Date
  },
  
  // Analytics
  earnedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Related content
  relatedCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  relatedSkills: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Badge series/collection
  series: {
    name: String,
    order: Number,
    totalInSeries: Number
  },
  
  // Creation and management
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Localization
  translations: [{
    language: {
      type: String,
      required: true
    },
    name: String,
    description: String
  }],
  
  // Custom properties for special badges
  customProperties: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
badgeSchema.index({ category: 1, isActive: 1 });
badgeSchema.index({ skillTag: 1, isActive: 1 });
badgeSchema.index({ rarity: 1, level: 1 });
badgeSchema.index({ 'series.name': 1, 'series.order': 1 });
badgeSchema.index({ earnedCount: -1 });
badgeSchema.index({ createdBy: 1 });

// Text search index
badgeSchema.index({ 
  name: 'text', 
  description: 'text',
  skillTag: 'text',
  relatedSkills: 'text'
});

// Virtual for rarity score (for sorting/filtering)
badgeSchema.virtual('rarityScore').get(function() {
  const scores = {
    'common': 1,
    'uncommon': 2,
    'rare': 3,
    'epic': 4,
    'legendary': 5
  };
  return scores[this.rarity] || 1;
});

// Virtual for achievement rate
badgeSchema.virtual('achievementRate').get(function() {
  // This would require knowing total eligible users
  // For now, return a placeholder calculation
  return Math.max(0, Math.min(100, (this.earnedCount / 1000) * 100));
});

// Virtual for display name with level
badgeSchema.virtual('displayName').get(function() {
  if (this.level > 1) {
    return `${this.name} (Level ${this.level})`;
  }
  return this.name;
});

// Virtual for CSS color variables
badgeSchema.virtual('cssColors').get(function() {
  return {
    '--badge-primary': this.color.primary,
    '--badge-secondary': this.color.secondary,
    '--badge-accent': this.color.accent
  };
});

// Method to check if user meets criteria
badgeSchema.methods.checkEligibility = async function(user) {
  if (!this.isActive) return { eligible: false, reason: 'Badge is not active' };
  
  // Check availability period
  const now = new Date();
  if (this.availableFrom > now) {
    return { eligible: false, reason: 'Badge not yet available' };
  }
  if (this.availableUntil && this.availableUntil < now) {
    return { eligible: false, reason: 'Badge availability has expired' };
  }
  
  // Check prerequisites
  if (this.prerequisites.length > 0) {
    const userBadges = user.badges.map(b => b.badgeId.toString());
    const hasAllPrerequisites = this.prerequisites.every(prereq => 
      userBadges.includes(prereq.toString())
    );
    
    if (!hasAllPrerequisites) {
      return { eligible: false, reason: 'Prerequisites not met' };
    }
  }
  
  // Check if user already has this badge
  const alreadyHas = user.badges.some(b => b.badgeId.toString() === this._id.toString());
  if (alreadyHas) {
    return { eligible: false, reason: 'Badge already earned' };
  }
  
  // Check each criterion
  for (const criterion of this.criteria) {
    const meetsThis = await this.checkCriterion(user, criterion);
    if (!meetsThis.meets) {
      return { eligible: false, reason: meetsThis.reason, progress: meetsThis.progress };
    }
  }
  
  return { eligible: true };
};

// Method to check individual criterion
badgeSchema.methods.checkCriterion = async function(user, criterion) {
  switch (criterion.type) {
    case 'course_completion':
      if (typeof criterion.value === 'string') {
        // Specific course
        const completed = user.enrolledCourses.find(c => 
          c.courseId.toString() === criterion.value && c.completed
        );
        return { 
          meets: !!completed, 
          reason: completed ? 'Course completed' : 'Course not completed',
          progress: completed ? 100 : 0
        };
      } else if (typeof criterion.value === 'number') {
        // Number of courses
        const completedCount = user.enrolledCourses.filter(c => c.completed).length;
        return {
          meets: completedCount >= criterion.value,
          reason: `${completedCount}/${criterion.value} courses completed`,
          progress: Math.min((completedCount / criterion.value) * 100, 100)
        };
      }
      break;
      
    case 'skill_level':
      const skill = user.skills.find(s => s.name.toLowerCase() === criterion.value.name.toLowerCase());
      const requiredLevel = criterion.value.level;
      const levelOrder = ['beginner', 'intermediate', 'advanced'];
      const userLevelIndex = skill ? levelOrder.indexOf(skill.level) : -1;
      const requiredLevelIndex = levelOrder.indexOf(requiredLevel);
      
      return {
        meets: userLevelIndex >= requiredLevelIndex,
        reason: `Skill level: ${skill?.level || 'none'}, required: ${requiredLevel}`,
        progress: userLevelIndex >= 0 ? ((userLevelIndex + 1) / (requiredLevelIndex + 1)) * 100 : 0
      };
      
    case 'gig_completion':
      return {
        meets: user.gigsCompleted >= criterion.value,
        reason: `${user.gigsCompleted}/${criterion.value} gigs completed`,
        progress: Math.min((user.gigsCompleted / criterion.value) * 100, 100)
      };
      
    case 'rating_threshold':
      return {
        meets: user.rating.average >= criterion.value,
        reason: `Rating: ${user.rating.average.toFixed(1)}/${criterion.value}`,
        progress: Math.min((user.rating.average / criterion.value) * 100, 100)
      };
      
    case 'xp_threshold':
      return {
        meets: user.xp >= criterion.value,
        reason: `XP: ${user.xp}/${criterion.value}`,
        progress: Math.min((user.xp / criterion.value) * 100, 100)
      };
      
    case 'streak':
      return {
        meets: user.streak.current >= criterion.value,
        reason: `Streak: ${user.streak.current}/${criterion.value} days`,
        progress: Math.min((user.streak.current / criterion.value) * 100, 100)
      };
      
    default:
      return { meets: false, reason: 'Unknown criterion type', progress: 0 };
  }
  
  return { meets: false, reason: 'Criterion check failed', progress: 0 };
};

// Method to award badge to user
badgeSchema.methods.awardToUser = async function(user, courseId = null) {
  const eligibility = await this.checkEligibility(user);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason);
  }
  
  // Add badge to user
  await user.addBadge(this._id, courseId);
  
  // Award XP
  if (this.xpReward > 0) {
    await user.addXP(this.xpReward, `Badge earned: ${this.name}`);
  }
  
  // Increment earned count
  this.earnedCount += 1;
  await this.save();
  
  return { success: true, xpAwarded: this.xpReward };
};

// Static method to find badges by category
badgeSchema.statics.findByCategory = function(category, includeInactive = false) {
  const query = { category };
  if (!includeInactive) {
    query.isActive = true;
  }
  
  return this.find(query)
    .sort({ level: 1, earnedCount: -1 })
    .populate('relatedCourse', 'title thumbnail')
    .populate('prerequisites', 'name icon');
};

// Static method to find badges by skill
badgeSchema.statics.findBySkill = function(skillTag, includeInactive = false) {
  const query = { 
    $or: [
      { skillTag: skillTag.toLowerCase() },
      { relatedSkills: { $in: [skillTag.toLowerCase()] } }
    ]
  };
  
  if (!includeInactive) {
    query.isActive = true;
  }
  
  return this.find(query)
    .sort({ level: 1, earnedCount: -1 })
    .populate('relatedCourse', 'title thumbnail')
    .populate('prerequisites', 'name icon');
};

// Static method to get featured badges
badgeSchema.statics.getFeatured = function(limit = 6) {
  return this.find({ 
    isActive: true, 
    isVisible: true,
    rarity: { $in: ['rare', 'epic', 'legendary'] }
  })
    .sort({ rarityScore: -1, earnedCount: 1 })
    .limit(limit)
    .populate('relatedCourse', 'title thumbnail');
};

// Static method to search badges
badgeSchema.statics.searchBadges = function(query, filters = {}) {
  const searchCriteria = {
    isActive: true,
    isVisible: true,
    ...filters
  };
  
  if (query) {
    searchCriteria.$text = { $search: query };
  }
  
  return this.find(searchCriteria)
    .sort(query ? { score: { $meta: 'textScore' } } : { earnedCount: -1 })
    .populate('relatedCourse', 'title thumbnail')
    .populate('prerequisites', 'name icon');
};

// Static method to get user's next badges (recommendations)
badgeSchema.statics.getRecommendedForUser = async function(user, limit = 5) {
  // Get badges user doesn't have yet
  const userBadgeIds = user.badges.map(b => b.badgeId.toString());
  
  const recommendations = await this.find({
    _id: { $nin: userBadgeIds },
    isActive: true,
    isVisible: true
  })
    .populate('relatedCourse', 'title thumbnail')
    .populate('prerequisites', 'name icon');
  
  // Check eligibility and progress for each badge
  const badgesWithProgress = [];
  
  for (const badge of recommendations) {
    const eligibility = await badge.checkEligibility(user);
    
    if (eligibility.eligible) {
      badgesWithProgress.push({ badge, progress: 100, eligible: true });
    } else if (eligibility.progress !== undefined) {
      badgesWithProgress.push({ 
        badge, 
        progress: eligibility.progress, 
        eligible: false,
        reason: eligibility.reason 
      });
    }
  }
  
  // Sort by progress (closest to completion first)
  badgesWithProgress.sort((a, b) => b.progress - a.progress);
  
  return badgesWithProgress.slice(0, limit);
};

// Method to increment view count
badgeSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  await this.save({ validateBeforeSave: false });
  return this.viewCount;
};

export default mongoose.model('Badge', badgeSchema);