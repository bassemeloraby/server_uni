import DetailedSales from '../models/DetailedSales.js';
import Pharmacy from '../models/Pharmacy.js';
import colors from 'colors';

// @desc    Get all detailed sales
// @route   GET /api/detailed-sales
// @access  Public
export const getDetailedSales = async (req, res) => {
  try {
    const { 
      branchCode, 
      invoiceNumber, 
      invoiceDate, 
      invoiceType, 
      salesName, 
      materialNumber,
      startDate,
      endDate,
      search 
    } = req.query;
    
    // Build query object
    const query = {};
    
    if (branchCode) {
      query.BranchCode = parseInt(branchCode);
    }
    
    if (invoiceNumber) {
      query.InvoiceNumber = new RegExp(invoiceNumber, 'i');
    }
    
    if (invoiceDate) {
      const date = new Date(invoiceDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.InvoiceDate = {
        $gte: date,
        $lt: nextDay,
      };
    }
    
    if (startDate && endDate) {
      query.InvoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.InvoiceDate = {
        $gte: new Date(startDate),
      };
    } else if (endDate) {
      query.InvoiceDate = {
        $lte: new Date(endDate),
      };
    }
    
    if (invoiceType) {
      query.InvoiceType = invoiceType;
    }
    
    if (salesName) {
      query.SalesName = new RegExp(salesName, 'i');
    }
    
    if (materialNumber) {
      query.MaterialNumber = parseInt(materialNumber);
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const detailedSales = await DetailedSales.find(query)
      .sort({ InvoiceDate: -1, createdAt: -1 })
      .limit(parseInt(req.query.limit) || 100)
      .skip(parseInt(req.query.skip) || 0);
    
    const total = await DetailedSales.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: detailedSales.length,
      total,
      data: detailedSales,
    });
  } catch (error) {
    console.error('Error fetching detailed sales:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching detailed sales',
      error: error.message,
    });
  }
};

// @desc    Get single detailed sale
// @route   GET /api/detailed-sales/:id
// @access  Public
export const getDetailedSale = async (req, res) => {
  try {
    const detailedSale = await DetailedSales.findById(req.params.id);
    
    if (!detailedSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: detailedSale,
    });
  } catch (error) {
    console.error('Error fetching detailed sale:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching detailed sale',
      error: error.message,
    });
  }
};

// @desc    Create new detailed sale
// @route   POST /api/detailed-sales
// @access  Public
export const createDetailedSale = async (req, res) => {
  try {
    const detailedSale = await DetailedSales.create(req.body);
    
    res.status(201).json({
      success: true,
      data: detailedSale,
    });
  } catch (error) {
    console.error('Error creating detailed sale:'.red, error);
    
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
      message: 'Error creating detailed sale',
      error: error.message,
    });
  }
};

// @desc    Create multiple detailed sales (bulk insert)
// @route   POST /api/detailed-sales/bulk
// @access  Public
export const createBulkDetailedSales = async (req, res) => {
  try {
    const { sales } = req.body;
    
    if (!Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sales array is required and must not be empty',
      });
    }
    
    const detailedSales = await DetailedSales.insertMany(sales, {
      ordered: false,
    });
    
    res.status(201).json({
      success: true,
      count: detailedSales.length,
      data: detailedSales,
    });
  } catch (error) {
    console.error('Error creating bulk detailed sales:'.red, error);
    
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
      message: 'Error creating bulk detailed sales',
      error: error.message,
    });
  }
};

// @desc    Update detailed sale
// @route   PUT /api/detailed-sales/:id
// @access  Public
export const updateDetailedSale = async (req, res) => {
  try {
    const detailedSale = await DetailedSales.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!detailedSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: detailedSale,
    });
  } catch (error) {
    console.error('Error updating detailed sale:'.red, error);
    
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
      message: 'Error updating detailed sale',
      error: error.message,
    });
  }
};

// @desc    Delete detailed sale
// @route   DELETE /api/detailed-sales/:id
// @access  Public
export const deleteDetailedSale = async (req, res) => {
  try {
    const detailedSale = await DetailedSales.findByIdAndDelete(req.params.id);
    
    if (!detailedSale) {
      return res.status(404).json({
        success: false,
        message: 'Detailed sale not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Detailed sale deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting detailed sale:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting detailed sale',
      error: error.message,
    });
  }
};

// @desc    Get sales statistics
// @route   GET /api/detailed-sales/stats/summary
// @access  Public
export const getSalesStatistics = async (req, res) => {
  try {
    const { branchCode, startDate, endDate } = req.query;
    
    const query = {};
    
    if (branchCode) {
      query.BranchCode = parseInt(branchCode);
    }
    
    if (startDate && endDate) {
      query.InvoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const stats = await DetailedSales.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$NetTotal' },
          totalItems: { $sum: '$Quantity' },
          totalDiscount: { $sum: '$TotalDiscount' },
          totalVAT: { $sum: '$TotalVAT' },
          totalDeliveryFees: { $sum: '$DeliveryFees' },
          count: { $sum: 1 },
          averageSale: { $avg: '$NetTotal' },
        },
      },
    ]);
    
    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalSales: 0,
        totalItems: 0,
        totalDiscount: 0,
        totalVAT: 0,
        totalDeliveryFees: 0,
        count: 0,
        averageSale: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching sales statistics:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales statistics',
      error: error.message,
    });
  }
};

// @desc    Get pharmacy statistics by branch code
// @route   GET /api/detailed-sales/stats/pharmacies-by-branch
// @access  Public
export const getPharmaciesByBranchCode = async (req, res) => {
  try {
    // Get all distinct branch codes from detailed sales
    const distinctBranchCodes = await DetailedSales.distinct('BranchCode');
    
    // Aggregate ItemsNetPrice by branch code
    const salesByBranch = await DetailedSales.aggregate([
      {
        $group: {
          _id: '$BranchCode',
          totalSales: { $sum: '$ItemsNetPrice' },
        },
      },
    ]);
    
    // Create a map for quick lookup
    const salesMap = {};
    salesByBranch.forEach((item) => {
      salesMap[item._id] = item.totalSales || 0;
    });
    
    // For each branch code, count how many pharmacies have that branchCode
    const statistics = await Promise.all(
      distinctBranchCodes.map(async (branchCode) => {
        const pharmacyCount = await Pharmacy.countDocuments({ branchCode });
        return {
          branchCode,
          pharmacyCount,
          totalSales: salesMap[branchCode] || 0,
        };
      })
    );
    
    // Sort by branch code
    statistics.sort((a, b) => a.branchCode - b.branchCode);
    
    // Calculate totals
    const totalPharmacies = await Pharmacy.countDocuments();
    const totalBranchCodes = distinctBranchCodes.length;
    const grandTotalSales = statistics.reduce((sum, stat) => sum + stat.totalSales, 0);
    
    res.status(200).json({
      success: true,
      data: {
        statistics,
        summary: {
          totalBranchCodes,
          totalPharmacies,
          totalSales: grandTotalSales,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching pharmacy statistics by branch code:'.red, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacy statistics by branch code',
      error: error.message,
    });
  }
};

