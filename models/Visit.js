import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  path: {
    type: String,
    required: true,
    trim: true,
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    default: 'GET',
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
  referer: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
visitSchema.index({ user: 1, createdAt: -1 });
visitSchema.index({ path: 1, createdAt: -1 });
visitSchema.index({ createdAt: -1 });

const Visit = mongoose.model('Visit', visitSchema);

export default Visit;

