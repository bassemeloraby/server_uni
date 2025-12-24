import mongoose from 'mongoose';

const babyJoySchema = new mongoose.Schema({
  Material: {
    type: Number,
    required: [true, 'Material code is required'],
    unique: true,
  },
  SapDescription: {
    type: String,
    trim: true,
    required: [true, 'SAP Description is required'],
  },
  Brand: {
    type: String,
    trim: true,
    default: 'Baby Joy',
  },
  Price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number'],
  },
  MaterialDetail: {
    type: String,
    trim: true,
  },
  UnitsInCartoon: {
    type: Number,
    min: [0, 'Units in Cartoon must be a positive number'],
  },
  NumberOfBacket: {
    type: Number,
    min: [0, 'Number of backet must be a positive number'],
  },
  Form: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for faster search
babyJoySchema.index({ Material: 1 });
babyJoySchema.index({ SapDescription: 'text' });
babyJoySchema.index({ Brand: 1 });
babyJoySchema.index({ Form: 1 });
babyJoySchema.index({ Price: 1 });
babyJoySchema.index({ createdAt: -1 });

const BabyJoy = mongoose.model('BabyJoy', babyJoySchema);

export default BabyJoy;

