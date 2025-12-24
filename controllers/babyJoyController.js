import BabyJoy from '../models/BabyJoy.js';
import colors from 'colors';

// @desc    Get all baby joy items
// @route   GET /api/baby-joy
// @access  Private - Admin or users with /baby-joy in allowedPages
export const getBabyJoyItems = async (req, res) => {
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
    
    // Check if user has access to baby-joy page
    const allowedPages = user.allowedPages || [];
    const hasPageAccess = allowedPages.includes('/baby-joy');
    
    if (!isAdmin && !hasPageAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view baby joy items.',
        reason: 'You must be an administrator or have been granted access to baby joy items.',
      });
    }
    
    const { 
      Material,
      Brand,
      Form,
      search,
      description,
      minPrice,
      maxPrice,
      page = 1,
      limit = 50,
      sortByPrice
    } = req.query;
    
    // Build query object
    const query = {};
    
    if (Material) {
      query.Material = Material;
    }
    
    if (Brand) {
      query.Brand = new RegExp(Brand, 'i');
    }
    
    if (Form) {
      query.Form = new RegExp(Form, 'i');
    }
    
    if (search) {
      // Check if search is a number (Material)
      const searchAsNumber = parseInt(search);
      if (!isNaN(searchAsNumber) && searchAsNumber.toString() === search.trim()) {
        // Search by Material if it's a valid number
        query.Material = searchAsNumber;
      } else {
        // Use regex search for Brand, Form, and SapDescription fields
        query.$or = [
          { Brand: new RegExp(search, 'i') },
          { Form: new RegExp(search, 'i') },
          { SapDescription: new RegExp(search, 'i') }
        ];
      }
    }
    
    if (description) {
      // Search for material detail (case-insensitive partial match)
      query.MaterialDetail = new RegExp(description, 'i');
    }
    
    if (minPrice || maxPrice) {
      query.Price = {};
      if (minPrice) {
        const minStr = String(minPrice).trim();
        if (minStr !== '') {
          const min = parseFloat(minStr);
          if (!isNaN(min) && isFinite(min)) {
            query.Price.$gte = min;
          }
        }
      }
      if (maxPrice) {
        const maxStr = String(maxPrice).trim();
        if (maxStr !== '') {
          const max = parseFloat(maxStr);
          if (!isNaN(max) && isFinite(max)) {
            query.Price.$lte = max;
          }
        }
      }
      // Only add Price filter if at least one valid value was set
      if (Object.keys(query.Price).length === 0) {
        delete query.Price;
      }
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Determine sort order
    let sortOrder = { createdAt: -1 }; // Default sort
    if (sortByPrice === 'desc' || sortByPrice === 'true') {
      sortOrder = { 
        Price: -1, 
        createdAt: -1 
      };
    } else if (sortByPrice === 'asc') {
      sortOrder = { 
        Price: 1, 
        createdAt: -1 
      };
    }
    
    // Query with sort applied to ALL matching documents before pagination
    const babyJoyItems = await BabyJoy.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum);
    
    const total = await BabyJoy.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: babyJoyItems.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: babyJoyItems,
    });
  } catch (error) {
    console.error('Error fetching baby joy items:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching baby joy items',
      error: error.message,
    });
  }
};

// @desc    Get single baby joy item
// @route   GET /api/baby-joy/:id
// @access  Private - Admin only
export const getBabyJoyItem = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access baby joy items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view baby joy items.',
        reason: 'You must be an administrator to access baby joy items.',
      });
    }
    
    const babyJoyItem = await BabyJoy.findById(req.params.id);
    
    if (!babyJoyItem) {
      return res.status(404).json({
        success: false,
        message: 'Baby joy item not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: babyJoyItem,
    });
  } catch (error) {
    console.error('Error fetching baby joy item:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching baby joy item',
      error: error.message,
    });
  }
};

// @desc    Create new baby joy item
// @route   POST /api/baby-joy
// @access  Private - Admin only
export const createBabyJoyItem = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can create baby joy items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can create baby joy items.',
        reason: 'You must be an administrator to create baby joy items.',
      });
    }
    
    const babyJoyItem = await BabyJoy.create(req.body);
    
    res.status(201).json({
      success: true,
      data: babyJoyItem,
    });
  } catch (error) {
    console.error('Error creating baby joy item:'.red, error);
    
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
        message: 'Duplicate Material Code',
        error: 'A baby joy item with this Material code already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating baby joy item',
      error: error.message,
    });
  }
};

// @desc    Update baby joy item
// @route   PUT /api/baby-joy/:id
// @access  Private - Admin only
export const updateBabyJoyItem = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can update baby joy items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can update baby joy items.',
        reason: 'You must be an administrator to update baby joy items.',
      });
    }
    
    const babyJoyItem = await BabyJoy.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!babyJoyItem) {
      return res.status(404).json({
        success: false,
        message: 'Baby joy item not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: babyJoyItem,
    });
  } catch (error) {
    console.error('Error updating baby joy item:'.red, error);
    
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
        message: 'Duplicate Material Code',
        error: 'A baby joy item with this Material code already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating baby joy item',
      error: error.message,
    });
  }
};

// @desc    Delete baby joy item
// @route   DELETE /api/baby-joy/:id
// @access  Private - Admin only
export const deleteBabyJoyItem = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can delete baby joy items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete baby joy items.',
        reason: 'You must be an administrator to delete baby joy items.',
      });
    }
    
    const babyJoyItem = await BabyJoy.findByIdAndDelete(req.params.id);
    
    if (!babyJoyItem) {
      return res.status(404).json({
        success: false,
        message: 'Baby joy item not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Baby joy item deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting baby joy item:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting baby joy item',
      error: error.message,
    });
  }
};

// @desc    Get unique filter values (Brands and Forms)
// @route   GET /api/baby-joy/filters
// @access  Private - Admin or users with /baby-joy in allowedPages
export const getBabyJoyFilters = async (req, res) => {
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
    
    // Check if user has access to baby-joy page
    const allowedPages = user.allowedPages || [];
    const hasPageAccess = allowedPages.includes('/baby-joy');
    
    if (!isAdmin && !hasPageAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view baby joy items.',
        reason: 'You must be an administrator or have been granted access to baby joy items.',
      });
    }
    
    // Get distinct brands and forms
    const brands = await BabyJoy.distinct('Brand', { Brand: { $exists: true, $ne: null } });
    const forms = await BabyJoy.distinct('Form', { Form: { $exists: true, $ne: null } });
    
    res.status(200).json({
      success: true,
      data: {
        brands: brands.filter(Boolean).sort(),
        forms: forms.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error('Error fetching baby joy filters:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching baby joy filters',
      error: error.message,
    });
  }
};

// @desc    Bulk create baby joy items
// @route   POST /api/baby-joy/bulk
// @access  Private - Admin only
export const bulkCreateBabyJoyItems = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can bulk create baby joy items
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can bulk create baby joy items.',
        reason: 'You must be an administrator to bulk create baby joy items.',
      });
    }
    
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty',
      });
    }
    
    const babyJoyItems = await BabyJoy.insertMany(items, {
      ordered: false,
    });
    
    res.status(201).json({
      success: true,
      count: babyJoyItems.length,
      data: babyJoyItems,
    });
  } catch (error) {
    console.error('Error bulk creating baby joy items:'.red, error);
    
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
      message: 'Error bulk creating baby joy items',
      error: error.message,
    });
  }
};

