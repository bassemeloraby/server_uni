import express from 'express';
import {
  getPharmacies,
  getPharmacy,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
} from '../controllers/pharmacyController.js';

const router = express.Router();

// Routes
router.route('/')
  .get(getPharmacies)
  .post(createPharmacy);

router.route('/:id')
  .get(getPharmacy)
  .put(updatePharmacy)
  .delete(deletePharmacy);

export default router;

