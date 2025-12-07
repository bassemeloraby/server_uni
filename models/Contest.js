import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
  Company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true,
  },
  SAP_Code: {
    type: Number,
    required: [true, 'SAP Code is required'],
  },
  'WH Description': {
    type: String,
    trim: true,
  },
  'Total Incentive': {
    type: Number,
    default: 0,
    min: [0, 'Total Incentive must be a positive number'],
  },
  Category: {
    type: String,
    trim: true,
  },
  Price: {
    type: Number,
    min: [0, 'Price must be a positive number'],
  },
  Incentive: {
    type: Number,
    min: [0, 'Incentive must be a positive number'],
  },
}, {
  timestamps: true,
});

// Index for faster search
contestSchema.index({ Company: 'text', 'WH Description': 'text' });
contestSchema.index({ SAP_Code: 1 });
contestSchema.index({ Category: 1 });

const Contest = mongoose.model('Contest', contestSchema);

export default Contest;
