import mongoose from 'mongoose';

const pharmacySchema = new mongoose.Schema({
  branchCode: {
    type: Number,
    required: [true, 'Branch code is required'],
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Pharmacy name is required'],
    trim: true,
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: 'Egypt',
      trim: true,
    },
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  workingHours: {
    open: {
      type: String,
      default: '09:00',
    },
    close: {
      type: String,
      default: '22:00',
    },
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    }],
  },
  location: {
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    trim: true,
  },
  pharmacists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index for faster search
pharmacySchema.index({ name: 'text', 'address.city': 'text' });
pharmacySchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
// Note: branchCode index is automatically created by unique: true constraint

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

export default Pharmacy;

