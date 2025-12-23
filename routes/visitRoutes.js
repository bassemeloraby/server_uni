import express from 'express';
import {
  createVisit,
  getVisits,
  getVisitStats,
} from '../controllers/visitController.js';
import { protect } from '../middleware/auth.js';
import { admin } from '../middleware/admin.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create visit (can be called by any authenticated user)
router.post('/', createVisit);

// Get visits and stats (admin only)
router.get('/stats', admin, getVisitStats);
router.get('/', admin, getVisits);

export default router;

