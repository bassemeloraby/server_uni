import express from 'express';
import {
  login,
  getMe,
} from '../controllers/authController.js';

const router = express.Router();

// Routes
router.post('/login', login);
router.get('/me', getMe);

export default router;

