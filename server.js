import express from 'express';
import cors from 'cors';
import colors from 'colors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import incentiveItemRoutes from './routes/incentiveItemRoutes.js';
import insuranceItemRoutes from './routes/insuranceItemRoutes.js';
import contestRoutes from './routes/contestRoutes.js';
import headerSalesRoutes from './routes/headerSalesRoutes.js';
import visitRoutes from './routes/visitRoutes.js';
import babyJoyRoutes from './routes/babyJoyRoutes.js';

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

// API Routes
app.use("/api/pharmacies", pharmacyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/incentive-items", incentiveItemRoutes);
app.use("/api/insurance-items", insuranceItemRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/header-sales", headerSalesRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/baby-joy", babyJoyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:".red.bold, err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});


// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.cyan.bold);
  console.log(`API URL: http://localhost:${PORT}`.yellow.bold);
}); 