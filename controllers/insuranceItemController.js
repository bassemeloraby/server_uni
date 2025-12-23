import InsuranceItem from '../models/InsuranceItem.js';
import colors from 'colors';

// @desc    Get all insurance items
// @route   GET /api/insurance-items
// @access  Private - Admin or users with /insurance-items in allowedPages
export const getInsuranceItems = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route.',
      });
    }

    // Admins have access to all pages
    const isAdmin = user.role && user.role.toLowerCase() === 'admin';
    
    // Check if user has access to insurance-items page
    const allowedPages = user.allowedPages || [];
    const hasPageAccess = allowedPages.includes('/insurance-items');
    
    if (!isAdmin && !hasPageAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view insurance items.',
        reason: 'You must be an administrator or have been granted access to insurance items.',
      });
    }

    const {
      Category,
      search,
      description,
      minSapCode,
      maxSapCode,
      page = 1,
      limit = 50,
      sortBySapCode,
    } = req.query;

    const query = {};

    if (Category) {
      query.Category = new RegExp(Category, 'i');
    }

    if (description) {
      query.description = new RegExp(description, 'i');
    }

    if (search) {
      const searchAsNumber = parseInt(search);
      if (!isNaN(searchAsNumber) && searchAsNumber.toString() === search.trim()) {
        query.SAP_Code = searchAsNumber;
      } else {
        query.$or = [
          { Category: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
        ];
      }
    }

    if (minSapCode || maxSapCode) {
      query.SAP_Code = {};
      if (minSapCode) {
        query.SAP_Code.$gte = parseInt(minSapCode);
      }
      if (maxSapCode) {
        query.SAP_Code.$lte = parseInt(maxSapCode);
      }
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let sortOrder = { createdAt: -1 };
    if (sortBySapCode === 'asc') {
      sortOrder = { SAP_Code: 1 };
    } else if (sortBySapCode === 'desc' || sortBySapCode === 'true') {
      sortOrder = { SAP_Code: -1 };
    }

    const insuranceItems = await InsuranceItem.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum);

    const total = await InsuranceItem.countDocuments(query);

    res.status(200).json({
      success: true,
      count: insuranceItems.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: insuranceItems,
    });
  } catch (error) {
    console.error('Error fetching insurance items:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance items',
      error: error.message,
    });
  }
};

// @desc    Get single insurance item
// @route   GET /api/insurance-items/:id
// @access  Private - Admin or users with /insurance-items in allowedPages
export const getInsuranceItem = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route.',
      });
    }

    // Admins have access to all pages
    const isAdmin = user.role && user.role.toLowerCase() === 'admin';
    
    // Check if user has access to insurance-items page
    const allowedPages = user.allowedPages || [];
    const hasPageAccess = allowedPages.includes('/insurance-items');
    
    if (!isAdmin && !hasPageAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view insurance items.',
        reason: 'You must be an administrator or have been granted access to insurance items.',
      });
    }
    
    const insuranceItem = await InsuranceItem.findById(req.params.id);

    if (!insuranceItem) {
      return res.status(404).json({
        success: false,
        message: 'Insurance item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: insuranceItem,
    });
  } catch (error) {
    console.error('Error fetching insurance item:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insurance item',
      error: error.message,
    });
  }
};

// @desc    Create new insurance item
// @route   POST /api/insurance-items
// @access  Private - Admin only
export const createInsuranceItem = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can create insurance items.',
        reason: 'You must be an administrator to create insurance items.',
      });
    }

    const insuranceItem = await InsuranceItem.create(req.body);

    res.status(201).json({
      success: true,
      data: insuranceItem,
    });
  } catch (error) {
    console.error('Error creating insurance item:'.red, error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate SAP Code',
        error: 'An insurance item with this SAP Code already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating insurance item',
      error: error.message,
    });
  }
};

// @desc    Update insurance item
// @route   PUT /api/insurance-items/:id
// @access  Private - Admin only
export const updateInsuranceItem = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can update insurance items.',
        reason: 'You must be an administrator to update insurance items.',
      });
    }

    const insuranceItem = await InsuranceItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!insuranceItem) {
      return res.status(404).json({
        success: false,
        message: 'Insurance item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: insuranceItem,
    });
  } catch (error) {
    console.error('Error updating insurance item:'.red, error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate SAP Code',
        error: 'An insurance item with this SAP Code already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating insurance item',
      error: error.message,
    });
  }
};

// @desc    Delete insurance item
// @route   DELETE /api/insurance-items/:id
// @access  Private - Admin only
export const deleteInsuranceItem = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete insurance items.',
        reason: 'You must be an administrator to delete insurance items.',
      });
    }

    const insuranceItem = await InsuranceItem.findByIdAndDelete(req.params.id);

    if (!insuranceItem) {
      return res.status(404).json({
        success: false,
        message: 'Insurance item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Insurance item deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting insurance item:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting insurance item',
      error: error.message,
    });
  }
};

// @desc    Bulk create insurance items
// @route   POST /api/insurance-items/bulk
// @access  Private - Admin only
export const bulkCreateInsuranceItems = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can bulk create insurance items.',
        reason: 'You must be an administrator to bulk create insurance items.',
      });
    }

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty',
      });
    }

    const insuranceItems = await InsuranceItem.insertMany(items, {
      ordered: false,
    });

    res.status(201).json({
      success: true,
      count: insuranceItems.length,
      data: insuranceItems,
    });
  } catch (error) {
    console.error('Error bulk creating insurance items:'.red, error);

    if (error.writeErrors) {
      return res.status(400).json({
        success: false,
        message: 'Some items failed to create',
        errors: error.writeErrors.map(err => ({
          index: err.index,
          error: err.errmsg,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error bulk creating insurance items',
      error: error.message,
    });
  }
};

