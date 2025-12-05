import Pharmacy from '../models/Pharmacy.js';
import colors from 'colors';

// @desc    Get all pharmacies
// @route   GET /api/pharmacies
// @access  Private
export const getPharmacies = async (req, res) => {
  try {
    const { city, isActive, search } = req.query;
    const user = req.user;
    
    // Build query object
    const query = {};
    
    // If user is a pharmacy supervisor, only show pharmacies assigned to them
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      query.supervisor = user._id;
    }
    
    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const pharmacies = await Pharmacy.find(query)
      .populate('pharmacists', 'firstName lastName email phone username role')
      .populate('supervisor', 'firstName lastName email phone username role')
      .sort({ createdAt: -1 });
    
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
// @access  Private
export const getPharmacy = async (req, res) => {
  try {
    const user = req.user;
    const pharmacy = await Pharmacy.findById(req.params.id)
      .populate('pharmacists', 'firstName lastName email phone username role whatsapp address')
      .populate('supervisor', 'firstName lastName email phone username role whatsapp address');
    
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found',
      });
    }
    
    // If user is a pharmacy supervisor, check if they are the supervisor of this pharmacy
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      if (!pharmacy.supervisor || pharmacy.supervisor._id.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not authorized to view this pharmacy.',
        });
      }
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
// @access  Private
export const createPharmacy = async (req, res) => {
  try {
    const user = req.user;
    
    // If user is a pharmacy supervisor, automatically set them as supervisor
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      req.body.supervisor = user._id;
    }
    
    const pharmacy = await Pharmacy.create(req.body);
    await pharmacy.populate('pharmacists', 'firstName lastName email phone username role whatsapp address');
    await pharmacy.populate('supervisor', 'firstName lastName email phone username role whatsapp address');
    
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
// @access  Private
export const updatePharmacy = async (req, res) => {
  try {
    const user = req.user;
    
    // First, check if pharmacy exists and if user has permission
    const existingPharmacy = await Pharmacy.findById(req.params.id);
    
    if (!existingPharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found',
      });
    }
    
    // If user is a pharmacy supervisor, check if they are the supervisor of this pharmacy
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      if (!existingPharmacy.supervisor || existingPharmacy.supervisor.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not authorized to update this pharmacy.',
        });
      }
      // Prevent supervisor from changing the supervisor field
      delete req.body.supervisor;
    }
    
    // Handle backward compatibility: if pharmacist (singular) is sent, convert to pharmacists array
    const updateData = { ...req.body };
    if (updateData.pharmacist !== undefined && updateData.pharmacists === undefined) {
      // Convert single pharmacist to array
      updateData.pharmacists = updateData.pharmacist ? [updateData.pharmacist] : [];
      delete updateData.pharmacist;
    }
    
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('pharmacists', 'firstName lastName email phone username role whatsapp address')
      .populate('supervisor', 'firstName lastName email phone username role whatsapp address');
    
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
// @access  Private
export const deletePharmacy = async (req, res) => {
  try {
    const user = req.user;
    
    // First, check if pharmacy exists and if user has permission
    const pharmacy = await Pharmacy.findById(req.params.id);
    
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found',
      });
    }
    
    // If user is a pharmacy supervisor, check if they are the supervisor of this pharmacy
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      if (!pharmacy.supervisor || pharmacy.supervisor.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not authorized to delete this pharmacy.',
        });
      }
    }
    
    await Pharmacy.findByIdAndDelete(req.params.id);
    
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

// @desc    Add pharmacist to pharmacy
// @route   POST /api/pharmacies/:id/pharmacists
// @access  Private
export const addPharmacist = async (req, res) => {
  try {
    const user = req.user;
    const { pharmacistId } = req.body;
    
    if (!pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'Pharmacist ID is required',
      });
    }
    
    const pharmacy = await Pharmacy.findById(req.params.id);
    
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found',
      });
    }
    
    // If user is a pharmacy supervisor, check if they are the supervisor of this pharmacy
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      if (!pharmacy.supervisor || pharmacy.supervisor.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not authorized to modify this pharmacy.',
        });
      }
    }
    
    // Initialize pharmacists array if it doesn't exist
    if (!pharmacy.pharmacists) {
      pharmacy.pharmacists = [];
    }
    
    // Check if pharmacist is already assigned (convert ObjectIds to strings for comparison)
    const isAlreadyAssigned = pharmacy.pharmacists.some(
      id => id.toString() === pharmacistId.toString()
    );
    
    if (isAlreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: 'Pharmacist is already assigned to this pharmacy',
      });
    }
    
    // Add pharmacist to array
    pharmacy.pharmacists.push(pharmacistId);
    await pharmacy.save();
    
    await pharmacy.populate('pharmacists', 'firstName lastName email phone username role whatsapp address');
    await pharmacy.populate('supervisor', 'firstName lastName email phone username role whatsapp address');
    
    res.status(200).json({
      success: true,
      message: 'Pharmacist added successfully',
      data: pharmacy,
    });
  } catch (error) {
    console.error('Error adding pharmacist:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error adding pharmacist',
      error: error.message,
    });
  }
};

// @desc    Remove pharmacist from pharmacy
// @route   DELETE /api/pharmacies/:id/pharmacists/:pharmacistId
// @access  Private
export const removePharmacist = async (req, res) => {
  try {
    const user = req.user;
    const { pharmacistId } = req.params;
    
    const pharmacy = await Pharmacy.findById(req.params.id);
    
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found',
      });
    }
    
    // If user is a pharmacy supervisor, check if they are the supervisor of this pharmacy
    if (user && user.role && user.role.toLowerCase() === 'pharmacy supervisor') {
      if (!pharmacy.supervisor || pharmacy.supervisor.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not authorized to modify this pharmacy.',
        });
      }
    }
    
    // Remove pharmacist from array
    pharmacy.pharmacists = pharmacy.pharmacists.filter(
      id => id.toString() !== pharmacistId
    );
    await pharmacy.save();
    
    await pharmacy.populate('pharmacists', 'firstName lastName email phone username role whatsapp address');
    await pharmacy.populate('supervisor', 'firstName lastName email phone username role whatsapp address');
    
    res.status(200).json({
      success: true,
      message: 'Pharmacist removed successfully',
      data: pharmacy,
    });
  } catch (error) {
    console.error('Error removing pharmacist:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error removing pharmacist',
      error: error.message,
    });
  }
};

