import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB'.green.bold);
  } catch (error) {
    console.error('MongoDB connection error:'.red.bold, error);
    process.exit(1);
  }
};

export default connectDB;

