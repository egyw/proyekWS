const mongoose = require("mongoose");

const failedLoginAttemptSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  timestamps: {
    type: [Date],
    default: [],
  },
  lockUntil: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('FailedLoginAttempt', failedLoginAttemptSchema, 'failedLoginAttempts');