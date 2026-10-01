const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null
  },
  name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true,
    maxlength: [200, 'Exam name must not exceed 200 characters']
  },
  examDate: {
    type: Date,
    required: [true, 'Exam date is required']
  },
  examTime: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  preparationStatus: {
    type: String,
    enum: ['not-started', 'preparing', 'ready'],
    default: 'not-started'
  },
  notes: {
    type: String,
    default: ''
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  obtainedMarks: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);
