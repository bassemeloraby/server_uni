import express from 'express';
import cors from 'cors';
import colors from 'colors';



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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.cyan.bold);
  console.log(`API URL: http://localhost:${PORT}`.yellow.bold);
}); 