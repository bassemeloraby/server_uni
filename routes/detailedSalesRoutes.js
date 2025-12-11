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
  getSalesByInvoiceType,
  getSalesByMonth,
  getSalesByDay,
  getSalesByCustomerName,
} from '../controllers/detailedSalesController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Statistics routes (must come before :id route)
router.route('/stats/summary')
  .get(getSalesStatistics);

router.route('/stats/pharmacies-by-branch')
  .get(getPharmaciesByBranchCode);

router.route('/stats/sales-by-name')
  .get(getSalesBySalesName);

router.route('/stats/sales-by-invoice-type')
  .get(getSalesByInvoiceType);

router.route('/stats/sales-by-month')
  .get(getSalesByMonth);

router.route('/stats/sales-by-day')
  .get(getSalesByDay);

router.route('/stats/sales-by-customer-name')
  .get(getSalesByCustomerName);

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

