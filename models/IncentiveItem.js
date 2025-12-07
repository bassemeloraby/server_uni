import mongoose from 'mongoose';

const incentiveItemSchema = new mongoose.Schema({
  Class: {
    type: String,
    trim: true,
  },
  SAP_Code: {
    type: Number,
    required: [true, 'SAP Code is required'],
    unique: true,
  },
  form: {
    type: String,
    trim: true,
  },
  form_category: {
    type: String,
    trim: true,
  },
  Description: {
    type: String,
    trim: true,
  },
  Division: {
    type: String,
    trim: true,
  },
  Category: {
    type: String,
    trim: true,
  },
  'Sub category': {
    type: String,
    trim: true,
  },
  Price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number'],
  },
  IncentivePercentage: {
    type: Number,
    min: [0, 'Incentive percentage must be a positive number'],
    max: [1, 'Incentive percentage cannot exceed 1'],
  },
  'incentive value': {
    type: Number,
    min: [0, 'Incentive value must be a positive number'],
  },
}, {
  timestamps: true,
});

// Index for faster search
// Note: SAP_Code index is automatically created by unique: true
incentiveItemSchema.index({ Description: 'text' });
incentiveItemSchema.index({ Category: 1 });
incentiveItemSchema.index({ 'Sub category': 1 });

const IncentiveItem = mongoose.model('IncentiveItem', incentiveItemSchema);

export default IncentiveItem;
