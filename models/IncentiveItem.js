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
  Sub_category: {
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
  incentive_value: {
    type: Number,
    min: [0, 'Incentive value must be a positive number'],
  },
  activeIngredients: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

// Index for faster search
// Note: SAP_Code index is automatically created by unique: true
incentiveItemSchema.index({ Description: 'text' });
incentiveItemSchema.index({ Category: 1 });
incentiveItemSchema.index({ Sub_category: 1 });
incentiveItemSchema.index({ activeIngredients: 1 });
// Indexes for sorting performance
incentiveItemSchema.index({ Price: 1 });
incentiveItemSchema.index({ incentive_value: 1 });
incentiveItemSchema.index({ createdAt: -1 });

const IncentiveItem = mongoose.model('IncentiveItem', incentiveItemSchema);

export default IncentiveItem;
