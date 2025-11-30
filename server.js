import express from 'express';
import cors from 'cors';
import colors from 'colors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to UNI API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:".red.bold, err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'.green.bold))
  .catch((err) => console.error('MongoDB connection error:'.red.bold, err));


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.cyan.bold);
  console.log(`API URL: http://localhost:${PORT}`.yellow.bold);
}); 