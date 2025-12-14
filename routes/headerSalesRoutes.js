import express from 'express';
import {
  getHeaderSales,
  getHeaderSale,
  createHeaderSale,
  updateHeaderSale,
  deleteHeaderSale,
  bulkCreateHeaderSales,
} from '../controllers/headerSalesController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getHeaderSales)
  .post(createHeaderSale);

router.route('/bulk')
  .post(bulkCreateHeaderSales);

router.route('/:id')
  .get(getHeaderSale)
  .put(updateHeaderSale)
  .delete(deleteHeaderSale);

export default router;

