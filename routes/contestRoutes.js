import express from 'express';
import {
  getContests,
  getContest,
  createContest,
  updateContest,
  deleteContest,
  bulkCreateContests,
} from '../controllers/contestController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getContests)
  .post(createContest);

router.route('/bulk')
  .post(bulkCreateContests);

router.route('/:id')
  .get(getContest)
  .put(updateContest)
  .delete(deleteContest);

export default router;
