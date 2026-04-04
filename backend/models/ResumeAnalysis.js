const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  extractedText: {
    type: String,
    required: true
  },
  identifiedSkills: [{
    type: String,
    trim: true
  }],
  targetRole: {
    type: String,
    required: true,
    trim: true
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  matchPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  missingSkills: [{
    type: String,
    trim: true
  }],
  recommendations: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);