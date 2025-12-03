import express from 'express';
import {
  getDetailedSales,
  getDetailedSale,
  createDetailedSale,
  createBulkDetailedSales,
  updateDetailedSale,
  deleteDetailedSale,
  getSalesStatistics,
  getPharmaciesByBranchCode,
  getSalesBySalesName,
} from '../controllers/detailedSalesController.js';

const router = express.Router();

// Statistics routes (must come before :id route)
router.route('/stats/summary')
  .get(getSalesStatistics);

router.route('/stats/pharmacies-by-branch')
  .get(getPharmaciesByBranchCode);

router.route('/stats/sales-by-name')
  .get(getSalesBySalesName);

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

