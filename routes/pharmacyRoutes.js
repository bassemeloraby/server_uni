import express from 'express';
import {
  getPharmacies,
  getPharmacy,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
  addPharmacist,
  removePharmacist,
} from '../controllers/pharmacyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getPharmacies)
  .post(createPharmacy);

// More specific routes must come before generic :id route
router.route('/:id/pharmacists/:pharmacistId')
  .delete(removePharmacist);

router.route('/:id/pharmacists')
  .post(addPharmacist);

router.route('/:id')
  .get(getPharmacy)
  .put(updatePharmacy)
  .delete(deletePharmacy);

export default router;

