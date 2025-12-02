import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    unique: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'pharmacist'],
    default: 'user',
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  whatsapp: {
    type: String,
    trim: true,
  },
  address: {
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
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
  isActive: {
    type: Boolean,
    default: true,
  },
  profilePicture: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for faster search
userSchema.index({ username: 'text', email: 'text', firstName: 'text', lastName: 'text' });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

const User = mongoose.model('User', userSchema);

export default User;

