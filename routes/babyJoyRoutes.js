import express from 'express';
import {
  getBabyJoyItems,
  getBabyJoyItem,
  createBabyJoyItem,
  updateBabyJoyItem,
  deleteBabyJoyItem,
  bulkCreateBabyJoyItems,
  getBabyJoyFilters,
} from '../controllers/babyJoyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getBabyJoyItems)
  .post(createBabyJoyItem);

router.route('/filters')
  .get(getBabyJoyFilters);

router.route('/bulk')
  .post(bulkCreateBabyJoyItems);

router.route('/:id')
  .get(getBabyJoyItem)
  .put(updateBabyJoyItem)
  .delete(deleteBabyJoyItem);

export default router;

