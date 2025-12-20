import express from 'express';
import {
  getInsuranceItems,
  getInsuranceItem,
  createInsuranceItem,
  updateInsuranceItem,
  deleteInsuranceItem,
  bulkCreateInsuranceItems,
} from '../controllers/insuranceItemController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getInsuranceItems)
  .post(createInsuranceItem);

router.route('/bulk')
  .post(bulkCreateInsuranceItems);

router.route('/:id')
  .get(getInsuranceItem)
  .put(updateInsuranceItem)
  .delete(deleteInsuranceItem);

export default router;

