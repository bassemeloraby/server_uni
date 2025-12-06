import express from 'express';
import {
  getIncentiveItems,
  getIncentiveItem,
  createIncentiveItem,
  updateIncentiveItem,
  deleteIncentiveItem,
  bulkCreateIncentiveItems,
} from '../controllers/incentiveItemController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getIncentiveItems)
  .post(createIncentiveItem);

router.route('/bulk')
  .post(bulkCreateIncentiveItems);

router.route('/:id')
  .get(getIncentiveItem)
  .put(updateIncentiveItem)
  .delete(deleteIncentiveItem);

export default router;
