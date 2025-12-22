import IncentiveItem from '../models/IncentiveItem.js';
import colors from 'colors';

// @desc    Get all incentive items
// @route   GET /api/incentive-items
// @access  Private - Admin only
export const getIncentiveItems = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access incentive items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view incentive items.',
        reason: 'You must be an administrator to access incentive items.',
      });
    }
    
    const { 
      Class, 
      Category, 
      'Sub category': SubCategory, 
      Division,
      search,
      description,
      minPrice,
      maxPrice,
      page = 1,
      limit = 50,
      sortByIncentiveValue,
      sortByPrice
    } = req.query;
    
    // Build query object
    const query = {};
    
    if (Class) {
      query.Class = Class;
    }
    
    if (Category) {
      query.Category = new RegExp(Category, 'i');
    }
    
    if (SubCategory) {
      query.Sub_category = new RegExp(SubCategory, 'i');
    }
    
    if (Division) {
      query.Division = new RegExp(Division, 'i');
    }
    
    if (search) {
      // Check if search is a number (SAP Code)
      const searchAsNumber = parseInt(search);
      if (!isNaN(searchAsNumber) && searchAsNumber.toString() === search.trim()) {
        // Search by SAP Code if it's a valid number
        query.SAP_Code = searchAsNumber;
      } else {
        // Use regex search for Category, Division, and Description fields
        query.$or = [
          { Category: new RegExp(search, 'i') },
          { Division: new RegExp(search, 'i') },
          { Description: new RegExp(search, 'i') }
        ];
      }
    }
    
    if (description) {
      // Search for description (case-insensitive partial match)
      query.Description = new RegExp(description, 'i');
    }
    
    if (minPrice || maxPrice) {
      query.Price = {};
      if (minPrice) {
        query.Price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.Price.$lte = parseFloat(maxPrice);
      }
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Determine sort order (priority: sortByPrice > sortByIncentiveValue > default)
    // Sort all data at database level before pagination
    let sortOrder = { createdAt: -1 }; // Default sort
    if (sortByPrice === 'desc' || sortByPrice === 'true') {
      // Sort by price descending, null values last, then by createdAt for consistency
      sortOrder = { 
        Price: -1, 
        createdAt: -1 
      };
    } else if (sortByPrice === 'asc') {
      // Sort by price ascending, null values last, then by createdAt for consistency
      sortOrder = { 
        Price: 1, 
        createdAt: -1 
      };
    } else if (sortByIncentiveValue === 'desc' || sortByIncentiveValue === 'true') {
      // Sort by incentive value descending, null values last, then by createdAt for consistency
      sortOrder = { 
        incentive_value: -1, 
        createdAt: -1 
      };
    } else if (sortByIncentiveValue === 'asc') {
      // Sort by incentive value ascending, null values last, then by createdAt for consistency
      sortOrder = { 
        incentive_value: 1, 
        createdAt: -1 
      };
    }
    
    // Query with sort applied to ALL matching documents before pagination
    const incentiveItems = await IncentiveItem.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum);
    
    const total = await IncentiveItem.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: incentiveItems.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: incentiveItems,
    });
  } catch (error) {
    console.error('Error fetching incentive items:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching incentive items',
      error: error.message,
    });
  }
};

// @desc    Get single incentive item
// @route   GET /api/incentive-items/:id
// @access  Private - Admin only
export const getIncentiveItem = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access incentive items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view incentive items.',
        reason: 'You must be an administrator to access incentive items.',
      });
    }
    
    const incentiveItem = await IncentiveItem.findById(req.params.id);
    
    if (!incentiveItem) {
      return res.status(404).json({
        success: false,
        message: 'Incentive item not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: incentiveItem,
    });
  } catch (error) {
    console.error('Error fetching incentive item:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching incentive item',
      error: error.message,
    });
  }
};

// @desc    Create new incentive item
// @route   POST /api/incentive-items
// @access  Private - Admin only
export const createIncentiveItem = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can create incentive items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can create incentive items.',
        reason: 'You must be an administrator to create incentive items.',
      });
    }
    
    // Calculate incentive value if not provided
    if (req.body.Price && req.body.IncentivePercentage && !req.body['incentive value']) {
      req.body['incentive value'] = req.body.Price * req.body.IncentivePercentage;
    }
    
    const incentiveItem = await IncentiveItem.create(req.body);
    
    res.status(201).json({
      success: true,
      data: incentiveItem,
    });
  } catch (error) {
    console.error('Error creating incentive item:'.red, error);
    
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
        error: 'An incentive item with this SAP Code already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating incentive item',
      error: error.message,
    });
  }
};

// @desc    Update incentive item
// @route   PUT /api/incentive-items/:id
// @access  Private - Admin only
export const updateIncentiveItem = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can update incentive items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can update incentive items.',
        reason: 'You must be an administrator to update incentive items.',
      });
    }
    
    // Recalculate incentive value if Price or IncentivePercentage is updated
    if (req.body.Price || req.body.IncentivePercentage) {
      const existingItem = await IncentiveItem.findById(req.params.id);
      if (existingItem) {
        const price = req.body.Price !== undefined ? req.body.Price : existingItem.Price;
        const percentage = req.body.IncentivePercentage !== undefined 
          ? req.body.IncentivePercentage 
          : existingItem.IncentivePercentage;
        
        if (price && percentage) {
          req.body['incentive value'] = price * percentage;
        }
      }
    }
    
    const incentiveItem = await IncentiveItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!incentiveItem) {
      return res.status(404).json({
        success: false,
        message: 'Incentive item not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: incentiveItem,
    });
  } catch (error) {
    console.error('Error updating incentive item:'.red, error);
    
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
        error: 'An incentive item with this SAP Code already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating incentive item',
      error: error.message,
    });
  }
};

// @desc    Delete incentive item
// @route   DELETE /api/incentive-items/:id
// @access  Private - Admin only
export const deleteIncentiveItem = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can delete incentive items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete incentive items.',
        reason: 'You must be an administrator to delete incentive items.',
      });
    }
    
    const incentiveItem = await IncentiveItem.findByIdAndDelete(req.params.id);
    
    if (!incentiveItem) {
      return res.status(404).json({
        success: false,
        message: 'Incentive item not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Incentive item deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting incentive item:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting incentive item',
      error: error.message,
    });
  }
};

// @desc    Bulk create incentive items
// @route   POST /api/incentive-items/bulk
// @access  Private - Admin only
export const bulkCreateIncentiveItems = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can bulk create incentive items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can bulk create incentive items.',
        reason: 'You must be an administrator to bulk create incentive items.',
      });
    }
    
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty',
      });
    }
    
    // Calculate incentive value for items that don't have it
    const processedItems = items.map(item => {
      if (item.Price && item.IncentivePercentage && !item['incentive value']) {
        item['incentive value'] = item.Price * item.IncentivePercentage;
      }
      return item;
    });
    
    const incentiveItems = await IncentiveItem.insertMany(processedItems, {
      ordered: false,
    });
    
    res.status(201).json({
      success: true,
      count: incentiveItems.length,
      data: incentiveItems,
    });
  } catch (error) {
    console.error('Error bulk creating incentive items:'.red, error);
    
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
      message: 'Error bulk creating incentive items',
      error: error.message,
    });
  }
};
