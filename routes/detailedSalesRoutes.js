import express from 'express';
import {
  getDetailedSales,
  getDetailedSale,
  createDetailedSale,
  createBulkDetailedSales,
  updateDetailedSale,
  deleteDetailedSale,
  getSalesStatistics,
} from '../controllers/detailedSalesController.js';

const router = express.Router();

// Statistics route (must come before :id route)
router.route('/stats/summary')
  .get(getSalesStatistics);

// Bulk create route (must come before generic routes)
router.route('/bulk')
  .post(createBulkDetailedSales);

// Routes
router.route('/')
  .get(getDetailedSales)
  .post(createDetailedSale);

router.route('/:id')
  .get(getDetailedSale)
  .put(updateDetailedSale)
  .delete(deleteDetailedSale);

export default router;

