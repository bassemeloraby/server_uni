import express from 'express';
import {
  getDetailedSales,
  getDetailedSale,
  createDetailedSale,
  createBulkDetailedSales,
  updateDetailedSale,
  deleteDetailedSale,
  getInsuranceSales,
  getInsuranceSalesByCustomer,
} from '../controllers/detailedSalesController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Bulk create route (must come before generic routes)
router.route('/bulk')
  .post(createBulkDetailedSales);

// Insurance sales routes (must come before generic routes)
router.route('/insurance')
  .get(getInsuranceSales);

router.route('/insurance/by-customer')
  .get(getInsuranceSalesByCustomer);

// Routes
router.route('/')
  .get(getDetailedSales)
  .post(createDetailedSale);

router.route('/:id')
  .get(getDetailedSale)
  .put(updateDetailedSale)
  .delete(deleteDetailedSale);

export default router;

