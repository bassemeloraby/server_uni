import express from 'express';
import {
  getHeaderSales,
  getHeaderSale,
  createHeaderSale,
  updateHeaderSale,
  deleteHeaderSale,
  bulkCreateHeaderSales,
  getHeaderSalesByMonth,
  getCashHeaderSalesByMonth,
  getInsuranceHeaderSalesByMonth,
  getWasfatyHeaderSalesByMonth,
  getOnlineHeaderSalesByMonth,
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

router.route('/by-month')
  .get(getHeaderSalesByMonth);

router.route('/cash-by-month')
  .get(getCashHeaderSalesByMonth);

router.route('/insurance-by-month')
  .get(getInsuranceHeaderSalesByMonth);

router.route('/wasfaty-by-month')
  .get(getWasfatyHeaderSalesByMonth);

router.route('/online-by-month')
  .get(getOnlineHeaderSalesByMonth);

router.route('/:id')
  .get(getHeaderSale)
  .put(updateHeaderSale)
  .delete(deleteHeaderSale);

export default router;

