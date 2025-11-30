import Pharmacy from '../models/Pharmacy.js';
import colors from 'colors';

// @desc    Get all pharmacies
// @route   GET /api/pharmacies
// @access  Public
export const getPharmacies = async (req, res) => {
  try {
    const { city, isActive, search } = req.query;
    
    // Build query object
    const query = {};
    
    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const pharmacies = await Pharmacy.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies,
    });
  } catch (error) {
    console.error('Error fetching pharmacies:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacies',
      error: error.message,
    });
  }
};

// @desc    Get single pharmacy
// @route   GET /api/pharmacies/:id
// @access  Public
export const getPharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: pharmacy,
    });
  } catch (error) {
    console.error('Error fetching pharmacy:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacy',
      error: error.message,
    });
  }
};

// @desc    Create new pharmacy
// @route   POST /api/pharmacies
// @access  Public
export const createPharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.create(req.body);
    
    res.status(201).json({
      success: true,
      data: pharmacy,
    });
  } catch (error) {
    console.error('Error creating pharmacy:'.red, error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating pharmacy',
      error: error.message,
    });
  }
};

// @desc    Update pharmacy
// @route   PUT /api/pharmacies/:id
// @access  Public
export const updatePharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: pharmacy,
    });
  } catch (error) {
    console.error('Error updating pharmacy:'.red, error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating pharmacy',
      error: error.message,
    });
  }
};

// @desc    Delete pharmacy
// @route   DELETE /api/pharmacies/:id
// @access  Public
export const deletePharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndDelete(req.params.id);
    
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Pharmacy deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting pharmacy:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pharmacy',
      error: error.message,
    });
  }
};

