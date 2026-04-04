const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide question title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide question description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    enum: ['Technical', 'Behavioral', 'System Design']
  },
  difficulty: {
    type: String,
    required: [true, 'Please provide difficulty level'],
    enum: ['Easy', 'Medium', 'Hard']
  },
  sampleAnswer: {
    type: String,
    trim: true
  },
  answer: {
    type: String,
    trim: true
  },
  explanation: {
    type: String,
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

questionSchema.index({ category: 1, difficulty: 1 });
questionSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Question', questionSchema);