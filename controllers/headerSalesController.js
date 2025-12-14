import HeaderSales from '../models/HeaderSales.js';
import colors from 'colors';

// @desc    Get all header sales
// @route   GET /api/header-sales
// @access  Private
export const getHeaderSales = async (req, res) => {
  try {
    const { 
      StoreCode, 
      InvoiceNumber,
      Year,
      Month,
      Date,
      InvoiceType,
      UserName,
      CustomerName,
      ConsumerName,
      minAmount,
      maxAmount,
      page = 1,
      limit = 50,
      sortByDate,
      sortByAmount
    } = req.query;
    
    // Build query object
    const query = {};
    
    if (StoreCode) {
      query.StoreCode = parseInt(StoreCode);
    }
    
    if (InvoiceNumber) {
      query.InvoiceNumber = new RegExp(InvoiceNumber, 'i');
    }
    
    if (Year) {
      query.Year = parseInt(Year);
    }
    
    if (Month) {
      query.Month = Month;
    }
    
    if (Date) {
      query.Date = new Date(Date);
    }
    
    if (InvoiceType) {
      query.InvoiceType = new RegExp(InvoiceType, 'i');
    }
    
    if (UserName) {
      query.UserName = new RegExp(UserName, 'i');
    }
    
    if (CustomerName) {
      query.CustomerName = new RegExp(CustomerName, 'i');
    }
    
    if (ConsumerName) {
      query.ConsumerName = new RegExp(ConsumerName, 'i');
    }
    
    if (minAmount || maxAmount) {
      query.TotalAmountAfterDiscount = {};
      if (minAmount) {
        query.TotalAmountAfterDiscount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        query.TotalAmountAfterDiscount.$lte = parseFloat(maxAmount);
      }
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Determine sort order
    let sortOrder = { createdAt: -1 }; // Default sort
    if (sortByDate === 'desc' || sortByDate === 'true') {
      sortOrder = { Date: -1 };
    } else if (sortByDate === 'asc') {
      sortOrder = { Date: 1 };
    } else if (sortByAmount === 'desc' || sortByAmount === 'true') {
      sortOrder = { TotalAmountAfterDiscount: -1 };
    } else if (sortByAmount === 'asc') {
      sortOrder = { TotalAmountAfterDiscount: 1 };
    }
    
    const headerSales = await HeaderSales.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum);
    
    const total = await HeaderSales.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: headerSales.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: headerSales,
    });
  } catch (error) {
    console.error('Error fetching header sales:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching header sales',
      error: error.message,
    });
  }
};

// @desc    Get single header sale
// @route   GET /api/header-sales/:id
// @access  Private
export const getHeaderSale = async (req, res) => {
  try {
    const headerSale = await HeaderSales.findById(req.params.id);
    
    if (!headerSale) {
      return res.status(404).json({
        success: false,
        message: 'Header sale not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: headerSale,
    });
  } catch (error) {
    console.error('Error fetching header sale:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching header sale',
      error: error.message,
    });
  }
};

// @desc    Create new header sale
// @route   POST /api/header-sales
// @access  Private
export const createHeaderSale = async (req, res) => {
  try {
    const headerSale = await HeaderSales.create(req.body);
    
    res.status(201).json({
      success: true,
      data: headerSale,
    });
  } catch (error) {
    console.error('Error creating header sale:'.red, error);
    
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
      message: 'Error creating header sale',
      error: error.message,
    });
  }
};

// @desc    Update header sale
// @route   PUT /api/header-sales/:id
// @access  Private
export const updateHeaderSale = async (req, res) => {
  try {
    const headerSale = await HeaderSales.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!headerSale) {
      return res.status(404).json({
        success: false,
        message: 'Header sale not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: headerSale,
    });
  } catch (error) {
    console.error('Error updating header sale:'.red, error);
    
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
      message: 'Error updating header sale',
      error: error.message,
    });
  }
};

// @desc    Delete header sale
// @route   DELETE /api/header-sales/:id
// @access  Private
export const deleteHeaderSale = async (req, res) => {
  try {
    const headerSale = await HeaderSales.findByIdAndDelete(req.params.id);
    
    if (!headerSale) {
      return res.status(404).json({
        success: false,
        message: 'Header sale not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Header sale deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting header sale:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting header sale',
      error: error.message,
    });
  }
};

// @desc    Bulk create header sales
// @route   POST /api/header-sales/bulk
// @access  Private
export const bulkCreateHeaderSales = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty',
      });
    }
    
    const headerSales = await HeaderSales.insertMany(items, {
      ordered: false,
    });
    
    res.status(201).json({
      success: true,
      count: headerSales.length,
      data: headerSales,
    });
  } catch (error) {
    console.error('Error bulk creating header sales:'.red, error);
    
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
      message: 'Error bulk creating header sales',
      error: error.message,
    });
  }
};

