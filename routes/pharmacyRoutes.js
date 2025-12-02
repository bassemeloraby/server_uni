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

const router = express.Router();

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

