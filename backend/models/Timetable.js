const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: [{
    day: {
      type: String,
      required: true
    },
    slots: [{
      startTime: String,
      endTime: String,
      subject: String,
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      room: String,
      class: String
    }]
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
timetableSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Timetable', timetableSchema); 