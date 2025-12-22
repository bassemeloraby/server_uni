import mongoose from 'mongoose';

const insuranceItemSchema = new mongoose.Schema({
  Category: {
    type: String,
    trim: true,
  },
  SAP_Code: {
    type: Number,
    required: [true, 'SAP Code is required'],
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for faster search
insuranceItemSchema.index({ SAP_Code: 1 });
insuranceItemSchema.index({ Category: 1 });
insuranceItemSchema.index({ description: 'text' });

const InsuranceItem = mongoose.model('InsuranceItem', insuranceItemSchema);

export default InsuranceItem;






