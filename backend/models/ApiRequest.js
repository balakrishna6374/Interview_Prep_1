const mongoose = require('mongoose');

const apiRequestSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  statusCode: {
    type: Number,
    required: true
  },
  responseTime: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  interviewType: {
    type: String,
    enum: ['general', 'resume', 'job', null],
    default: null
  }
});

apiRequestSchema.index({ timestamp: -1 });
apiRequestSchema.index({ endpoint: 1, timestamp: -1 });

module.exports = mongoose.model('ApiRequest', apiRequestSchema);
