import Contest from '../models/Contest.js';
import colors from 'colors';

// @desc    Get all contests
// @route   GET /api/contests
// @access  Private - Admin only
export const getContests = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access contests
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view contests.',
        reason: 'You must be an administrator to access contests.',
      });
    }
    
    const { 
      Company, 
      Category, 
      search,
      minPrice,
      maxPrice,
      minIncentive,
      maxIncentive,
      page = 1,
      limit = 50,
      sortByPrice,
      sortByIncentive
    } = req.query;
    
    // Build query object
    const query = {};
    
    if (Company) {
      query.Company = new RegExp(Company, 'i');
    }
    
    if (Category) {
      query.Category = new RegExp(Category, 'i');
    }
    
    if (search) {
      query.$text = { $search: search };
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
    
    if (minIncentive || maxIncentive) {
      query.Incentive = {};
      if (minIncentive) {
        query.Incentive.$gte = parseFloat(minIncentive);
      }
      if (maxIncentive) {
        query.Incentive.$lte = parseFloat(maxIncentive);
      }
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Determine sort order
    let sortOrder = { createdAt: -1 }; // Default sort
    if (sortByPrice === 'desc' || sortByPrice === 'true') {
      sortOrder = { Price: -1 };
    } else if (sortByPrice === 'asc') {
      sortOrder = { Price: 1 };
    } else if (sortByIncentive === 'desc' || sortByIncentive === 'true') {
      sortOrder = { Incentive: -1 };
    } else if (sortByIncentive === 'asc') {
      sortOrder = { Incentive: 1 };
    }
    
    const contests = await Contest.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum);
    
    const total = await Contest.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: contests.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: contests,
    });
  } catch (error) {
    console.error('Error fetching contests:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contests',
      error: error.message,
    });
  }
};

// @desc    Get single contest
// @route   GET /api/contests/:id
// @access  Private - Admin only
export const getContest = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access contests
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view contests.',
        reason: 'You must be an administrator to access contests.',
      });
    }
    
    const contest = await Contest.findById(req.params.id);
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: contest,
    });
  } catch (error) {
    console.error('Error fetching contest:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contest',
      error: error.message,
    });
  }
};

// @desc    Create new contest
// @route   POST /api/contests
// @access  Private - Admin only
export const createContest = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can create contests
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can create contests.',
        reason: 'You must be an administrator to create contests.',
      });
    }
    
    const contest = await Contest.create(req.body);
    
    res.status(201).json({
      success: true,
      data: contest,
    });
  } catch (error) {
    console.error('Error creating contest:'.red, error);
    
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
      message: 'Error creating contest',
      error: error.message,
    });
  }
};

// @desc    Update contest
// @route   PUT /api/contests/:id
// @access  Private - Admin only
export const updateContest = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can update contests
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can update contests.',
        reason: 'You must be an administrator to update contests.',
      });
    }
    
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: contest,
    });
  } catch (error) {
    console.error('Error updating contest:'.red, error);
    
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
      message: 'Error updating contest',
      error: error.message,
    });
  }
};

// @desc    Delete contest
// @route   DELETE /api/contests/:id
// @access  Private - Admin only
export const deleteContest = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can delete contests
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete contests.',
        reason: 'You must be an administrator to delete contests.',
      });
    }
    
    const contest = await Contest.findByIdAndDelete(req.params.id);
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Contest deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting contest:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contest',
      error: error.message,
    });
  }
};

// @desc    Bulk create contests
// @route   POST /api/contests/bulk
// @access  Private - Admin only
export const bulkCreateContests = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can bulk create contests
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can bulk create contests.',
        reason: 'You must be an administrator to bulk create contests.',
      });
    }
    
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty',
      });
    }
    
    const contests = await Contest.insertMany(items, {
      ordered: false,
    });
    
    res.status(201).json({
      success: true,
      count: contests.length,
      data: contests,
    });
  } catch (error) {
    console.error('Error bulk creating contests:'.red, error);
    
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
      message: 'Error bulk creating contests',
      error: error.message,
    });
  }
};
